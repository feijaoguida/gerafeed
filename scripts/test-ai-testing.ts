import "dotenv/config";
import http from "http";
import { testActiveAIProviderConnection } from "../src/lib/ai";

async function main() {
  console.log("=== RUNNING AI PROVIDER TESTING MODULE TESTS ===");

  const mockPort = 9855;
  let serverShouldFail = false;

  const mockServer = http.createServer((req, res) => {
    if (serverShouldFail) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Invalid API Key" } }));
      return;
    }

    if (req.url?.includes("/chat/completions")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: '{"status":"ok"}' } }] }));
      return;
    }

    if (req.url?.includes("/v1/messages")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ content: [{ text: '{"status":"ok"}' }] }));
      return;
    }

    if (req.url?.includes("/models/gemini")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }] }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  const mockBaseUrl = `http://localhost:${mockPort}`;
  console.log(`✓ Mock AI Server running on port ${mockPort}`);

  try {
    // 1. Test OpenAI-Compatible Provider Connection
    console.log("Testing OpenAI-Compatible connection test...");
    const compatResult = await testActiveAIProviderConnection({
      provider: "openai-compatible",
      apiKey: "test-valid-key",
      model: "deepseek-test",
      baseUrl: `${mockBaseUrl}/v1`,
    });
    console.log("✓ OpenAI-Compatible connection test result:", compatResult);

    if (!compatResult.connected || "apiKey" in compatResult) {
      throw new Error("FAILED: OpenAI-Compatible test failed or exposed API Key!");
    }

    // 2. Test Gemini Provider Connection
    console.log("Testing Gemini connection test...");
    const geminiResult = await testActiveAIProviderConnection({
      provider: "gemini",
      apiKey: "test-valid-key",
      model: "gemini-test",
      baseUrl: mockBaseUrl,
    });
    console.log("✓ Gemini connection test result:", geminiResult);

    if (!geminiResult.connected || "apiKey" in geminiResult) {
      throw new Error("FAILED: Gemini test failed or exposed API Key!");
    }

    // 3. Test Anthropic Provider Connection
    console.log("Testing Anthropic connection test...");
    const anthropicResult = await testActiveAIProviderConnection({
      provider: "anthropic",
      apiKey: "test-valid-key",
      model: "claude-test",
      baseUrl: mockBaseUrl,
    });
    console.log("✓ Anthropic connection test result:", anthropicResult);

    if (!anthropicResult.connected || "apiKey" in anthropicResult) {
      throw new Error("FAILED: Anthropic test failed or exposed API Key!");
    }

    // 4. Test Controlled Error Handling on Invalid Key / Server Failure
    console.log("Testing controlled error handling on server failure (HTTP 401)...");
    serverShouldFail = true;

    const failedResult = await testActiveAIProviderConnection({
      provider: "openai-compatible",
      apiKey: "invalid-key",
      model: "deepseek-test",
      baseUrl: `${mockBaseUrl}/v1`,
    });
    console.log("✓ Controlled failure result:", failedResult);

    if (failedResult.connected !== false || "apiKey" in failedResult) {
      throw new Error("FAILED: Connection test did not handle failure gracefully or exposed key!");
    }
    console.log("✓ Controlled failure test passed.");

  } finally {
    mockServer.close();
  }

  console.log("=== AI PROVIDER TESTING MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("AI Provider testing test failed:", err);
    process.exit(1);
  });
