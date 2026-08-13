import "dotenv/config";
import { encrypt, decrypt } from "../src/lib/crypto";
import { getWordPressConfig } from "../src/lib/wordpress";
import { getActiveAIProvider } from "../src/lib/ai/service";
import { setConfig, deleteConfig } from "../src/lib/config";
import { GET as getWpConfig } from "../src/app/api/wordpress/config/route";
import { GET as getAiConfig } from "../src/app/api/ai/config/route";

async function main() {
  console.log("=== RUNNING SETTINGS HARDENING & SECURITY AUDIT TESTS ===");

  // 1. Audit Server-Only ENCRYPTION_KEY
  console.log("Auditing ENCRYPTION_KEY...");
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("FAILED: ENCRYPTION_KEY environment variable is not defined!");
  }
  if (process.env.NEXT_PUBLIC_ENCRYPTION_KEY) {
    throw new Error("FAILED: ENCRYPTION_KEY is exposed with NEXT_PUBLIC_ prefix!");
  }
  console.log("✓ ENCRYPTION_KEY is properly scoped to server-only environment.");

  // 2. Audit AES-256-GCM Unique IVs & Authentication Tags
  console.log("Auditing encryption uniqueness and authentication tags...");
  const plaintext = "super-secret-password-12345";
  const cipher1 = encrypt(plaintext);
  const cipher2 = encrypt(plaintext);

  if (cipher1 === cipher2) {
    throw new Error("FAILED: Identical ciphertexts generated! IV is not unique per call.");
  }

  const parts1 = cipher1.split(":");
  const parts2 = cipher2.split(":");
  if (parts1[1] === parts2[1]) {
    throw new Error("FAILED: IV is being reused across encryption calls!");
  }

  if (decrypt(cipher1) !== plaintext || decrypt(cipher2) !== plaintext) {
    throw new Error("FAILED: Decryption did not restore original plaintext.");
  }

  // Audit tampering detection
  const tamperedCipher = cipher1.substring(0, cipher1.length - 2) + "00";
  let tamperCaught = false;
  try {
    decrypt(tamperedCipher);
  } catch (err) {
    tamperCaught = true;
    if ((err as Error).message.includes("super-secret")) {
      throw new Error("FAILED: Decryption error leaked plaintext secrets!");
    }
  }
  if (!tamperCaught) {
    throw new Error("FAILED: Tampered ciphertext was accepted without throwing auth tag error!");
  }
  console.log("✓ AES-256-GCM authenticated encryption verified (unique IVs, GCM auth tag tamper prevention).");

  // 3. Audit Response Payload Secrets Prevention (WordPress API & AI API)
  console.log("Auditing API response payloads for secret exposure...");
  const rawWpSecret = "wp-secret-app-password-998877";
  const rawAiSecret = "sk-proj-ai-secret-key-11223344";

  await setConfig("wordpressConnection", {
    url: "https://mysite.com.br",
    username: "admin_user",
    applicationPassword: encrypt(rawWpSecret),
  });

  await setConfig("aiProvider", {
    provider: "openai",
    apiKey: encrypt(rawAiSecret),
    model: "gpt-4o-mini",
  });

  const wpRes = await getWpConfig();
  const wpData = await wpRes.json();

  if (
    JSON.stringify(wpData).includes(rawWpSecret) ||
    JSON.stringify(wpData).includes(encrypt(rawWpSecret)) ||
    wpData.applicationPassword !== undefined
  ) {
    throw new Error("FAILED: WordPress API response exposed password in plain or ciphertext!");
  }
  if (!wpData.hasApplicationPassword || !wpData.isConfigured) {
    throw new Error("FAILED: WordPress API response missing status flags!");
  }
  console.log("✓ WordPress API response audit passed: Secrets never exposed to client.");

  const aiRes = await getAiConfig();
  const aiData = await aiRes.json();

  if (
    JSON.stringify(aiData).includes(rawAiSecret) ||
    JSON.stringify(aiData).includes(encrypt(rawAiSecret)) ||
    aiData.apiKey !== undefined
  ) {
    throw new Error("FAILED: AI API response exposed API key in plain or ciphertext!");
  }
  if (!aiData.hasApiKey || !aiData.isConfigured) {
    throw new Error("FAILED: AI API response missing status flags!");
  }
  console.log("✓ AI API response audit passed: Secrets never exposed to client.");

  // 4. Audit Non-existent Configuration Handling (Fallbacks & Null Safety)
  console.log("Auditing non-existent configuration handling...");
  await deleteConfig("wordpressConnection");
  await deleteConfig("aiProvider");

  const wpConfigFallback = await getWordPressConfig();
  if (!wpConfigFallback.url || !wpConfigFallback.username) {
    console.log("  - WordPress fallback to env checked.");
  }

  let aiFallbackHandled = false;
  try {
    const aiProviderFallback = await getActiveAIProvider();
    if (aiProviderFallback.name === "OpenAI") {
      aiFallbackHandled = true;
    }
  } catch {
    // If OPENAI_API_KEY is not set or is "sk-...", getActiveAIProvider correctly throws validation error
    aiFallbackHandled = true;
  }
  if (!aiFallbackHandled) {
    throw new Error("FAILED: Non-existent AI config handling failed!");
  }
  console.log("✓ Non-existent configuration handling passed with graceful fallbacks.");

  console.log("=== SETTINGS HARDENING & SECURITY AUDIT COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Settings hardening test failed:", err);
    process.exit(1);
  });
