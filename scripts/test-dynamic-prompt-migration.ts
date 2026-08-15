import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { setConfig, deleteConfig } from "../src/lib/config";
import { encrypt } from "../src/lib/crypto";
import {
  createAIProvider,
  processArticleWithAi,
  PromptSettings,
} from "../src/lib/ai";

async function main() {
  console.log("=== RUNNING TASK 026 (MIGRATE PROVIDERS TO DYNAMIC PROMPT) TESTS ===");

  const mockPort = 9877;
  const recordedBodies: Array<{ url: string; body: string }> = [];

  const sampleArticlePayload = {
    relevant: true,
    score: 9.0,
    title: "Matéria Teste Prompt Dinâmico",
    summary: "Resumo da matéria gerada com prompt dinâmico.",
    content: "<p>Conteúdo de teste com prompt editorial dinâmico.</p>",
    suggestedCategoryId: "cat-1",
    tags: ["teste", "dinamico"],
    seoFocusKeyword: "prompt dinamico",
    seoTitle: "SEO Title Teste",
    seoDescription: "SEO Description Teste",
  };

  const mockServer = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      recordedBodies.push({ url: req.url || "", body: raw });

      if (req.url?.includes("/models/")) {
        // Gemini
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(sampleArticlePayload) }] } }]
        }));
        return;
      }

      if (req.url?.includes("/v1/messages")) {
        // Anthropic
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          content: [{ text: JSON.stringify(sampleArticlePayload) }]
        }));
        return;
      }

      // OpenAI / OpenAI-Compatible (/chat/completions)
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(sampleArticlePayload) } }]
      }));
    });
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  console.log(`✓ Mock AI API Server running on port ${mockPort}`);

  const mockBaseUrl = `http://localhost:${mockPort}`;

  try {
    const customSettings: PromptSettings = {
      portalArea: "Finanças e Cripto",
      customPortalArea: "",
      writingStyles: ["Analítico", "Persuasivo"],
      customWritingStyle: "",
    };

    const baseInput = {
      originalTitle: "Bitcoin atinge novos recordes em 2026",
      originalDescription: "Criptomoeda valoriza após nova regulação global.",
      categories: [{ id: "cat-1", name: "Finanças", slug: "financas" }],
    };

    // 1. Test OpenAI Provider with & without promptSettings
    console.log("1. Testing OpenAI Provider with default and custom promptSettings...");
    const openai = createAIProvider({
      provider: "openai",
      apiKey: "fake-key",
      model: "gpt-4o-mini",
      baseUrl: mockBaseUrl,
    });

    // 1a. Default
    recordedBodies.length = 0;
    await openai.generateArticle({ ...baseInput });
    const reqOpenaiDefault = JSON.parse(recordedBodies[0].body);
    const systemPromptOpenaiDefault = reqOpenaiDefault.messages.find((m: { role: string }) => m.role === "system")?.content;
    if (!systemPromptOpenaiDefault.includes("portal de notícias de tecnologia e negócios")) {
      throw new Error("FAILED: OpenAI default prompt missing standard area.");
    }
    console.log("✓ OpenAI Provider uses default prompt when promptSettings is undefined.");

    // 1b. Custom
    recordedBodies.length = 0;
    await openai.generateArticle({ ...baseInput, promptSettings: customSettings });
    const reqOpenaiCustom = JSON.parse(recordedBodies[0].body);
    const systemPromptOpenaiCustom = reqOpenaiCustom.messages.find((m: { role: string }) => m.role === "system")?.content;
    if (!systemPromptOpenaiCustom.includes("portal de notícias de Finanças e Cripto") || !systemPromptOpenaiCustom.includes("analítico, persuasivo")) {
      throw new Error("FAILED: OpenAI custom prompt not injected.");
    }
    console.log("✓ OpenAI Provider correctly uses custom promptSettings.");

    // 2. Test Gemini Provider with & without promptSettings
    console.log("2. Testing Gemini Provider with default and custom promptSettings...");
    const gemini = createAIProvider({
      provider: "gemini",
      apiKey: "fake-key",
      model: "gemini-test",
      baseUrl: mockBaseUrl,
    });

    // 2a. Default
    recordedBodies.length = 0;
    await gemini.generateArticle({ ...baseInput });
    const reqGeminiDefault = JSON.parse(recordedBodies[0].body);
    const textGeminiDefault = reqGeminiDefault.contents[0].parts[0].text;
    if (!textGeminiDefault.includes("portal de notícias de tecnologia e negócios")) {
      throw new Error("FAILED: Gemini default prompt missing standard area.");
    }
    console.log("✓ Gemini Provider uses default prompt when promptSettings is undefined.");

    // 2b. Custom
    recordedBodies.length = 0;
    await gemini.generateArticle({ ...baseInput, promptSettings: customSettings });
    const reqGeminiCustom = JSON.parse(recordedBodies[0].body);
    const textGeminiCustom = reqGeminiCustom.contents[0].parts[0].text;
    if (!textGeminiCustom.includes("portal de notícias de Finanças e Cripto") || !textGeminiCustom.includes("analítico, persuasivo")) {
      throw new Error("FAILED: Gemini custom prompt not injected.");
    }
    console.log("✓ Gemini Provider correctly uses custom promptSettings.");

    // 3. Test Anthropic Provider with & without promptSettings
    console.log("3. Testing Anthropic Provider with default and custom promptSettings...");
    const anthropic = createAIProvider({
      provider: "anthropic",
      apiKey: "fake-key",
      model: "claude-test",
      baseUrl: mockBaseUrl,
    });

    // 3a. Default
    recordedBodies.length = 0;
    await anthropic.generateArticle({ ...baseInput });
    const reqAnthropicDefault = JSON.parse(recordedBodies[0].body);
    if (!reqAnthropicDefault.system.includes("portal de notícias de tecnologia e negócios")) {
      throw new Error("FAILED: Anthropic default prompt missing standard area.");
    }
    console.log("✓ Anthropic Provider uses default prompt when promptSettings is undefined.");

    // 3b. Custom
    recordedBodies.length = 0;
    await anthropic.generateArticle({ ...baseInput, promptSettings: customSettings });
    const reqAnthropicCustom = JSON.parse(recordedBodies[0].body);
    if (!reqAnthropicCustom.system.includes("portal de notícias de Finanças e Cripto") || !reqAnthropicCustom.system.includes("analítico, persuasivo")) {
      throw new Error("FAILED: Anthropic custom prompt not injected.");
    }
    console.log("✓ Anthropic Provider correctly uses custom promptSettings.");

    // 4. Test OpenAI-Compatible Provider with & without promptSettings
    console.log("4. Testing OpenAI-Compatible Provider with default and custom promptSettings...");
    const compat = createAIProvider({
      provider: "openai-compatible",
      apiKey: "fake-key",
      model: "deepseek-test",
      baseUrl: mockBaseUrl,
    });

    // 4a. Default
    recordedBodies.length = 0;
    await compat.generateArticle({ ...baseInput });
    const reqCompatDefault = JSON.parse(recordedBodies[0].body);
    const systemPromptCompatDefault = reqCompatDefault.messages.find((m: { role: string }) => m.role === "system")?.content;
    if (!systemPromptCompatDefault.includes("portal de notícias de tecnologia e negócios")) {
      throw new Error("FAILED: OpenAI-Compatible default prompt missing standard area.");
    }
    console.log("✓ OpenAI-Compatible Provider uses default prompt when promptSettings is undefined.");

    // 4b. Custom
    recordedBodies.length = 0;
    await compat.generateArticle({ ...baseInput, promptSettings: customSettings });
    const reqCompatCustom = JSON.parse(recordedBodies[0].body);
    const systemPromptCompatCustom = reqCompatCustom.messages.find((m: { role: string }) => m.role === "system")?.content;
    if (!systemPromptCompatCustom.includes("portal de notícias de Finanças e Cripto") || !systemPromptCompatCustom.includes("analítico, persuasivo")) {
      throw new Error("FAILED: OpenAI-Compatible custom prompt not injected.");
    }
    console.log("✓ OpenAI-Compatible Provider correctly uses custom promptSettings.");

    // 5. Test processArticleWithAi integration with DB config
    console.log("5. Testing processArticleWithAi with database aiPromptSettings...");

    // Create test source and article in database
    const testSource = await prisma.source.create({
      data: {
        workspaceId: "default-workspace",name: "Test Source Dynamic",
        rssUrl: "https://test.com/rss",
        active: true,
      },
    });

    const testArticle = await prisma.article.create({
      data: {
        workspaceId: "default-workspace",sourceId: testSource.id,
        originalTitle: "Notícia Para Teste Integrado de Prompt",
        originalUrl: `https://test.com/art-${Date.now()}`,
        status: "PENDING",
      },
    });

    // Configure active AI provider to point to mock server
    await setConfig("aiProvider", {
      provider: "openai-compatible",
      apiKey: encrypt("fake-key"),
      model: "deepseek-test",
      baseUrl: mockBaseUrl,
    });

    // 5a. Without aiPromptSettings in DB -> should use defaults
    await deleteConfig("aiPromptSettings");
    recordedBodies.length = 0;
    await processArticleWithAi(testArticle.id);
    const lastReqDefault = JSON.parse(recordedBodies[recordedBodies.length - 1].body);
    const lastPromptDefault = lastReqDefault.messages.find((m: { role: string }) => m.role === "system")?.content;
    if (!lastPromptDefault.includes("portal de notícias de tecnologia e negócios")) {
      throw new Error("FAILED: processArticleWithAi without DB config did not use default prompt.");
    }
    console.log("✓ processArticleWithAi without aiPromptSettings in DB uses defaults (retrocompatible).");

    // 5b. With aiPromptSettings in DB -> should inject custom prompt
    await setConfig("aiPromptSettings", customSettings);
    recordedBodies.length = 0;
    await processArticleWithAi(testArticle.id);
    const lastReqCustom = JSON.parse(recordedBodies[recordedBodies.length - 1].body);
    const lastPromptCustom = lastReqCustom.messages.find((m: { role: string }) => m.role === "system")?.content;
    if (!lastPromptCustom.includes("portal de notícias de Finanças e Cripto") || !lastPromptCustom.includes("analítico, persuasivo")) {
      throw new Error("FAILED: processArticleWithAi with DB config did not pass promptSettings to provider.");
    }
    console.log("✓ processArticleWithAi loads aiPromptSettings from DB and passes to provider.");

    // Cleanup
    await prisma.article.delete({ where: { id: testArticle.id } });
    await prisma.source.delete({ where: { id: testSource.id } });
    await deleteConfig("aiProvider");
    await deleteConfig("aiPromptSettings");
    console.log("✓ Cleaned up test database records.");

  } finally {
    mockServer.close();
  }

  console.log("=== ALL TASK 026 TESTS PASSED SUCCESSFULLY! ===");
}

main()
  .catch((err) => {
    console.error("Task 026 test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
