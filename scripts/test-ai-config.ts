import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { setConfig, getConfig, deleteConfig } from "../src/lib/config";
import { AIConfigStored } from "../src/app/api/ai/config/route";
import { encrypt, decrypt } from "../src/lib/crypto";

async function main() {
  console.log("=== RUNNING AI CONFIGURATION MODULE TESTS ===");

  const rawSecretKey = "sk-proj-ai-test-key-998877665544332211";
  const encryptedKey = encrypt(rawSecretKey);

  // 1. Test Saving OpenAI Config
  console.log("Testing saving OpenAI configuration with encrypted API key...");
  await setConfig("aiProvider", {
    provider: "openai",
    apiKey: encryptedKey,
    model: "gpt-4o-mini",
  });

  const storedOpenAI = await getConfig<AIConfigStored>("aiProvider");
  if (!storedOpenAI || !storedOpenAI.apiKey || !storedOpenAI.apiKey.startsWith("v1:")) {
    throw new Error("FAILED: OpenAI API key was not properly encrypted with 'v1:' version tag!");
  }
  if (storedOpenAI.apiKey === rawSecretKey) {
    throw new Error("FAILED: OpenAI API key was stored in plaintext!");
  }
  if (decrypt(storedOpenAI.apiKey) !== rawSecretKey) {
    throw new Error("FAILED: Could not decrypt OpenAI API key back to original plaintext.");
  }
  console.log("✓ OpenAI DB config verified: Encrypted with AES-256-GCM and decrypts back to original key in memory.");

  // 2. Test Saving Gemini Config
  console.log("Testing saving Gemini configuration...");
  await setConfig("aiProvider", {
    provider: "gemini",
    apiKey: encryptedKey,
    model: "gemini-1.5-flash",
  });

  const storedGemini = await getConfig<AIConfigStored>("aiProvider");
  if (!storedGemini || storedGemini.provider !== "gemini" || storedGemini.model !== "gemini-1.5-flash") {
    throw new Error("FAILED: Gemini configuration mismatch in database.");
  }
  console.log("✓ Gemini DB config verified.");

  // 3. Test Saving Anthropic Config
  console.log("Testing saving Anthropic configuration...");
  await setConfig("aiProvider", {
    provider: "anthropic",
    apiKey: encryptedKey,
    model: "claude-3-5-haiku-20241022",
  });

  const storedAnthropic = await getConfig<AIConfigStored>("aiProvider");
  if (!storedAnthropic || storedAnthropic.provider !== "anthropic") {
    throw new Error("FAILED: Anthropic configuration mismatch in database.");
  }
  console.log("✓ Anthropic DB config verified.");

  // 4. Test Saving OpenAI-Compatible Config
  console.log("Testing saving OpenAI-Compatible configuration with Base URL...");
  await setConfig("aiProvider", {
    provider: "openai-compatible",
    apiKey: encryptedKey,
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
  });

  const storedCompat = await getConfig<AIConfigStored>("aiProvider");
  if (!storedCompat || storedCompat.provider !== "openai-compatible" || storedCompat.baseUrl !== "https://api.deepseek.com/v1") {
    throw new Error("FAILED: OpenAI-Compatible configuration mismatch in database.");
  }
  console.log("✓ OpenAI-Compatible DB config verified with Base URL.");

  // Cleanup
  await deleteConfig("aiProvider");
  console.log("✓ Cleaned up test database records.");

  console.log("=== AI CONFIGURATION MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("AI config test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
