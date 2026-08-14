import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { deleteConfig } from "../src/lib/config";
import {
  PromptSettings,
  DEFAULT_PROMPT_SETTINGS,
  buildSystemPrompt,
  SYSTEM_PROMPT_EDITORIAL,
} from "../src/lib/ai";
import { GET, POST } from "../src/app/api/ai/prompt-settings/route";

async function main() {
  console.log("=== RUNNING TASK 025 (AI PROMPT SETTINGS API) TESTS ===");

  // 1. Test buildSystemPrompt() without arguments (retrocompatibility)
  console.log("1. Testing buildSystemPrompt() without arguments...");
  const defaultPrompt = buildSystemPrompt();
  if (!defaultPrompt.includes("portal de notícias de tecnologia e negócios")) {
    throw new Error("FAILED: Default prompt missing standard area 'tecnologia e negócios'.");
  }
  if (!defaultPrompt.includes("totalmente autoral, atraente,")) {
    throw new Error("FAILED: Default prompt missing standard style 'atraente'.");
  }
  if (defaultPrompt !== SYSTEM_PROMPT_EDITORIAL) {
    throw new Error("FAILED: SYSTEM_PROMPT_EDITORIAL constant does not match buildSystemPrompt() output.");
  }
  console.log("✓ buildSystemPrompt() without args matches canonical SYSTEM_PROMPT_EDITORIAL.");

  // 2. Test buildSystemPrompt() with custom settings
  console.log("2. Testing buildSystemPrompt() with custom portalArea and styles...");
  const customSettings1: PromptSettings = {
    portalArea: "Política",
    customPortalArea: "",
    writingStyles: ["Sério", "Analítico", "Informativo"],
    customWritingStyle: "",
  };
  const prompt1 = buildSystemPrompt(customSettings1);
  if (!prompt1.includes("portal de notícias de Política")) {
    throw new Error("FAILED: Custom prompt did not inject 'Política' area.");
  }
  if (!prompt1.includes("totalmente autoral, sério, analítico, informativo,")) {
    throw new Error("FAILED: Custom prompt did not inject styles 'sério, analítico, informativo'.");
  }
  if (!prompt1.includes("1. Relevância: Avalie se a notícia é relevante para um portal de Política.")) {
    throw new Error("FAILED: Custom prompt guideline 1 missing 'Política'.");
  }
  console.log("✓ buildSystemPrompt(customSettings) correctly injects area and multiple styles.");

  // 3. Test buildSystemPrompt() with 'Outro' options
  console.log("3. Testing buildSystemPrompt() with 'Outro' custom text options...");
  const customSettings2: PromptSettings = {
    portalArea: "Outro",
    customPortalArea: "Criptoeconomia e Web3",
    writingStyles: ["Analítico", "Outro"],
    customWritingStyle: "Descontraído e Provocativo",
  };
  const prompt2 = buildSystemPrompt(customSettings2);
  if (!prompt2.includes("portal de notícias de Criptoeconomia e Web3")) {
    throw new Error("FAILED: Custom prompt did not use customPortalArea when portalArea is 'Outro'.");
  }
  if (!prompt2.includes("analítico, descontraído e provocativo")) {
    throw new Error("FAILED: Custom prompt did not resolve customWritingStyle when style is 'Outro'.");
  }
  console.log("✓ buildSystemPrompt with 'Outro' custom options resolves correctly.");

  // Cleanup any previous config before testing API
  await deleteConfig("aiPromptSettings");

  // 4. Test GET /api/ai/prompt-settings (initial/empty state)
  console.log("4. Testing GET /api/ai/prompt-settings when empty (default fallback)...");
  const getResInitial = await GET();
  const getDataInitial = await getResInitial.json();
  if (!getDataInitial.success || !getDataInitial.isDefault) {
    throw new Error("FAILED: GET did not return default settings when DB is empty.");
  }
  if (getDataInitial.settings.portalArea !== DEFAULT_PROMPT_SETTINGS.portalArea) {
    throw new Error("FAILED: Initial settings portalArea does not match DEFAULT_PROMPT_SETTINGS.");
  }
  console.log("✓ GET endpoint returns default settings when no record exists.");

  // 5. Test POST validation: writingStyles > 3 items
  console.log("5. Testing POST validation for max 3 writing styles...");
  const reqTooManyStyles = new Request("http://localhost:3000/api/ai/prompt-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      portalArea: "Tecnologia",
      writingStyles: ["Informativo", "Atraente", "Sério", "Humorístico"],
    }),
  });
  const resTooManyStyles = await POST(reqTooManyStyles);
  if (resTooManyStyles.status !== 400) {
    throw new Error(`FAILED: Expected 400 for >3 styles, got ${resTooManyStyles.status}`);
  }
  console.log("✓ POST correctly rejects >3 writing styles with 400 Bad Request.");

  // 6. Test POST validation: customPortalArea > 100 chars
  console.log("6. Testing POST validation for customPortalArea > 100 chars...");
  const reqLongArea = new Request("http://localhost:3000/api/ai/prompt-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      portalArea: "Outro",
      customPortalArea: "A".repeat(101),
      writingStyles: ["Informativo"],
    }),
  });
  const resLongArea = await POST(reqLongArea);
  if (resLongArea.status !== 400) {
    throw new Error(`FAILED: Expected 400 for customPortalArea > 100 chars, got ${resLongArea.status}`);
  }
  console.log("✓ POST correctly rejects customPortalArea > 100 chars with 400 Bad Request.");

  // 7. Test POST validation: customWritingStyle > 100 chars
  console.log("7. Testing POST validation for customWritingStyle > 100 chars...");
  const reqLongStyle = new Request("http://localhost:3000/api/ai/prompt-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      portalArea: "Tecnologia",
      writingStyles: ["Outro"],
      customWritingStyle: "B".repeat(101),
    }),
  });
  const resLongStyle = await POST(reqLongStyle);
  if (resLongStyle.status !== 400) {
    throw new Error(`FAILED: Expected 400 for customWritingStyle > 100 chars, got ${resLongStyle.status}`);
  }
  console.log("✓ POST correctly rejects customWritingStyle > 100 chars with 400 Bad Request.");

  // 8. Test valid POST and persistence
  console.log("8. Testing valid POST and DB persistence...");
  const validPayload: PromptSettings = {
    portalArea: "Educação",
    customPortalArea: "",
    writingStyles: ["Informativo", "Casual"],
    customWritingStyle: "",
  };
  const reqValid = new Request("http://localhost:3000/api/ai/prompt-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload),
  });
  const resValid = await POST(reqValid);
  const dataValid = await resValid.json();
  if (resValid.status !== 200 || !dataValid.success) {
    throw new Error("FAILED: Valid POST failed to save settings.");
  }
  console.log("✓ POST saved valid configuration successfully.");

  // 9. Test GET after POST
  console.log("9. Testing GET /api/ai/prompt-settings to verify persisted data...");
  const getResSaved = await GET();
  const getDataSaved = await getResSaved.json();
  if (getDataSaved.isDefault || getDataSaved.settings.portalArea !== "Educação") {
    throw new Error("FAILED: GET did not return saved settings.");
  }
  if (getDataSaved.settings.writingStyles.length !== 2 || !getDataSaved.settings.writingStyles.includes("Casual")) {
    throw new Error("FAILED: GET did not return saved writingStyles.");
  }
  console.log("✓ GET returned persisted prompt settings correctly.");

  // Cleanup
  await deleteConfig("aiPromptSettings");
  console.log("✓ Cleaned up test records from database.");

  console.log("=== ALL TASK 025 TESTS PASSED SUCCESSFULLY! ===");
}

main()
  .catch((err) => {
    console.error("Task 025 test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
