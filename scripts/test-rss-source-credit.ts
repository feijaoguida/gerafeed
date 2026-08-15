import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { POST as createSource } from "../src/app/api/sources/route";
import { PATCH as updateSource } from "../src/app/api/sources/[id]/route";

async function main() {
  console.log("=== RUNNING RSS SOURCE CREDIT TEST ===");

  // 1. Direct Prisma DB test
  console.log("Testing Prisma model Source with creditName field...");
  const directSource = await prisma.source.create({
    data: {
        workspaceId: "default-workspace",name: "TechCrunch Direct",
      creditName: "TechCrunch Brasil",
      rssUrl: "https://techcrunch.com/feed/direct-test",
      active: true,
    },
  });

  if (directSource.creditName !== "TechCrunch Brasil") {
    throw new Error("FAILED: creditName field was not saved via Prisma.");
  }
  console.log("✓ Prisma Source creditName persisted successfully.");

  // 2. API Route POST test
  console.log("Testing POST /api/sources with creditName...");
  const reqPost = new Request("http://localhost/api/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Gizmodo Brasil",
      creditName: "Gizmodo Br",
      rssUrl: "https://gizmodo.uol.com.br/feed/test",
    }),
  });

  const resPost = await createSource(reqPost);
  if (!resPost.ok) {
    throw new Error("FAILED: POST /api/sources returned non-200 status.");
  }

  const createdData = await resPost.json();
  if (createdData.creditName !== "Gizmodo Br") {
    throw new Error("FAILED: POST /api/sources did not return created creditName.");
  }
  console.log("✓ POST /api/sources creditName saved & returned successfully.");

  // 3. API Route PATCH test
  console.log("Testing PATCH /api/sources/[id] with updated creditName...");
  const reqPatch = new Request(`http://localhost/api/sources/${createdData.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creditName: "Gizmodo Brasil Oficial",
    }),
  });

  const resPatch = await updateSource(reqPatch, { params: Promise.resolve({ id: createdData.id }) });
  if (!resPatch.ok) {
    throw new Error("FAILED: PATCH /api/sources/[id] returned non-200 status.");
  }

  const updatedData = await resPatch.json();
  if (updatedData.creditName !== "Gizmodo Brasil Oficial") {
    throw new Error("FAILED: PATCH /api/sources/[id] did not update creditName.");
  }
  console.log("✓ PATCH /api/sources/[id] creditName updated successfully.");

  // Clean up
  await prisma.source.delete({ where: { id: directSource.id } });
  await prisma.source.delete({ where: { id: createdData.id } });
  console.log("✓ Cleaned up test records.");

  console.log("=== RSS SOURCE CREDIT TEST COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("RSS Source credit test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
