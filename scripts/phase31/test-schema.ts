import "dotenv/config";
import { prisma } from "../../src/lib/prisma";

async function main() {
  console.log("🧪 Testando modelos SystemErrorLog e SystemSetting...");

  // 1. Testar SystemSetting
  const setting = await prisma.systemSetting.upsert({
    where: { key: "error_log_retention_days" },
    update: { value: 180 },
    create: {
      key: "error_log_retention_days",
      value: 180,
      description: "Tempo de retenção de logs de erro em dias antes do expurgo automático",
    },
  });
  console.log("✓ SystemSetting verificado:", setting.key, "=", setting.value);

  // 2. Testar criação de SystemErrorLog
  const errorLog = await prisma.systemErrorLog.create({
    data: {
      screen: "Test Screen",
      path: "/api/test",
      method: "POST",
      query: { testKey: "testValue", sanitized: true },
      module: "GENERAL",
      errorMessage: "Erro de teste simulado antes de mascaramento",
      errorStack: "Error: Erro de teste simulado\n    at main (test-schema.ts:25:21)",
      statusCode: 500,
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent/1.0",
    },
  });
  console.log("✓ SystemErrorLog criado com ID:", errorLog.id);

  // 3. Testar busca
  const fetched = await prisma.systemErrorLog.findUnique({
    where: { id: errorLog.id },
  });
  if (!fetched || fetched.errorMessage !== "Erro de teste simulado antes de mascaramento") {
    throw new Error("Falha ao buscar SystemErrorLog criado");
  }
  console.log("✓ SystemErrorLog recuperado com sucesso:", fetched.errorMessage);

  // 4. Limpar log de teste
  await prisma.systemErrorLog.delete({
    where: { id: errorLog.id },
  });
  console.log("✓ SystemErrorLog de teste limpo com sucesso!");

  console.log("🎉 Testes de schema da Task 255 PASSOU com 100% de sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Falha no teste de schema:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
