import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../src/lib/prisma";
import { buildArticlePrompts, buildSystemPrompt, type AIProvider, type GenerateArticleInput } from "../src/lib/ai/types";
import { AffiliatePromptTemplateService, DEFAULT_AFFILIATE_PROMPT_TEMPLATES } from "../src/lib/affiliate/prompt-template-service";
import { ProductReviewGenerator } from "../src/lib/affiliate/generators/review-generator";
import { ProductComparisonGenerator } from "../src/lib/affiliate/generators/comparison-generator";
import { withTestWorkspace } from "./phase30/fixture";
import { OpenAIProvider } from "../src/lib/ai/providers/openai";
import { OpenAICompatibleProvider } from "../src/lib/ai/providers/openai-compatible";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import { AnthropicProvider } from "../src/lib/ai/providers/anthropic";
import type { CommercialArticleType } from "../src/lib/affiliate/types";

test("all four provider requests carry commercial instructions without the RSS wrapper", async (t) => {
  const requests: string[] = [];
  const output = JSON.stringify({ relevant: true, score: 8, title: "Review", content: "<p>Review</p>" });
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    requests.push(await new Request(url, init).text());
    return Response.json({
      choices: [{ message: { content: output } }],
      candidates: [{ content: { parts: [{ text: output }] } }],
      content: [{ type: "text", text: output }],
    });
  });
  const config = { apiKey: "fixture-not-a-secret", baseUrl: "https://fixture.invalid", model: "fixture" };
  const providers = [
    new OpenAIProvider({ ...config, provider: "openai" }),
    new OpenAICompatibleProvider({ ...config, provider: "openai-compatible" }),
    new GeminiProvider({ ...config, provider: "gemini" }),
    new AnthropicProvider({ ...config, provider: "anthropic" }),
  ];
  for (const provider of providers) {
    const result = await provider.generateArticle({
      originalTitle: "Produto", originalDescription: "Contexto comercial único",
      systemPrompt: "Instruções comerciais únicas", categories: [],
    });
    assert.equal(result.title, "Review");
  }
  assert.equal(requests.length, 4);
  for (const request of requests) {
    assert.match(request, /Instruções comerciais únicas/);
    assert.match(request, /Contexto comercial único/);
    assert.ok(!request.includes("seguinte notícia"));
  }
});

test("RSS preserves its prompt and commercial instructions replace the news task", () => {
  const input: GenerateArticleInput = {
    originalTitle: "Notícia", originalDescription: "Descrição", originalContent: "Matéria completa", categories: [],
  };
  const rss = buildArticlePrompts(input);
  assert.equal(rss.systemPrompt, buildSystemPrompt());
  assert.match(rss.userPrompt, /Analise e reescreva a seguinte notícia/);
  assert.match(rss.userPrompt, /Matéria completa/);
  const commercial = buildArticlePrompts({ ...input, systemPrompt: "Instruções comerciais" });
  assert.deepEqual(commercial, { systemPrompt: "Instruções comerciais", userPrompt: "Descrição" });
  assert.deepEqual(buildArticlePrompts({ ...input, systemPrompt: "  " }), rss);
});

test("review and comparison generation deliver effective instructions and evidence to AI", async (t) => {
  await withTestWorkspace(async (workspaceId) => {
    const captured: GenerateArticleInput[] = [];
    const provider: AIProvider = {
      name: "Fixture", model: "no-network",
      async testConnection() { return { connected: true, provider: "fixture", model: "no-network" }; },
      async generateArticle(input) {
        captured.push(input);
        return {
          relevant: true, score: 8, title: "Análise documental", summary: "Resumo",
          content: "<h2>Veredito rápido</h2><p>Análise baseada nos dados cadastrados.</p>",
          suggestedCategoryId: null, tags: [], seoFocusKeyword: "produto", seoTitle: "Análise", seoDescription: "Resumo",
        };
      },
    };
    // Isolate the supplied template version without changing the global prompt history.
    t.mock.method(AffiliatePromptTemplateService, "getEffectiveTemplate", async (_workspaceId: string, type: CommercialArticleType) => ({
      ...DEFAULT_AFFILIATE_PROMPT_TEMPLATES[type], version: 999, isCustomOverride: false, workspaceId: null,
    }));
    const first = await prisma.product.create({ data: {
      workspaceId, name: "Aspirador de teste A", slug: "fixture-a", description: "Descrição editorial única",
      sourceDescription: "Descrição importada única", sourceSpecs: { potencia: "30 W" },
      specs: { reservatorio: "250 ml" }, pros: ["Filtro lavável"], cons: ["Reservatório pequeno"],
      reviewSamples: { create: [{ workspaceId, provider: "MERCADO_LIVRE", text: "Relato qualitativo único" }] },
      referenceSources: { create: [{ workspaceId, url: "https://example.com/analise", title: "Fonte externa única", summary: "Resumo documental", status: "READY" }] },
    } });
    const second = await prisma.product.create({ data: { workspaceId, name: "Aspirador de teste B", slug: "fixture-b" } });
    const review = await ProductReviewGenerator.generate({ workspaceId, productId: first.id, aiProvider: provider });
    const comparison = await ProductComparisonGenerator.generate({ workspaceId, productIds: [first.id, second.id], aiProvider: provider });
    for (const [index, type] of (["PRODUCT_REVIEW", "COMPARISON"] as const).entries()) {
      const definition = DEFAULT_AFFILIATE_PROMPT_TEMPLATES[type];
      assert.equal(captured[index].systemPrompt, definition.systemPrompt);
      assert.equal(AffiliatePromptTemplateService.validateTemplateVariables(definition.userPromptTemplate, type).valid, true);
      const context = captured[index].originalDescription!;
      for (const fact of ["Descrição editorial única", "Descrição importada única", "30 W", "250 ml", "Relato qualitativo único", "Fonte externa única"]) {
        assert.ok(context.includes(fact), `Missing ${fact} in ${type}`);
      }
      assert.ok(!context.includes("{{"));
      assert.ok(!context.includes("affiliateUrl"));
      assert.match(context, /Preço sob consulta/);
    }
    assert.equal(review.article.status, "PENDING");
    assert.equal(comparison.article.status, "PENDING");
    const reviewRelation = await prisma.articleProduct.findFirstOrThrow({ where: { articleId: review.article.id } });
    assert.equal(reviewRelation.badge, null);
    assert.equal(reviewRelation.recommendation, null);
    assert.ok(review.canonicalDocument.blocks.some(b => b.type === "RICH_TEXT" && (b.data as { html?: string }).html?.includes("Veredito rápido")));
    assert.ok(comparison.canonicalDocument.blocks.every(b => b.type !== "PRODUCT_COMPARISON" || !b.data.highlightBestId));
    const relations = await prisma.articleProduct.findMany({ where: { articleId: comparison.article.id } });
    assert.equal(relations.length, 2);
    assert.ok(relations.every(r => r.badge === null && r.recommendation === null));
  });
});
