import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { processAndStoreImage } from "../src/lib/imageProcessor";

async function main() {
  console.log("=== RUNNING IMAGE PROCESSING PIPELINE TEST ===");

  // 1. Create a dummy Source and Article in DB for testing
  const source = await prisma.source.create({
    data: {
      name: "Image Test Source",
      rssUrl: "https://example.com/rss",
    },
  });

  const testArticleId = `test-img-${Date.now()}`;
  const article = await prisma.article.create({
    data: {
      id: testArticleId,
      sourceId: source.id,
      originalUrl: `https://example.com/article-${testArticleId}`,
      originalTitle: "Test Article with Image",
      originalImageUrl: "https://picsum.photos/200/200",
    },
  });

  console.log(`Created test article ID: ${article.id}`);

  // 2. Run imageProcessor service directly
  console.log("Testing processAndStoreImage()...");
  const modifiedUrl = await processAndStoreImage(article.originalImageUrl!, article.id);

  if (!modifiedUrl) {
    throw new Error("FAILED: processAndStoreImage returned null.");
  }
  if (!modifiedUrl.startsWith("/media/modified-")) {
    throw new Error(`FAILED: Unexpected modifiedUrl format: ${modifiedUrl}`);
  }

  const physicalPath = path.join(process.cwd(), "public", modifiedUrl);
  if (!fs.existsSync(physicalPath)) {
    throw new Error(`FAILED: Processed image file was not found at ${physicalPath}`);
  }

  const stat = fs.statSync(physicalPath);
  if (stat.size === 0) {
    throw new Error("FAILED: Generated image file is 0 bytes.");
  }
  console.log(`✓ Image successfully transformed and stored at ${physicalPath} (${stat.size} bytes).`);

  // 3. Update Article with modifiedImageUrl & selectedImage
  const updatedArticle = await prisma.article.update({
    where: { id: article.id },
    data: {
      modifiedImageUrl: modifiedUrl,
      selectedImage: "MODIFIED",
    },
  });

  if (updatedArticle.modifiedImageUrl !== modifiedUrl || updatedArticle.selectedImage !== "MODIFIED") {
    throw new Error("FAILED: Article database fields modifiedImageUrl/selectedImage were not persisted correctly.");
  }
  console.log("✓ Article fields modifiedImageUrl & selectedImage successfully updated in Prisma.");

  // Clean up
  await prisma.article.delete({ where: { id: article.id } });
  await prisma.source.delete({ where: { id: source.id } });
  if (fs.existsSync(physicalPath)) {
    fs.unlinkSync(physicalPath);
  }
  console.log("✓ Cleaned up test article, source, and generated image file.");

  console.log("=== IMAGE PROCESSING PIPELINE TEST COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Image processing pipeline test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
