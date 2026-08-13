import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { setConfig, getConfig, deleteConfig } from "../src/lib/config";
import { getWordPressConfig, testWordPressConnection, syncWordPressCategories, WordPressConnectionConfigStored } from "../src/lib/wordpress";

async function main() {
  console.log("=== RUNNING WORDPRESS CONFIGURATION MIGRATION TESTS ===");

  const mockPort = 9870;
  const mockServer = http.createServer((req, res) => {
    if (req.url === "/wp-json/wp/v2/users/me" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: 1, name: "Admin Test", slug: "admin" }));
      return;
    }
    if (req.url?.startsWith("/wp-json/wp/v2/categories") && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{ id: 88, name: "Tecnologia Visual", slug: "tecnologia-visual" }]));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  console.log(`✓ Mock WordPress Server running on port ${mockPort}`);

  try {
    const rawSecretPassword = "mock_secret_app_password_1234";
    const mockUrl = `http://localhost:${mockPort}`;
    const mockUsername = "visual_user";

    // 1. Save WordPress Configuration via DB service (simulating API POST)
    console.log("Saving WordPress config with encrypted password...");
    const { encrypt } = await import("../src/lib/crypto");
    const encryptedPass = encrypt(rawSecretPassword);

    await setConfig("wordpressConnection", {
      url: mockUrl,
      username: mockUsername,
      applicationPassword: encryptedPass,
    });

    // 2. Verify stored payload in DB
    const storedConfig = await getConfig<WordPressConnectionConfigStored>("wordpressConnection");
    if (!storedConfig || !storedConfig.applicationPassword || !storedConfig.applicationPassword.startsWith("v1:")) {
      throw new Error("FAILED: Password was not properly encrypted with 'v1:' version tag!");
    }
    if (storedConfig.applicationPassword === rawSecretPassword) {
      throw new Error("FAILED: Password was stored in plaintext in the database!");
    }
    console.log("✓ Verified database entry: Password is encrypted with AES-256-GCM and not plaintext.");

    // 3. Test getWordPressConfig server-side resolution and decryption
    console.log("Testing getWordPressConfig() resolution from DB...");
    const resolvedConfig = await getWordPressConfig();
    console.log("✓ Resolved config:", {
      url: resolvedConfig.url,
      username: resolvedConfig.username,
      hasPassword: Boolean(resolvedConfig.applicationPassword),
    });

    if (
      resolvedConfig.url !== mockUrl ||
      resolvedConfig.username !== mockUsername ||
      resolvedConfig.applicationPassword !== rawSecretPassword
    ) {
      throw new Error("FAILED: Server-side decryption failed or returned incorrect credentials.");
    }
    console.log("✓ Server-side decryption verified: Plaintext password retrieved securely in memory.");

    // 4. Test Connection with DB Credentials
    console.log("Testing connection with DB credentials...");
    const connResult = await testWordPressConnection();
    if (!connResult.connected || connResult.user.name !== "Admin Test") {
      throw new Error("FAILED: Connection test failed using DB credentials.");
    }
    console.log("✓ Connection test passed:", connResult);

    // 5. Test Category Sync with DB Credentials
    console.log("Testing category sync with DB credentials...");
    const syncResult = await syncWordPressCategories();
    if (!syncResult.success || syncResult.syncedCount !== 1) {
      throw new Error("FAILED: Category sync failed using DB credentials.");
    }
    console.log("✓ Category sync passed:", syncResult);

    // Cleanup
    await prisma.wordPressCategory.deleteMany({ where: { wordpressId: 88 } });
    await deleteConfig("wordpressConnection");
    console.log("✓ Cleaned up test database records.");

  } finally {
    mockServer.close();
  }

  console.log("=== WORDPRESS CONFIGURATION MIGRATION TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("WordPress config test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
