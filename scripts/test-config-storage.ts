import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { setConfig, getConfig, getAllConfigs, deleteConfig } from "../src/lib/config";

async function main() {
  console.log("=== RUNNING CONFIGURATION STORAGE TESTS ===");

  const testKey = "testConfigKey_" + Date.now();
  const initialValue = { url: "https://example.com", enabled: true, count: 42 };

  // 1. Test setConfig (Create)
  console.log(`Setting config key "${testKey}"...`);
  const created = await setConfig(testKey, initialValue);
  console.log("✓ Created config entry:", created);

  if (created.key !== testKey) {
    throw new Error("FAILED: Created key mismatch.");
  }

  // 2. Test getConfig (Read)
  console.log("Reading config back...");
  const readValue = await getConfig<typeof initialValue>(testKey);
  console.log("✓ Read value:", readValue);

  if (!readValue || readValue.url !== initialValue.url || readValue.count !== 42) {
    throw new Error("FAILED: Read value did not match initial value.");
  }

  // 3. Test setConfig (Update/Upsert)
  console.log("Updating existing config key...");
  const updatedValue = { url: "https://updated-example.com", enabled: false, count: 99 };
  const updated = await setConfig(testKey, updatedValue);
  console.log("✓ Updated config entry:", updated);

  const reReadValue = await getConfig<typeof updatedValue>(testKey);
  if (!reReadValue || reReadValue.url !== "https://updated-example.com" || reReadValue.count !== 99) {
    throw new Error("FAILED: Upsert did not properly update existing value.");
  }
  console.log("✓ Verified upsert properly updated existing key value.");

  // 4. Test Unique Constraint Verification
  const configsCount = await prisma.configuration.count({ where: { key: testKey } });
  if (configsCount !== 1) {
    throw new Error("FAILED: Key unique constraint violated or multiple records created.");
  }
  console.log("✓ Unique key constraint verified (exactly 1 record exists).");

  // 5. Test getAllConfigs
  const allConfigs = await getAllConfigs();
  console.log(`✓ Fetched ${allConfigs.length} total configuration entries from database.`);

  // 6. Test deleteConfig
  console.log("Cleaning up test config entry...");
  const deleted = await deleteConfig(testKey);
  if (!deleted) {
    throw new Error("FAILED: Could not delete test config entry.");
  }
  const checkDeleted = await getConfig(testKey);
  if (checkDeleted !== null) {
    throw new Error("FAILED: Config key was still present after deletion.");
  }
  console.log("✓ Deleted test config entry successfully.");

  console.log("=== CONFIGURATION STORAGE TESTS COMPLETE: ALL CHECKS PASSED ===");
}

main()
  .catch((err) => {
    console.error("Configuration storage test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
