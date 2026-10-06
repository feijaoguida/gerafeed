import { prisma } from "../../src/lib/prisma";
import { getConfig, setConfig, DEFAULT_WORKSPACE_ID } from "../../src/lib/config";
import { ImageSettingsStored } from "../../src/lib/images/types";

async function main() {
  console.log("=== Testando Fluxo de Configuração de Imagens e Validação da UI ===");

  const workspaceId = DEFAULT_WORKSPACE_ID;

  // 1. Snapshot da configuração existente
  const initialConfig = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);
  console.log("Configuração inicial:", initialConfig);

  // 2. Salvar configuração completa com estilo CARTOON e AI_GENERATED
  const newConfig: ImageSettingsStored = {
    defaultStrategy: "AI_GENERATED",
    imageStyle: "CARTOON",
    imagePromptTemplate: "Custom prompt template: {{title}} in style {{style}}",
    useSameKeyAsTextAi: true,
    imageProvider: "openai",
  };

  await setConfig("imageSettings", newConfig, workspaceId);
  console.log("✔ Configuração gravada com sucesso.");

  // 3. Ler de volta e verificar fidelidade
  const retrieved = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);
  if (!retrieved) {
    throw new Error("FALHA: Configuração não foi retornada do banco.");
  }

  if (retrieved.defaultStrategy !== "AI_GENERATED") {
    throw new Error(`FALHA: defaultStrategy esperada AI_GENERATED, recebida ${retrieved.defaultStrategy}`);
  }

  if (retrieved.imageStyle !== "CARTOON") {
    throw new Error(`FALHA: imageStyle esperado CARTOON, recebido ${retrieved.imageStyle}`);
  }

  if (retrieved.useSameKeyAsTextAi !== true) {
    throw new Error("FALHA: useSameKeyAsTextAi esperado true.");
  }
  console.log("✔ Verificação de fidelidade dos campos: PASS.");

  // 4. Testar alternância para estilo SATIRICAL_CARTOON
  await setConfig(
    "imageSettings",
    {
      ...retrieved,
      imageStyle: "SATIRICAL_CARTOON",
      customImageStyle: undefined,
    },
    workspaceId
  );

  const satiricalCheck = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);
  if (satiricalCheck?.imageStyle !== "SATIRICAL_CARTOON") {
    throw new Error("FALHA: imageStyle não atualizou para SATIRICAL_CARTOON.");
  }
  console.log("✔ Teste de alternância para estilo SATIRICAL_CARTOON: PASS.");

  // 5. Testar alternância para estilo CUSTOM
  await setConfig(
    "imageSettings",
    {
      ...retrieved,
      imageStyle: "CUSTOM",
      customImageStyle: "cyberpunk editorial neon",
    },
    workspaceId
  );

  const customCheck = await getConfig<ImageSettingsStored>("imageSettings", workspaceId);
  if (customCheck?.imageStyle !== "CUSTOM" || customCheck?.customImageStyle !== "cyberpunk editorial neon") {
    throw new Error("FALHA: imageStyle CUSTOM não persistiu customImageStyle.");
  }
  console.log("✔ Teste de estilo CUSTOM: PASS.");

  // 6. Restaurar configuração inicial
  if (initialConfig) {
    await setConfig("imageSettings", initialConfig, workspaceId);
  } else {
    await prisma.configuration.deleteMany({
      where: { key: "imageSettings", workspaceId },
    });
  }
  console.log("✔ Configuração original restaurada com sucesso.");

  console.log("=== Todos os testes de fluxo de UI/Configuração PASSARAM com sucesso! ===");
}

main().catch((err) => {
  console.error("Erro no teste de fluxo de UI:", err);
  process.exit(1);
});
