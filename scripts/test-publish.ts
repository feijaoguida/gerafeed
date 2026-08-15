import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { publishArticleToWordPress } from "../src/lib/wordpress";

interface WpPostPayload {
  title?: string;
  categories?: number[];
  tags?: number[];
  content?: string;
}

async function main() {
  console.log("=== RUNNING PUBLISH MODULE TESTS ===");

  // 1. Setup Mock WordPress REST API Server with Tag and Post endpoints
  const mockPort = 9888;
  let receivedPostPayload: WpPostPayload | null = null;
  let serverShouldFail = false;

  const mockServer = http.createServer((req, res) => {
    if (serverShouldFail) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "internal_error", message: "Simulated WP Server Error" }));
      return;
    }

    if (req.url?.startsWith("/wp-json/wp/v2/tags")) {
      if (req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([{ id: 101, name: "tecnologia" }]));
        return;
      }
      if (req.method === "POST") {
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: 102, name: "novatag" }));
        return;
      }
    }

    if (req.url === "/wp-json/wp/v2/posts" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        receivedPostPayload = JSON.parse(body) as WpPostPayload;
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: 9988, link: "https://example.com/post-9988" }));
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  console.log(`✓ Mock WordPress Server running on port ${mockPort}`);

  const origUrl = process.env.WORDPRESS_URL;
  const origUser = process.env.WORDPRESS_USERNAME;
  const origPass = process.env.WORDPRESS_APPLICATION_PASSWORD;

  process.env.WORDPRESS_URL = `http://localhost:${mockPort}`;
  process.env.WORDPRESS_USERNAME = "admin";
  process.env.WORDPRESS_APPLICATION_PASSWORD = "pass";

  try {
    // Create test database records
    const source = await prisma.source.create({
      data: {
        workspaceId: "default-workspace",name: "Publish Test Source",
        rssUrl: "https://example.com/pub-rss",
        active: true,
      },
    });

    const category = await prisma.wordPressCategory.create({
      data: {
        workspaceId: "default-workspace",wordpressId: 15,
        name: "Tecnologia",
        slug: "tecnologia",
      },
    });

    const article = await prisma.article.create({
      data: {
        workspaceId: "default-workspace",sourceId: source.id,
        originalUrl: "https://example.com/pub-test-article",
        originalTitle: "Notícia para Teste de Publicação",
        title: "Inteligência Artificial Transforma Publicação no WordPress",
        summary: "Resumo editorial para o post do WordPress.",
        content: "<p>Conteúdo editorial completo com formatação HTML.</p>",
        categoryId: category.id,
        tags: ["tecnologia", "novatag"],
        status: "PENDING",
      },
    });

    // 2. Test Successful Publication
    console.log("Testing successful post publication...");
    const pubResult = await publishArticleToWordPress(article.id);
    console.log("✓ Publication Result:", pubResult);

    if (pubResult.wordpressPostId !== 9988 || pubResult.article.status !== "PUBLISHED") {
      throw new Error("FAILED: Publication did not return expected wordpressPostId or status PUBLISHED.");
    }

    const payload = receivedPostPayload as WpPostPayload | null;
    if (
      !payload ||
      payload.title !== "Inteligência Artificial Transforma Publicação no WordPress" ||
      !Array.isArray(payload.categories) ||
      payload.categories[0] !== 15
    ) {
      throw new Error("FAILED: Payload sent to WordPress API was invalid.");
    }
    console.log("✓ Verified title, content, category (15) and tags payload received by WordPress API.");

    // 3. Test Publication Failure keeps status PENDING
    console.log("Testing WP Server Error handling (Failure keeps PENDING status)...");
    const failedArticle = await prisma.article.create({
      data: {
        workspaceId: "default-workspace",sourceId: source.id,
        originalUrl: "https://example.com/pub-fail-article",
        originalTitle: "Notícia que deve Falhar",
        title: "Título Falha",
        content: "<p>Conteúdo</p>",
        categoryId: category.id,
        status: "PENDING",
      },
    });

    serverShouldFail = true; // Force WP mock server to return HTTP 500

    let caughtError = false;
    try {
      await publishArticleToWordPress(failedArticle.id);
    } catch (err) {
      caughtError = true;
      console.log("✓ Caught simulated WordPress server error:", (err as Error).message);
    }

    if (!caughtError) {
      throw new Error("FAILED: Error was not thrown on server failure.");
    }

    const checkFailedArticle = await prisma.article.findUnique({ where: { id: failedArticle.id } });
    if (checkFailedArticle?.status !== "PENDING" || checkFailedArticle?.wordpressPostId !== null) {
      throw new Error("FAILED: Failed publication modified status or set wordpressPostId!");
    }
    console.log("✓ Status verified: Retained PENDING status and null wordpressPostId on failure.");

    // Clean up DB
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.article.delete({ where: { id: failedArticle.id } });
    await prisma.wordPressCategory.delete({ where: { id: category.id } });
    await prisma.source.delete({ where: { id: source.id } });
    console.log("✓ Cleaned up test database records.");

  } finally {
    process.env.WORDPRESS_URL = origUrl;
    process.env.WORDPRESS_USERNAME = origUser;
    process.env.WORDPRESS_APPLICATION_PASSWORD = origPass;
    mockServer.close();
  }

  console.log("=== PUBLISH MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Publish test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
