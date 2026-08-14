import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { setConfig, getConfig, deleteConfig } from "../src/lib/config";
import { ImageSettingsStored } from "../src/app/api/images/config/route";

async function main() {
  console.log("=== RUNNING IMAGE STRATEGY SETTINGS TEST ===");

  // 1. Direct Config Storage test
  console.log("Testing Configuration table with key 'imageSettings'...");
  await setConfig("imageSettings", { defaultStrategy: "MODIFIED" });

  const stored = await getConfig<ImageSettingsStored>("imageSettings");
  if (!stored || stored.defaultStrategy !== "MODIFIED") {
    throw new Error("FAILED: imageSettings was not persisted in database.");
  }
  console.log("✓ imageSettings persisted & retrieved successfully from Configuration table.");

  // 2. Test updating strategy back to ORIGINAL
  await setConfig("imageSettings", { defaultStrategy: "ORIGINAL" });
  const storedOriginal = await getConfig<ImageSettingsStored>("imageSettings");
  if (!storedOriginal || storedOriginal.defaultStrategy !== "ORIGINAL") {
    throw new Error("FAILED: imageSettings could not be updated to ORIGINAL.");
  }
  console.log("✓ Strategy update to ORIGINAL verified.");

  // Clean up
  await deleteConfig("imageSettings");
  console.log("✓ Cleaned up test database record.");

  console.log("=== IMAGE STRATEGY SETTINGS TEST COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Image strategy test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
