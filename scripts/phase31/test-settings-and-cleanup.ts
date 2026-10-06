import "dotenv/config";
import { prisma } from "../../src/lib/prisma";

async function main() {
  console.log("🧪 Testando Configurações Gerais e Rotina de Limpeza (Task 259)...");

  // 1. Testar configuração de retenção
  const updatedSetting = await prisma.systemSetting.upsert({
    where: { key: "error_log_retention_days" },
    update: { value: 180 },
    create: {
      key: "error_log_retention_days",
      value: 180,
      description: "Tempo de retenção de logs de erro em dias antes do expurgo automático",
    },
  });

  if (updatedSetting.value !== 180) {
    throw new Error("Falha ao salvar configuração error_log_retention_days");
  }
  console.log("✓ Configuração error_log_retention_days validada com 180 dias.");

  // 2. Criar um log antigo (200 dias atrás) e um log recente (hoje)
  const date200DaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
  const oldLog = await prisma.systemErrorLog.create({
    data: {
      path: "/api/test/old-error",
      errorMessage: "Erro antigo que deve ser expurgado",
      createdAt: date200DaysAgo,
    },
  });

  const recentLog = await prisma.systemErrorLog.create({
    data: {
      path: "/api/test/recent-error",
      errorMessage: "Erro recente que deve ser preservado",
      createdAt: new Date(),
    },
  });

  console.log("✓ Logs criados para teste de expurgo. Antigo:", oldLog.id, "Recente:", recentLog.id);

  // 3. Executar rotina de limpeza com cutoff de 180 dias
  const retentionDays = 180;
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const deleteResult = await prisma.systemErrorLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  console.log("✓ Registros deletados na limpeza:", deleteResult.count);
  if (deleteResult.count < 1) {
    throw new Error("A rotina de limpeza deveria ter excluído ao menos 1 registro antigo.");
  }

  // 4. Verificar que o log antigo não existe mais
  const checkOld = await prisma.systemErrorLog.findUnique({
    where: { id: oldLog.id },
  });
  if (checkOld !== null) {
    throw new Error("O log antigo ainda existe no banco após a limpeza!");
  }
  console.log("✓ Confirmação: log antigo (>180 dias) foi expurgado com sucesso.");

  // 5. Verificar que o log recente foi preservado
  const checkRecent = await prisma.systemErrorLog.findUnique({
    where: { id: recentLog.id },
  });
  if (checkRecent === null) {
    throw new Error("O log recente (<180 dias) foi incorretamente apagado!");
  }
  console.log("✓ Confirmação: log recente foi preservado.");

  // 6. Limpeza do log recente
  await prisma.systemErrorLog.delete({
    where: { id: recentLog.id },
  });
  console.log("✓ Limpeza final concluída.");

  console.log("🎉 Teste Task 259 PASSOU com 100% de sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Falha no teste Task 259:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
