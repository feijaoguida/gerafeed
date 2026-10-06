import { prisma } from "../../src/lib/prisma";
import { getConfig, setConfig, deleteConfig } from "../../src/lib/config";
import {
  ImageSettingsStored,
  ImageStrategy,
  ImageStyle,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
  IMAGE_STYLE_DEFINITIONS,
} from "../../src/lib/images/types";

async function runTest() {
  console.log("--- TEST TASK 267: SCHEMA & CONTRATOS DE IMAGEM COM IA ---");
  const testWorkspaceId = "test-ws-phase33-task267";

  try {
    // 1. Criar Workspace de Teste
    await prisma.workspace.upsert({
      where: { id: testWorkspaceId },
      update: {},
      create: {
        id: testWorkspaceId,
        name: "Test Workspace Phase 33",
        slug: `test-phase33-${Date.now()}`,
      },
    });
    console.log("✔ 1. Workspace de teste criado/verificado.");

    // 2. Testar Article model com generatedImageUrl, imagePrompt e selectedImage = 'AI_GENERATED'
    const testArticle = await prisma.article.create({
      data: {
        workspaceId: testWorkspaceId,
        title: "Artigo de Teste Phase 33",
        originalTitle: "Artigo Original",
        originalImageUrl: "https://example.com/original.jpg",
        modifiedImageUrl: "data:image/jpeg;base64,mockModified",
        generatedImageUrl: "data:image/jpeg;base64,mockGeneratedAI",
        imagePrompt: "Photorealistic scene of a tech conference with speakers on stage",
        selectedImage: "AI_GENERATED",
      },
    });

    console.log("✔ 2. Artigo criado com generatedImageUrl e imagePrompt:");
    console.log(`   ID: ${testArticle.id}`);
    console.log(`   generatedImageUrl: ${testArticle.generatedImageUrl?.substring(0, 30)}...`);
    console.log(`   imagePrompt: ${testArticle.imagePrompt}`);
    console.log(`   selectedImage: ${testArticle.selectedImage}`);

    if (
      testArticle.generatedImageUrl !== "data:image/jpeg;base64,mockGeneratedAI" ||
      testArticle.imagePrompt !== "Photorealistic scene of a tech conference with speakers on stage" ||
      testArticle.selectedImage !== "AI_GENERATED"
    ) {
      throw new Error("Falha na persistência dos novos campos em Article!");
    }

    // 3. Testar Contratos de Configuração de Imagem
    const mockConfig: ImageSettingsStored = {
      defaultStrategy: "AI_GENERATED" as ImageStrategy,
      imageStyle: "CARTOON" as ImageStyle,
      customImageStyle: "",
      imagePromptTemplate: DEFAULT_IMAGE_PROMPT_TEMPLATE,
      imageProvider: "openai",
      useSameKeyAsTextAi: true,
      customModel: "dall-e-3",
    };

    await setConfig("imageSettings", mockConfig, testWorkspaceId);
    const retrievedConfig = await getConfig<ImageSettingsStored>("imageSettings", testWorkspaceId);

    console.log("✔ 3. Configurações de imagem salvas e recuperadas:");
    console.log(`   defaultStrategy: ${retrievedConfig?.defaultStrategy}`);
    console.log(`   imageStyle: ${retrievedConfig?.imageStyle}`);
    console.log(`   useSameKeyAsTextAi: ${retrievedConfig?.useSameKeyAsTextAi}`);

    if (
      retrievedConfig?.defaultStrategy !== "AI_GENERATED" ||
      retrievedConfig?.imageStyle !== "CARTOON" ||
      retrievedConfig?.useSameKeyAsTextAi !== true
    ) {
      throw new Error("Falha na persistência das configurações de imagem!");
    }

    // 4. Testar Estilos Visuais Mapeados
    const styles: ImageStyle[] = ["REALISTIC", "CARTOON", "DRAWING", "SATIRICAL_CARTOON", "CUSTOM"];
    for (const s of styles) {
      const def = IMAGE_STYLE_DEFINITIONS[s];
      if (!def || !def.label) {
        throw new Error(`Definição ausente para estilo ${s}`);
      }
    }
    console.log(`✔ 4. Todos os 5 estilos visuais definidos com sucesso: ${styles.join(", ")}`);

    // Limpeza
    await prisma.article.delete({ where: { id: testArticle.id } });
    await deleteConfig("imageSettings", testWorkspaceId);
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    console.log("✔ 5. Fixtures de teste limpas com sucesso.");

    console.log("\n==========================================");
    console.log("TASK 267: TODOS OS TESTES PASSARAM COM SUCESSO! 🚀");
    console.log("==========================================\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO NO TESTE DA TASK 267:", error);
    process.exit(1);
  }
}

runTest();
