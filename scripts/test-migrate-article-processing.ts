import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { setConfig, deleteConfig } from "../src/lib/config";
import { encrypt } from "../src/lib/crypto";
import { processArticleWithAi } from "../src/lib/ai";

async function main() {
  console.log("=== RUNNING ARTICLE PROCESSING MIGRATION TESTS ===");

  // 1. Create a test Source & Article in DB
  const testSource = await prisma.source.create({
    data: {
      name: "Fonte Teste Abstração IA",
      rssUrl: "https://test.com/rss.xml",
      active: true,
    },
  });

  const testArticle = await prisma.article.create({
    data: {
      sourceId: testSource.id,
      originalUrl: "https://test.com/noticia-abstracao-ia",
      originalTitle: "Título Bruto do Feed RSS para Teste de Migração IA",
      originalDescription: "Descrição bruta do feed RSS sobre avanço de inteligência artificial.",
      status: "PENDING",
    },
  });

  console.log(`✓ Test Article created in DB with ID: ${testArticle.id}`);

  // 2. Setup Mock Server for AI Providers
  const mockPort = 9844;
  let lastUsedProvider: string;
  lastUsedProvider = "";

  const mockPayload = {
    relevant: true,
    score: 95,
    title: "IA no Jornalismo: Avanços e Automação Editorial",
    summary: "Como novos modelos de linguagem estão transformando redações brasileiras.",
    content: "<p>O uso de inteligência artificial na curadoria de notícias cresceu de forma exponencial.</p>",
    suggestedCategoryId: null,
    tags: ["ia", "tecnologia", "jornalismo"],
    seoFocusKeyword: "Inteligência Artificial Jornalismo",
    seoTitle: "IA no Jornalismo | Curador de Notícias",
    seoDescription: "Saiba como a IA está transformando o jornalismo e a curadoria editorial no Brasil.",
  };

  const mockServer = http.createServer((req, res) => {
    if (req.url?.includes("/chat/completions")) {
      lastUsedProvider = "openai-compatible";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(mockPayload) } }] }));
      return;
    }

    if (req.url?.includes("/v1/messages")) {
      lastUsedProvider = "anthropic";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ content: [{ text: JSON.stringify(mockPayload) }] }));
      return;
    }

    if (req.url?.includes("/models/gemini")) {
      lastUsedProvider = "gemini";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(mockPayload) }] } }] }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  const mockBaseUrl = `http://localhost:${mockPort}`;
  console.log(`✓ Mock AI API Server listening on port ${mockPort}`);

  try {
    const secretKey = encrypt("sk-test-secret-key-12345");

    // 3. Test 1: Process Article using OpenAI-Compatible Provider
    console.log("Configuring DB for OpenAI-Compatible Provider...");
    await setConfig("aiProvider", {
      provider: "openai-compatible",
      apiKey: secretKey,
      model: "deepseek-chat",
      baseUrl: `${mockBaseUrl}/v1`,
    });

    console.log("Executing processArticleWithAi()...");
    const result1 = await processArticleWithAi(testArticle.id);

    if (!result1.success || (lastUsedProvider as string) !== "openai-compatible") {
      throw new Error("FAILED: processArticleWithAi did not use configured OpenAI-Compatible provider!");
    }
    if (result1.article.title !== mockPayload.title || result1.article.aiScore !== 95) {
      throw new Error("FAILED: Article fields in DB were not updated properly!");
    }
    console.log("✓ Processed article successfully with OpenAI-Compatible provider! Title and score updated in DB.");

    // 4. Test 2: Switch Provider to Anthropic
    console.log("Switching DB configuration to Anthropic Provider...");
    await setConfig("aiProvider", {
      provider: "anthropic",
      apiKey: secretKey,
      model: "claude-3-5-haiku-20241022",
      baseUrl: mockBaseUrl,
    });

    const result2 = await processArticleWithAi(testArticle.id);

    if (!result2.success || (lastUsedProvider as string) !== "anthropic") {
      throw new Error("FAILED: processArticleWithAi did not switch to Anthropic provider!");
    }
    console.log("✓ Processed article successfully after switching to Anthropic provider!");

    // 5. Test 3: Switch Provider to Gemini
    console.log("Switching DB configuration to Gemini Provider...");
    await setConfig("aiProvider", {
      provider: "gemini",
      apiKey: secretKey,
      model: "gemini-1.5-flash",
      baseUrl: mockBaseUrl,
    });

    const result3 = await processArticleWithAi(testArticle.id);

    if (!result3.success || (lastUsedProvider as string) !== "gemini") {
      throw new Error("FAILED: processArticleWithAi did not switch to Gemini provider!");
    }
    console.log("✓ Processed article successfully after switching to Gemini provider!");

  } finally {
    mockServer.close();
    // Cleanup DB
    await deleteConfig("aiProvider");
    await prisma.article.delete({ where: { id: testArticle.id } });
    await prisma.source.delete({ where: { id: testSource.id } });
    console.log("✓ Cleaned up test database records.");
  }

  console.log("=== ARTICLE PROCESSING MIGRATION TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Migrate article processing test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
