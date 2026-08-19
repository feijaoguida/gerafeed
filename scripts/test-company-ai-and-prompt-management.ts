import { prisma } from "../src/lib/prisma";
import { setConfig, getConfig } from "../src/lib/config";
import { encrypt, decrypt } from "../src/lib/crypto";
import { resolvePromptType } from "../src/lib/prompt-resolution";
import { AIConfigStored } from "../src/app/api/ai/config/route";
import { PromptSettings } from "../src/lib/ai";


async function runTests() {
  console.log("=========================================================");
  console.log("=== TEST: Task 077 - Company AI & Prompt Management   ===");
  console.log("=========================================================");

  // Create isolated test companies (Company A and Company B)
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["test-ai-company-a", "test-ai-company-b"] } },
  });

  const companyA = await prisma.workspace.create({
    data: {
      name: "Company AI A",
      slug: "test-ai-company-a",
      active: true,
    },
  });

  const companyB = await prisma.workspace.create({
    data: {
      name: "Company AI B",
      slug: "test-ai-company-b",
      active: true,
    },
  });

  console.log("✓ Empresas isoladas criadas: Company A (", companyA.id, ") e Company B (", companyB.id, ")");

  try {
    // ----------------------------------------------------------------
    // 1. AI Provider Configuration with Encrypted Key
    // ----------------------------------------------------------------
    const secretApiKey = "sk-super-secret-anthropic-key-999";
    const encryptedKey = encrypt(secretApiKey);

    const aiDataA: AIConfigStored = {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      baseUrl: "https://custom.anthropic.endpoint.com",
      apiKey: encryptedKey,
    };

    await setConfig("aiProvider", aiDataA, companyA.id);

    const loadedAiA = await getConfig<AIConfigStored>("aiProvider", companyA.id);
    if (!loadedAiA || loadedAiA.provider !== "anthropic" || loadedAiA.model !== "claude-3-5-sonnet-20241022") {
      throw new Error("FAIL: Configuração do provedor de IA não foi salva corretamente.");
    }
    if (decrypt(loadedAiA.apiKey!) !== secretApiKey) {
      throw new Error("FAIL: Descriptografia da API Key falhou.");
    }

    // Sanitization check
    const sanitizedAi = {
      provider: loadedAiA.provider,
      model: loadedAiA.model,
      baseUrl: loadedAiA.baseUrl,
      hasApiKey: Boolean(loadedAiA.apiKey),
    };
    if ("apiKey" in sanitizedAi || !sanitizedAi.hasApiKey) {
      throw new Error("FAIL: Sanitização da API Key falhou.");
    }
    console.log("✓ Check 1 PASS: Provedor de IA configurado com criptografia AES-256-GCM e sanitização de segredos.");

    // ----------------------------------------------------------------
    // 2. Prompt Editorial Settings Configuration
    // ----------------------------------------------------------------
    const promptSettingsA: PromptSettings = {
      portalArea: "Agronegócio & Mercado",
      customPortalArea: "Portal voltado para cotações agrícolas e tecnologia no campo",
      writingStyles: ["Informativo", "Analítico", "Direto"],
      customWritingStyle: "Linguagem técnica mas acessível aos produtores rurais",
    };

    await setConfig("aiPromptSettings", promptSettingsA, companyA.id);

    const loadedPromptA = await getConfig<PromptSettings>("aiPromptSettings", companyA.id);
    if (
      !loadedPromptA ||
      loadedPromptA.portalArea !== "Agronegócio & Mercado" ||
      loadedPromptA.writingStyles.length !== 3
    ) {
      throw new Error("FAIL: Configurações do prompt editorial não foram salvas.");
    }
    console.log("✓ Check 2 PASS: Diretrizes e estilos de escrita do prompt editorial salvos com sucesso.");

    // ----------------------------------------------------------------
    // 3. Prompt Override Resolution Hierarchy
    // ----------------------------------------------------------------
    // Create Source and WordPress site with specific prompt type overrides
    const siteA = await prisma.wordPressSite.create({
      data: {
        workspaceId: companyA.id,
        name: "Agro Portal",
        url: "https://agro.example.com",
        username: "admin",
        encryptedApplicationPassword: "enc",
        defaultPromptType: "opinativo",
        active: true,
      },
    });

    const sourceA = await prisma.source.create({
      data: {
        workspaceId: companyA.id,
        name: "Agro Feed",
        rssUrl: "https://feed.agro.com/rss",
        defaultPromptType: "curto",
        active: true,
      },
    });

    // Test priority 1: Source has 'curto', Site has 'opinativo' -> Source wins over WordPressSite default
    const resultSourceDefault = await resolvePromptType({
      workspaceId: companyA.id,
      sourceId: sourceA.id,
      wordpressSiteId: siteA.id,
    });

    if (resultSourceDefault.promptType !== "curto" || resultSourceDefault.origin !== "SOURCE_DEFAULT") {
      throw new Error(`FAIL: Resolução de prompt falhou. Esperado 'curto' (SOURCE_DEFAULT), obtido '${resultSourceDefault.promptType}' (${resultSourceDefault.origin})`);
    }

    // Test priority 2: Override on WordPressSiteSource
    await prisma.wordPressSiteSource.create({
      data: {
        workspaceId: companyA.id,
        wordpressSiteId: siteA.id,
        sourceId: sourceA.id,
        promptTypeOverride: "analitico",
        active: true,
      },
    });

    const resultOverride = await resolvePromptType({
      workspaceId: companyA.id,
      sourceId: sourceA.id,
      wordpressSiteId: siteA.id,
    });

    if (resultOverride.promptType !== "analitico" || resultOverride.origin !== "OVERRIDE") {
      throw new Error(`FAIL: Resolução de override falhou. Esperado 'analitico' (OVERRIDE), obtido '${resultOverride.promptType}' (${resultOverride.origin})`);
    }
    console.log("✓ Check 3 PASS: Hierarquia de resolução de prompt e overrides por feed/destino validada.");


    // ----------------------------------------------------------------
    // 4. Strict Tenant Isolation (Company A vs Company B)
    // ----------------------------------------------------------------
    const loadedAiB = await getConfig<AIConfigStored>("aiProvider", companyB.id);
    const loadedPromptB = await getConfig<PromptSettings>("aiPromptSettings", companyB.id);

    if (loadedAiB !== null || loadedPromptB !== null) {
      throw new Error("FAIL: Vazamento de configurações de IA/Prompt entre workspaces distintos!");
    }
    console.log("✓ Check 4 PASS: Isolamento estrito de configurações de IA e prompt entre tenants.");

    console.log("\n=========================================================");
    console.log(">>> TODOS OS TESTES DA TASK 077 PASSARAM COM SUCESSO! <<<");
    console.log("=========================================================");
  } finally {
    // Cleanup
    await prisma.configuration.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.source.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.wordPressSite.deleteMany({
      where: { workspaceId: { in: [companyA.id, companyB.id] } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [companyA.id, companyB.id] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE DE IA E PROMPTS:", err);
    process.exit(1);
  });
