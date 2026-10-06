import { prisma } from "../../src/lib/prisma";
import { setConfig, deleteConfig } from "../../src/lib/config";
import { encrypt } from "../../src/lib/crypto";
import { resolveImageCredentials } from "../../src/lib/images/credentials";
import { createImageGenerator } from "../../src/lib/images/service";
import { ImageSettingsStored } from "../../src/lib/images/types";
import { AIConfigStored } from "../../src/app/api/ai/config/route";

async function runTest() {
  console.log("--- TEST TASK 268: SERVIÇO CENTRAL E ADAPTERS DE IMAGEM ---");
  const testWorkspaceId = "test-ws-phase33-task268";

  try {
    // 0. Setup Workspace
    await prisma.workspace.upsert({
      where: { id: testWorkspaceId },
      update: {},
      create: {
        id: testWorkspaceId,
        name: "Test Workspace Task 268",
        slug: `test-task268-${Date.now()}`,
      },
    });
    console.log("✔ 0. Workspace de teste criado.");

    // 1. Cenário 1: LLM de texto OpenAI -> herança de DALL-E 3
    const openAiTextConfig: AIConfigStored = {
      provider: "openai",
      apiKey: encrypt("sk-test-openai-key-12345"),
      model: "gpt-4o",
    };
    await setConfig("aiProvider", openAiTextConfig, testWorkspaceId);
    await setConfig<ImageSettingsStored>(
      "imageSettings",
      { defaultStrategy: "AI_GENERATED", imageStyle: "REALISTIC", useSameKeyAsTextAi: true },
      testWorkspaceId
    );

    const credsOpenAI = await resolveImageCredentials(testWorkspaceId);
    console.log("✔ 1. Herança OpenAI resolvida com sucesso:");
    console.log(`   Provider: ${credsOpenAI.provider}, Model: ${credsOpenAI.model}, Inherited: ${credsOpenAI.isInheritedFromTextAi}`);
    if (credsOpenAI.provider !== "openai" || credsOpenAI.model !== "dall-e-3" || !credsOpenAI.isInheritedFromTextAi) {
      throw new Error("Falha na resolução de herança OpenAI!");
    }

    const generatorOpenAI = createImageGenerator(credsOpenAI);
    if (generatorOpenAI.name !== "OpenAI DALL-E") {
      throw new Error("Generator OpenAI incorreto!");
    }

    // 2. Cenário 2: LLM de texto Gemini -> herança de Google Imagen 3
    const geminiTextConfig: AIConfigStored = {
      provider: "gemini",
      apiKey: encrypt("AIzaSy-test-gemini-key"),
      model: "gemini-1.5-pro",
    };
    await setConfig("aiProvider", geminiTextConfig, testWorkspaceId);

    const credsGemini = await resolveImageCredentials(testWorkspaceId);
    console.log("✔ 2. Herança Gemini resolvida com sucesso:");
    console.log(`   Provider: ${credsGemini.provider}, Model: ${credsGemini.model}, Inherited: ${credsGemini.isInheritedFromTextAi}`);
    if (credsGemini.provider !== "gemini" || credsGemini.model !== "imagen-3.0-generate-002") {
      throw new Error("Falha na resolução de herança Gemini!");
    }

    const generatorGemini = createImageGenerator(credsGemini);
    if (generatorGemini.name !== "Google Imagen") {
      throw new Error("Generator Gemini incorreto!");
    }

    // 3. Cenário 3: LLM de texto OpenAI-Compatible (OpenRouter) -> herança de FLUX.1
    const openRouterTextConfig: AIConfigStored = {
      provider: "openai-compatible",
      apiKey: encrypt("sk-or-v1-test-openrouter-key"),
      model: "deepseek/deepseek-chat",
      baseUrl: "https://openrouter.ai/api/v1",
    };
    await setConfig("aiProvider", openRouterTextConfig, testWorkspaceId);

    const credsOpenRouter = await resolveImageCredentials(testWorkspaceId);
    console.log("✔ 3. Herança OpenRouter resolvida com sucesso:");
    console.log(`   Provider: ${credsOpenRouter.provider}, Model: ${credsOpenRouter.model}, Inherited: ${credsOpenRouter.isInheritedFromTextAi}`);
    if (credsOpenRouter.provider !== "openrouter" || credsOpenRouter.model !== "black-forest-labs/flux-1-schnell") {
      throw new Error("Falha na resolução de herança OpenRouter!");
    }

    const generatorFlux = createImageGenerator(credsOpenRouter);
    if (generatorFlux.name !== "OpenRouter FLUX") {
      throw new Error("Generator OpenRouter FLUX incorreto!");
    }

    // 4. Cenário 4: LLM de texto Anthropic SEM chave dedicada de imagem -> deve disparar erro amigável
    const anthropicTextConfig: AIConfigStored = {
      provider: "anthropic",
      apiKey: encrypt("sk-ant-test-anthropic-key"),
      model: "claude-3-5-sonnet",
    };
    await setConfig("aiProvider", anthropicTextConfig, testWorkspaceId);

    let anthropicErrorTriggered = false;
    try {
      await resolveImageCredentials(testWorkspaceId);
    } catch (err) {
      anthropicErrorTriggered = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✔ 4. Erro esperado disparado para Anthropic sem chave de imagem: "${msg}"`);
      if (!msg.includes("Anthropic")) {
        throw new Error("Mensagem de erro não menciona Anthropic!");
      }
    }

    if (!anthropicErrorTriggered) {
      throw new Error("Deveria ter falhado para Anthropic sem chave dedicada de imagem!");
    }

    // 5. Cenário 5: LLM Anthropic COM chave dedicada de imagem -> deve resolver chave dedicada
    await setConfig<ImageSettingsStored>(
      "imageSettings",
      {
        defaultStrategy: "AI_GENERATED",
        imageStyle: "DRAWING",
        useSameKeyAsTextAi: false,
        imageProvider: "openai",
        customApiKey: encrypt("sk-dedicated-image-key-openai"),
        customModel: "dall-e-3",
      },
      testWorkspaceId
    );

    const credsAnthropicWithCustom = await resolveImageCredentials(testWorkspaceId);
    console.log("✔ 5. Anthropic com chave dedicada resolvida com sucesso:");
    console.log(`   Provider: ${credsAnthropicWithCustom.provider}, Model: ${credsAnthropicWithCustom.model}, Inherited: ${credsAnthropicWithCustom.isInheritedFromTextAi}`);
    if (credsAnthropicWithCustom.isInheritedFromTextAi !== false || credsAnthropicWithCustom.provider !== "openai") {
      throw new Error("Falha ao usar chave dedicada no cenário Anthropic!");
    }

    // Limpeza
    await deleteConfig("imageSettings", testWorkspaceId);
    await deleteConfig("aiProvider", testWorkspaceId);
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    console.log("✔ 6. Fixtures de teste limpas com sucesso.");

    console.log("\n==========================================");
    console.log("TASK 268: TODOS OS TESTES PASSARAM COM SUCESSO! 🚀");
    console.log("==========================================\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO NO TESTE DA TASK 268:", error);
    process.exit(1);
  }
}

runTest();
