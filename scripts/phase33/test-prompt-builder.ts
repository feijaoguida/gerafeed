import {
  buildImagePrompt,
  extractKeyEntities,
  extractSceneContext,
} from "../../src/lib/images/prompt-builder";
import { ImageStyle } from "../../src/lib/images/types";

async function runTest() {
  console.log("--- TEST TASK 269: MOTOR DE PROMPT VISUAL CONTEXTUALIZADO ---");

  try {
    const sampleTitle = "STF inicia julgamento histórico sobre regulação de inteligência artificial";
    const sampleSummary =
      "O ministro Alexandre de Moraes e o presidente da Câmara discutem novos marcos legais para IA no plenário do tribunal em Brasília.";
    const sampleContent =
      "<p>Em sessão solene no Supremo Tribunal Federal, os ministros debatem normas de segurança para grandes empresas de tecnologia como Google e Microsoft.</p>";

    // 1. Testar extração de entidades / personagens
    const entities = extractKeyEntities(`${sampleTitle} ${sampleSummary} ${sampleContent}`);
    console.log("✔ 1. Entidades extraídas com sucesso:", entities);
    if (!entities.some((e) => e.includes("Moraes") || e.includes("Alexandre") || e.includes("Supremo") || e.includes("Brasília"))) {
      throw new Error("Falha ao extrair entidades relevantes!");
    }

    // 2. Testar extração de cenário
    const { context, scene } = extractSceneContext(sampleTitle, sampleSummary);
    console.log("✔ 2. Contexto e cenário detectados:");
    console.log(`   Cenário: "${scene}"`);
    console.log(`   Contexto: "${context.substring(0, 50)}..."`);
    if (!scene.includes("courtroom") && !scene.includes("legal")) {
      throw new Error("Deveria ter detectado cenário judicial/tribunal!");
    }

    // 3. Testar os 5 Estilos Visuais
    const styles: ImageStyle[] = ["REALISTIC", "CARTOON", "DRAWING", "SATIRICAL_CARTOON", "CUSTOM"];

    for (const style of styles) {
      const prompt = await buildImagePrompt({
        title: sampleTitle,
        summary: sampleSummary,
        content: sampleContent,
        style,
        customStyle: style === "CUSTOM" ? "steampunk retrofuturistic aesthetic" : undefined,
        originalImageUrl: "https://example.com/noticia-stf.jpg",
      });

      console.log(`✔ 3. Prompt gerado para estilo [${style}]:`);
      console.log(`   "${prompt.substring(0, 120)}..."`);

      if (style === "REALISTIC" && !prompt.includes("photorealistic")) {
        throw new Error("Prompt REALISTIC deve conter 'photorealistic'!");
      }
      if (style === "CARTOON" && !prompt.includes("3D animation cartoon")) {
        throw new Error("Prompt CARTOON deve conter '3D animation cartoon'!");
      }
      if (style === "DRAWING" && !prompt.includes("illustration")) {
        throw new Error("Prompt DRAWING deve conter 'illustration'!");
      }
      if (style === "SATIRICAL_CARTOON" && !prompt.includes("caricature") && !prompt.includes("cartoon")) {
        throw new Error("Prompt SATIRICAL_CARTOON deve conter 'caricature'!");
      }
      if (style === "CUSTOM" && !prompt.includes("steampunk")) {
        throw new Error("Prompt CUSTOM deve conter o estilo personalizado informado!");
      }

      // Validação de qualidade e restrições universais
      if (!prompt.includes("No text") || !prompt.includes("no watermarks")) {
        throw new Error("Prompt deve conter diretrizes negativas de qualidade!");
      }
    }

    console.log("\n==========================================");
    console.log("TASK 269: TODOS OS TESTES PASSARAM COM SUCESSO! 🚀");
    console.log("==========================================\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO NO TESTE DA TASK 269:", error);
    process.exit(1);
  }
}

runTest();
