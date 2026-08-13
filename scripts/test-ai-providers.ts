import "dotenv/config";
import http from "http";
import { createAIProvider } from "../src/lib/ai";

async function main() {
  console.log("=== RUNNING AI PROVIDERS ABSTRACTION TESTS ===");

  // 1. Test Factory Instantiation for all 4 providers
  console.log("Testing factory instantiation for OpenAI, Gemini, Anthropic, and OpenAI-Compatible...");

  const openaiProvider = createAIProvider({ provider: "openai", apiKey: "test-openai-key", model: "gpt-4o-mini" });
  const geminiProvider = createAIProvider({ provider: "gemini", apiKey: "test-gemini-key", model: "gemini-1.5-flash" });
  const anthropicProvider = createAIProvider({ provider: "anthropic", apiKey: "test-anthropic-key", model: "claude-3-5-haiku-20241022" });
  const compatibleProvider = createAIProvider({ provider: "openai-compatible", apiKey: "test-compat-key", model: "deepseek-chat" });

  if (
    openaiProvider.name !== "OpenAI" ||
    geminiProvider.name !== "Gemini" ||
    anthropicProvider.name !== "Anthropic" ||
    compatibleProvider.name !== "OpenAI-Compatible"
  ) {
    throw new Error("FAILED: Factory returned unexpected provider names.");
  }
  console.log("✓ All 4 providers instantiated successfully via AIProviderFactory.");

  // 2. Test Mock Responses for Gemini, Anthropic, and OpenAI-Compatible
  const mockPort = 9866;
  const sampleArticlePayload = {
    relevant: true,
    score: 9.2,
    title: "Nova IA Impulsiona Produtividade no Desenvolvimento",
    summary: "Estudo revela aumento de 40% na velocidade de entrega de software.",
    content: "<p>A inteligência artificial está transformando a criação de software no Brasil.</p>",
    suggestedCategoryId: "cat-tech-101",
    tags: ["ia", "tecnologia", "desenvolvimento"],
    seoFocusKeyword: "Inteligência Artificial Desenvolvimento",
    seoTitle: "IA no Desenvolvimento de Software | Notícias Tech",
    seoDescription: "Descubra como a IA está transformando o desenvolvimento de software no Brasil.",
  };

  const mockServer = http.createServer((req, res) => {
    // Gemini endpoint
    if (req.url?.includes("/models/gemini")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(sampleArticlePayload) }] } }]
      }));
      return;
    }

    // Anthropic endpoint
    if (req.url?.includes("/v1/messages")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        content: [{ text: JSON.stringify(sampleArticlePayload) }]
      }));
      return;
    }

    // OpenAI Compatible endpoint
    if (req.url?.includes("/chat/completions")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(sampleArticlePayload) } }]
      }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  console.log(`✓ Mock AI API Server running on port ${mockPort}`);

  const mockBaseUrl = `http://localhost:${mockPort}`;

  try {
    const input = {
      originalTitle: "Notícia Teste Abstração IA",
      originalDescription: "Descrição da notícia de teste para o harness.",
      categories: [{ id: "cat-tech-101", name: "Tecnologia", slug: "tecnologia" }],
    };

    // Test Gemini Provider
    console.log("Testing Gemini Provider article generation & connection test...");
    const mockGemini = createAIProvider({
      provider: "gemini",
      apiKey: "fake-key",
      model: "gemini-test",
      baseUrl: mockBaseUrl,
    });
    const geminiArticle = await mockGemini.generateArticle(input);
    const geminiConn = await mockGemini.testConnection();
    if (!geminiArticle.relevant || geminiArticle.score !== 9.2 || !geminiConn.connected) {
      throw new Error("FAILED: Gemini provider output mismatch.");
    }
    console.log("✓ Gemini Provider passed validation.");

    // Test Anthropic Provider
    console.log("Testing Anthropic Provider article generation & connection test...");
    const mockAnthropic = createAIProvider({
      provider: "anthropic",
      apiKey: "fake-key",
      model: "claude-test",
      baseUrl: mockBaseUrl,
    });
    const anthropicArticle = await mockAnthropic.generateArticle(input);
    const anthropicConn = await mockAnthropic.testConnection();
    if (!anthropicArticle.relevant || anthropicArticle.title !== sampleArticlePayload.title || !anthropicConn.connected) {
      throw new Error("FAILED: Anthropic provider output mismatch.");
    }
    console.log("✓ Anthropic Provider passed validation.");

    // Test OpenAI Compatible Provider
    console.log("Testing OpenAI-Compatible Provider article generation & connection test...");
    const mockCompat = createAIProvider({
      provider: "openai-compatible",
      apiKey: "fake-key",
      model: "deepseek-test",
      baseUrl: `${mockBaseUrl}/v1`,
    });
    const compatArticle = await mockCompat.generateArticle(input);
    const compatConn = await mockCompat.testConnection();
    if (!compatArticle.relevant || compatArticle.suggestedCategoryId !== "cat-tech-101" || !compatConn.connected) {
      throw new Error("FAILED: OpenAI-Compatible provider output mismatch.");
    }
    console.log("✓ OpenAI-Compatible Provider passed validation.");

  } finally {
    mockServer.close();
  }

  console.log("=== AI PROVIDERS ABSTRACTION TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("AI Providers test failed:", err);
    process.exit(1);
  });
