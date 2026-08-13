import "dotenv/config";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { publishArticleToWordPress } from "../src/lib/wordpress";

async function main() {
  console.log("=== RUNNING APPROVAL & REVIEW EDITOR MODULE TESTS ===");

  // 1. Create test records
  const source = await prisma.source.create({
    data: {
      name: "Approval Test Source",
      rssUrl: "https://example.com/approval-rss",
      active: true,
    },
  });

  const category = await prisma.wordPressCategory.create({
    data: {
      wordpressId: 7771,
      name: "Tecnologia Aprovação",
      slug: "tecnologia-aprovacao",
    },
  });

  const articleToReject = await prisma.article.create({
    data: {
      sourceId: source.id,
      originalUrl: "https://example.com/appr-test-1",
      originalTitle: "Notícia Original para Rejeição",
      status: "PENDING",
    },
  });

  const articleToApprove = await prisma.article.create({
    data: {
      sourceId: source.id,
      originalUrl: "https://example.com/appr-test-2",
      originalTitle: "Notícia Original para Aprovação",
      status: "PENDING",
    },
  });

  // 2. Test Editing Fields (PATCH logic)
  console.log("Testing field updates (Draft Save)...");
  const updated = await prisma.article.update({
    where: { id: articleToApprove.id },
    data: {
      title: "Título Editado pelo Revisor",
      summary: "Resumo revisado manualmente.",
      content: "<p>Conteúdo editorial pronto para publicação.</p>",
      categoryId: category.id,
      tags: ["editorial", "aprovacao"],
      seoFocusKeyword: "Notícia Aprovada",
      seoTitle: "Notícia Aprovada: Guia Completo",
      seoDescription: "Descrição meta revisada.",
    },
  });

  if (updated.title !== "Título Editado pelo Revisor" || updated.categoryId !== category.id) {
    throw new Error("FAILED: Article fields were not properly updated.");
  }
  console.log("✓ Article fields successfully edited and saved.");

  // 3. Test Rejection
  console.log("Testing article rejection...");
  const rejected = await prisma.article.update({
    where: { id: articleToReject.id },
    data: { status: "REJECTED" },
  });

  if (rejected.status !== "REJECTED") {
    throw new Error("FAILED: Article status was not changed to REJECTED.");
  }
  console.log("✓ Rejection test passed: Status updated to REJECTED.");

  // 4. Test Approval Validation Failures (Validation checks)
  console.log("Testing approval validation failures...");

  // Empty title test
  const invalidArtNoTitle = await prisma.article.create({
    data: {
      sourceId: source.id,
      originalUrl: "https://example.com/appr-no-title",
      originalTitle: "No title test",
      status: "PENDING",
      content: "<p>Content</p>",
      categoryId: category.id,
    },
  });

  let validationCaught = false;
  try {
    await publishArticleToWordPress(invalidArtNoTitle.id);
  } catch (err) {
    validationCaught = true;
    console.log("✓ Correctly caught validation error for missing title:", (err as Error).message);
  }

  if (!validationCaught) {
    throw new Error("FAILED: Approval validation for missing title was not enforced!");
  }

  // Ensure article remains in queue (status PENDING) after failed approval attempt
  const afterFailedApproval = await prisma.article.findUnique({ where: { id: invalidArtNoTitle.id } });
  if (afterFailedApproval?.status !== "PENDING") {
    throw new Error("FAILED: Article status changed after failed approval attempt.");
  }
  console.log("✓ Verified article remains PENDING in queue after failed approval attempt.");

  // 5. Test Successful Approval and Publication Flow with Mock WP Server
  console.log("Testing successful approval and WP publication flow...");
  const mockPort = 9877;
  const mockServer = http.createServer((req, res) => {
    if (req.url === "/wp-json/wp/v2/posts" && req.method === "POST") {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: 5055, link: "https://example.com/post-5055" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve));

  const origUrl = process.env.WORDPRESS_URL;
  const origUser = process.env.WORDPRESS_USERNAME;
  const origPass = process.env.WORDPRESS_APPLICATION_PASSWORD;

  process.env.WORDPRESS_URL = `http://localhost:${mockPort}`;
  process.env.WORDPRESS_USERNAME = "admin";
  process.env.WORDPRESS_APPLICATION_PASSWORD = "pass";

  try {
    const pubResult = await publishArticleToWordPress(articleToApprove.id);
    console.log("✓ Publication Result:", pubResult);

    if (pubResult.wordpressPostId !== 5055 || pubResult.article.status !== "PUBLISHED") {
      throw new Error("FAILED: Publication did not return expected wordpressPostId or status PUBLISHED.");
    }
    console.log("✓ Successful approval verified: Status updated to PUBLISHED and wordpressPostId saved.");
  } finally {
    process.env.WORDPRESS_URL = origUrl;
    process.env.WORDPRESS_USERNAME = origUser;
    process.env.WORDPRESS_APPLICATION_PASSWORD = origPass;
    mockServer.close();
  }

  // Cleanup
  await prisma.article.delete({ where: { id: articleToReject.id } });
  await prisma.article.delete({ where: { id: articleToApprove.id } });
  await prisma.article.delete({ where: { id: invalidArtNoTitle.id } });
  await prisma.wordPressCategory.delete({ where: { id: category.id } });
  await prisma.source.delete({ where: { id: source.id } });
  console.log("✓ Cleaned up test data.");

  console.log("=== APPROVAL & REVIEW EDITOR MODULE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Approval test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
