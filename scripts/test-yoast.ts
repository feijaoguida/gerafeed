import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { publishArticleToWordPress } from "../src/lib/wordpress";

interface WpPostPayload {
  title?: string;
  categories?: number[];
  tags?: number[];
  content?: string;
  meta?: {
    _yoast_wpseo_title?: string;
    _yoast_wpseo_metadesc?: string;
    _yoast_wpseo_focuskw?: string;
  };
}

async function main() {
  console.log("=== RUNNING YOAST SEO INTEGRATION TESTS ===");

  const mockPort = 9899;
  let receivedPayload: WpPostPayload | null = null;

  const mockServer = http.createServer((req, res) => {
    if (req.url === "/wp-json/wp/v2/posts" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        receivedPayload = JSON.parse(body) as WpPostPayload;
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: 7007, link: "https://example.com/post-7007" }));
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));
  console.log(`✓ Mock Yoast-enabled WordPress Server running on port ${mockPort}`);

  const origUrl = process.env.WORDPRESS_URL;
  const origUser = process.env.WORDPRESS_USERNAME;
  const origPass = process.env.WORDPRESS_APPLICATION_PASSWORD;

  process.env.WORDPRESS_URL = `http://localhost:${mockPort}`;
  process.env.WORDPRESS_USERNAME = "admin";
  process.env.WORDPRESS_APPLICATION_PASSWORD = "pass";

  try {
    const source = await prisma.source.create({
      data: {
        name: "Yoast Test Source",
        rssUrl: "https://example.com/yoast-rss",
        active: true,
      },
    });

    const category = await prisma.wordPressCategory.create({
      data: {
        wordpressId: 22,
        name: "SEO Tech",
        slug: "seo-tech",
      },
    });

    const article = await prisma.article.create({
      data: {
        sourceId: source.id,
        originalUrl: "https://example.com/yoast-test-1",
        originalTitle: "Notícia Original Yoast",
        title: "Título Editorial Otimizado com Yoast",
        summary: "Resumo para Yoast.",
        content: "<p>Conteúdo relevante para Yoast SEO.</p>",
        categoryId: category.id,
        seoFocusKeyword: "Inteligência Artificial Brasil",
        seoTitle: "Inteligência Artificial no Brasil | Guia Completo 2026",
        seoDescription: "Descubra como a inteligência artificial está transformando a publicação de notícias no Brasil com soluções modernas.",
        status: "PENDING",
      },
    });

    console.log("Publishing article with Yoast SEO metadata...");
    const pubResult = await publishArticleToWordPress(article.id);
    console.log("✓ Publication Result:", pubResult);

    if (pubResult.wordpressPostId !== 7007 || pubResult.article.status !== "PUBLISHED") {
      throw new Error("FAILED: Yoast publication did not return status PUBLISHED.");
    }

    // Verify Yoast Meta Payload
    const payload = receivedPayload as WpPostPayload | null;
    if (!payload || !payload.meta) {
      throw new Error("FAILED: Payload did not contain Yoast meta block!");
    }

    if (
      payload.meta._yoast_wpseo_title !== "Inteligência Artificial no Brasil | Guia Completo 2026" ||
      payload.meta._yoast_wpseo_metadesc !== "Descubra como a inteligência artificial está transformando a publicação de notícias no Brasil com soluções modernas." ||
      payload.meta._yoast_wpseo_focuskw !== "Inteligência Artificial Brasil"
    ) {
      throw new Error("FAILED: Yoast SEO meta fields mismatch!");
    }

    console.log("✓ Yoast Meta payload verified:");
    console.log("  - _yoast_wpseo_title:", payload.meta._yoast_wpseo_title);
    console.log("  - _yoast_wpseo_metadesc:", payload.meta._yoast_wpseo_metadesc);
    console.log("  - _yoast_wpseo_focuskw:", payload.meta._yoast_wpseo_focuskw);

    // Cleanup
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.wordPressCategory.delete({ where: { id: category.id } });
    await prisma.source.delete({ where: { id: source.id } });
    console.log("✓ Cleaned up test database records.");

  } finally {
    process.env.WORDPRESS_URL = origUrl;
    process.env.WORDPRESS_USERNAME = origUser;
    process.env.WORDPRESS_APPLICATION_PASSWORD = origPass;
    mockServer.close();
  }

  console.log("=== YOAST SEO INTEGRATION TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Yoast test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
