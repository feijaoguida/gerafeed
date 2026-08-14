import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { deleteConfig } from "../src/lib/config";
import { buildSystemPrompt, PromptSettings } from "../src/lib/ai";
import { GET, POST } from "../src/app/api/ai/prompt-settings/route";

async function main() {
  console.log("=== RUNNING TASK 027 (AI SETTINGS TABS & PROMPT UI) TESTS ===");

  // 1. Validate options consistency
  const expectedAreas = [
    "Tecnologia",
    "Negócios",
    "Política",
    "Ciência",
    "Saúde",
    "Entretenimento",
    "Esportes",
    "Educação",
    "Humor",
    "Meio Ambiente",
    "Outro",
  ];

  const expectedStyles = [
    "Informativo",
    "Atraente",
    "Sério",
    "Alegre",
    "Humorístico",
    "Analítico",
    "Provocativo",
    "Casual",
    "Técnico",
    "Persuasivo",
    "Outro",
  ];

  console.log("1. Validating prompt preview generation for all areas & styles...");
  for (const area of expectedAreas) {
    const prompt = buildSystemPrompt({
      portalArea: area,
      customPortalArea: area === "Outro" ? "Criptografia Quântica" : "",
      writingStyles: ["Informativo", "Atraente"],
      customWritingStyle: "",
    });

    const targetArea = area === "Outro" ? "Criptografia Quântica" : area;
    if (!prompt.includes(`portal de notícias de ${targetArea}`)) {
      throw new Error(`FAILED: Prompt generation failed for area '${area}'`);
    }
  }
  console.log("✓ All portal areas generate correct system prompt text.");

  for (const style of expectedStyles) {
    const prompt = buildSystemPrompt({
      portalArea: "Tecnologia",
      customPortalArea: "",
      writingStyles: [style],
      customWritingStyle: style === "Outro" ? "Sarcástico" : "",
    });

    const targetStyle = style === "Outro" ? "sarcástico" : style.toLowerCase();
    if (!prompt.includes(`totalmente autoral, ${targetStyle},`)) {
      throw new Error(`FAILED: Prompt generation failed for style '${style}'`);
    }
  }
  console.log("✓ All writing styles generate correct system prompt text.");

  // 2. Validate max 3 styles UI constraint logic
  console.log("2. Validating 3-style limit behavior...");
  const sample3Styles = ["Informativo", "Analítico", "Casual"];
  const prompt3 = buildSystemPrompt({
    portalArea: "Negócios",
    customPortalArea: "",
    writingStyles: sample3Styles,
    customWritingStyle: "",
  });
  if (!prompt3.includes("informativo, analítico, casual")) {
    throw new Error("FAILED: 3 styles did not format properly.");
  }
  console.log("✓ 3-styles formatting verified.");

  // 3. Test API integration with full roundtrip
  console.log("3. Testing roundtrip API save & load with custom area and custom style...");
  const customPayload: PromptSettings = {
    portalArea: "Outro",
    customPortalArea: "Inteligência Artificial e Robótica",
    writingStyles: ["Técnico", "Outro"],
    customWritingStyle: "Direto e Aprofundado",
  };

  const postReq = new Request("http://localhost:3000/api/ai/prompt-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customPayload),
  });
  const postRes = await POST(postReq);
  const postData = await postRes.json();
  if (postRes.status !== 200 || !postData.success) {
    throw new Error("FAILED: POST prompt-settings failed.");
  }

  const getRes = await GET();
  const getData = await getRes.json();
  if (getData.settings.customPortalArea !== "Inteligência Artificial e Robótica" || getData.settings.customWritingStyle !== "Direto e Aprofundado") {
    throw new Error("FAILED: GET returned mismatched custom fields.");
  }
  console.log("✓ Full roundtrip save and load verified.");

  // Cleanup
  await deleteConfig("aiPromptSettings");
  console.log("✓ Cleaned up test records from database.");

  console.log("=== ALL TASK 027 TESTS PASSED SUCCESSFULLY! ===");
}

main()
  .catch((err) => {
    console.error("Task 027 test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
