import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== RUNNING WORDPRESS MODULE TESTS ===");

  // 1. Setup a local mock WordPress REST API server
  const mockPort = 9876;
  const mockCategories = [
    { id: 1, name: "Uncategorized", slug: "uncategorized" },
    { id: 10, name: "Tecnologia", slug: "tecnologia" },
    { id: 15, name: "Inteligência Artificial", slug: "inteligencia-artificial" },
  ];

  let authHeaderReceived: string | undefined = undefined;

  const server = http.createServer((req, res) => {
    authHeaderReceived = req.headers["authorization"];

    if (req.url === "/wp-json/wp/v2/users/me") {
      if (authHeaderReceived?.startsWith("Basic ")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: 42, name: "Editor Admin", slug: "editor-admin" }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: "unauthorized", message: "Invalid credentials" }));
      }
      return;
    }

    if (req.url?.startsWith("/wp-json/wp/v2/categories")) {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "x-wp-total": mockCategories.length.toString(),
        "x-wp-totalpages": "1",
      });
      res.end(JSON.stringify(mockCategories));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  await new Promise<void>((resolve) => server.listen(mockPort, resolve));
  console.log(`✓ Local Mock WordPress REST API running on port ${mockPort}`);

  // Override env vars temporarily to target mock server
  const originalUrl = process.env.WORDPRESS_URL;
  const originalUser = process.env.WORDPRESS_USERNAME;
  const originalPass = process.env.WORDPRESS_APPLICATION_PASSWORD;

  process.env.WORDPRESS_URL = `http://localhost:${mockPort}`;
  process.env.WORDPRESS_USERNAME = "testuser";
  process.env.WORDPRESS_APPLICATION_PASSWORD = "testpass-app-password";

  try {
    // Import wordpress module dynamically so env variables are read
    const { testWordPressConnection, syncWordPressCategories } = await import("../src/lib/wordpress");

    // 2. Test Connection
    console.log("Testing WordPress connection...");
    const connResult = await testWordPressConnection();
    console.log("✓ Connection result:", connResult);

    if (!connResult.connected || connResult.user.name !== "Editor Admin") {
      throw new Error("FAILED: Connection test returned invalid result.");
    }

    // Verify Basic Auth header was properly created with base64 credentials
    const expectedBase64 = Buffer.from("testuser:testpass-app-password").toString("base64");
    if (authHeaderReceived !== `Basic ${expectedBase64}`) {
      throw new Error(`FAILED: Authorization header mismatch. Received: ${authHeaderReceived}`);
    }
    console.log("✓ Application Password basic auth header verified.");

    // 3. Test Category Sync (First Run)
    console.log("Testing category sync (1st run)...");
    await prisma.wordPressCategory.deleteMany(); // clean DB

    const sync1 = await syncWordPressCategories();
    console.log(`✓ Synced ${sync1.syncedCount} categories on 1st run.`);

    if (sync1.syncedCount !== 3) {
      throw new Error(`FAILED: Expected 3 categories synced, got ${sync1.syncedCount}`);
    }

    const dbCategories1 = await prisma.wordPressCategory.findMany({ orderBy: { wordpressId: "asc" } });
    if (dbCategories1.length !== 3) {
      throw new Error(`FAILED: Expected 3 records in DB, found ${dbCategories1.length}`);
    }

    // 4. Test Category Sync Idempotency (Second Run - Repeat Sync)
    console.log("Testing category sync (2nd run - repeat sync)...");
    const sync2 = await syncWordPressCategories();
    console.log(`✓ Synced ${sync2.syncedCount} categories on 2nd run.`);

    const dbCategories2 = await prisma.wordPressCategory.findMany();
    if (dbCategories2.length !== 3) {
      throw new Error(`FAILED: Category duplicate detected! Found ${dbCategories2.length} records in DB after repeat sync.`);
    }
    console.log("✓ Repeat sync verified: 0 duplicate categories created.");

    // Clean test categories
    await prisma.wordPressCategory.deleteMany();
    console.log("✓ Cleaned up test database records.");

  } finally {
    // Restore env vars & stop mock server
    process.env.WORDPRESS_URL = originalUrl;
    process.env.WORDPRESS_USERNAME = originalUser;
    process.env.WORDPRESS_APPLICATION_PASSWORD = originalPass;
    server.close();
  }

  console.log("=== WORDPRESS MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("WordPress test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
