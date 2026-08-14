import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { PATCH as updateArticle } from "../src/app/api/articles/[id]/route";

async function main() {
  console.log("=== RUNNING ARTICLE EDITOR IMAGES TEST ===");

  // 1. Create a dummy Source and Article in DB for testing
  const source = await prisma.source.create({
    data: {
      name: "Editor Image Test Source",
      rssUrl: "https://example.com/editor-rss",
    },
  });

  const testArticleId = `test-editor-img-${Date.now()}`;
  const article = await prisma.article.create({
    data: {
      id: testArticleId,
      sourceId: source.id,
      originalUrl: `https://example.com/article-${testArticleId}`,
      originalTitle: "Test Article Editor Images",
      originalImageUrl: "https://picsum.photos/300/300",
      modifiedImageUrl: `/media/modified-${testArticleId}.jpg`,
      selectedImage: "ORIGINAL",
    },
  });

  console.log(`Created test article ID: ${article.id}`);

  // 2. Test PATCH /api/articles/[id] selecting MODIFIED image
  console.log("Testing PATCH /api/articles/[id] selecting MODIFIED image...");
  const patchReq1 = new Request(`http://localhost/api/articles/${article.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selectedImage: "MODIFIED",
    }),
  });

  const patchRes1 = await updateArticle(patchReq1, { params: Promise.resolve({ id: article.id }) });
  if (!patchRes1.ok) {
    throw new Error("FAILED: PATCH /api/articles/[id] returned non-200 status.");
  }

  const patchedArticle1 = await patchRes1.json();
  if (patchedArticle1.selectedImage !== "MODIFIED") {
    throw new Error(`FAILED: selectedImage was not updated to MODIFIED. Got: ${patchedArticle1.selectedImage}`);
  }
  console.log("✓ PATCH /api/articles/[id] updated selectedImage to MODIFIED.");

  // 3. Test PATCH /api/articles/[id] selecting ORIGINAL image
  console.log("Testing PATCH /api/articles/[id] selecting ORIGINAL image...");
  const patchReq2 = new Request(`http://localhost/api/articles/${article.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selectedImage: "ORIGINAL",
    }),
  });

  const patchRes2 = await updateArticle(patchReq2, { params: Promise.resolve({ id: article.id }) });
  if (!patchRes2.ok) {
    throw new Error("FAILED: PATCH /api/articles/[id] returned non-200 status.");
  }

  const patchedArticle2 = await patchRes2.json();
  if (patchedArticle2.selectedImage !== "ORIGINAL") {
    throw new Error(`FAILED: selectedImage was not updated to ORIGINAL. Got: ${patchedArticle2.selectedImage}`);
  }
  console.log("✓ PATCH /api/articles/[id] updated selectedImage to ORIGINAL.");

  // Clean up
  await prisma.article.delete({ where: { id: article.id } });
  await prisma.source.delete({ where: { id: source.id } });
  console.log("✓ Cleaned up test article & source.");

  console.log("=== ARTICLE EDITOR IMAGES TEST COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Article editor images test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
