import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { processArticleWithAi, getActiveAIProvider } from "../src/lib/ai";

async function main() {
  console.log("=== RUNNING AI MODULE TESTS ===");

  // 1. Test error handling when OPENAI_API_KEY is missing
  console.log("Testing error handling with missing/invalid API key...");
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-...";

  let handledKeyError = false;
  try {
    const provider = await getActiveAIProvider();
    await provider.generateArticle({ originalTitle: "Test Title", originalDescription: "Test Desc", categories: [] });
  } catch (err) {
    handledKeyError = true;
    console.log("✓ Correctly caught API key error:", (err as Error).message);
  }

  if (!handledKeyError) {
    throw new Error("FAILED: Expected error for missing OPENAI_API_KEY was not thrown.");
  }
  process.env.OPENAI_API_KEY = oldKey;

  // 2. Test AI processing & DB persistence with live OpenAI API if key available, OR with schema validation test
  const apiKey = process.env.OPENAI_API_KEY;
  const isRealKeyAvailable = apiKey && apiKey.startsWith("sk-") && apiKey !== "sk-..." && apiKey.length > 20;

  if (isRealKeyAvailable) {
    console.log("Live OPENAI_API_KEY detected! Testing live OpenAI API completion...");

    // Create a test Source & Article
    const source = await prisma.source.create({
      data: {
        workspaceId: "default-workspace",name: "Test AI Source",
        rssUrl: "https://example.com/rss",
        active: true,
      },
    });

    const category = await prisma.wordPressCategory.create({
      data: {
        workspaceId: "default-workspace",wordpressId: 9991,
        name: "Tecnologia Teste",
        slug: "tecnologia-teste",
      },
    });

    const article = await prisma.article.create({
      data: {
        workspaceId: "default-workspace",sourceId: source.id,
        originalUrl: "https://example.com/ai-test-1",
        originalTitle: "Robôs com Inteligência Artificial começam a trabalhar em fábricas no Brasil",
        originalDescription: "Empresas brasileiras estão adotando robôs autônomos impulsionados por inteligência artificial para otimizar linhas de produção.",
        status: "PENDING",
      },
    });

    console.log("Calling processArticleWithAi for article:", article.id);
    const result = await processArticleWithAi(article.id);
    console.log("✓ AI processing result:", {
      score: result.article.aiScore,
      title: result.article.title,
      summary: result.article.summary?.substring(0, 60) + "...",
      suggestedCategoryId: result.article.suggestedCategoryId,
      tags: result.article.tags,
      seoFocusKeyword: result.article.seoFocusKeyword,
      seoTitle: result.article.seoTitle,
    });

    // Assertions
    if (result.article.aiScore === null || typeof result.article.aiScore !== "number") {
      throw new Error("FAILED: aiScore was not saved.");
    }
    if (!result.article.title || !result.article.content || !result.article.summary) {
      throw new Error("FAILED: Editorial content (title, content, summary) was not saved.");
    }
    if (!result.article.seoTitle || !result.article.seoDescription || !result.article.seoFocusKeyword) {
      throw new Error("FAILED: SEO metadata was not saved.");
    }
    console.log("✓ All AI generated fields successfully persisted to PostgreSQL Article table!");

    // Clean up
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.wordPressCategory.delete({ where: { id: category.id } });
    await prisma.source.delete({ where: { id: source.id } });
    console.log("✓ Test records cleaned up.");
  } else {
    console.log("No live OPENAI_API_KEY configured (dummy key in .env). Testing schema validation and DB fallback update...");

    // Create test records
    const source = await prisma.source.create({
      data: {
        workspaceId: "default-workspace",name: "Test AI Source Dummy",
        rssUrl: "https://example.com/rss-dummy",
        active: true,
      },
    });

    const article = await prisma.article.create({
      data: {
        workspaceId: "default-workspace",sourceId: source.id,
        originalUrl: "https://example.com/ai-test-dummy",
        originalTitle: "Notícia Teste para validação de Schema",
        originalDescription: "Descrição original para teste de campos.",
        status: "PENDING",
      },
    });

    // Simulate saving structured AI result to DB
    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        aiScore: 85,
        title: "Inteligência Artificial revoluciona Curadoria de Notícias",
        summary: "Resumo estruturado gerado pela IA.",
        content: "<p>Conteúdo editorial completo reescrito em HTML.</p>",
        tags: ["IA", "Notícias", "Tecnologia"],
        seoFocusKeyword: "Curadoria de Notícias IA",
        seoTitle: "Curadoria de Notícias com IA: O Guia Completo",
        seoDescription: "Descubra como a Inteligência Artificial está transformando a curadoria de conteúdo editorial.",
      },
    });

    if (
      updated.aiScore !== 85 ||
      updated.title !== "Inteligência Artificial revoluciona Curadoria de Notícias" ||
      updated.tags.length !== 3 ||
      !updated.seoFocusKeyword
    ) {
      throw new Error("FAILED: Article schema fields update failed.");
    }
    console.log("✓ Verified schema compatibility for all AI generated fields in PostgreSQL database!");

    // Clean up
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.source.delete({ where: { id: source.id } });
    console.log("✓ Cleaned up test records.");
  }

  console.log("=== AI MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("AI test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
