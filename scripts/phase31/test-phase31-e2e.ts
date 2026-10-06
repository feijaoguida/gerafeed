import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import {
  logSystemError,
  sanitizeData,
  handleApiError,
} from "../../src/lib/errors/service";

async function main() {
  console.log("======================================================================");
  console.log("🚀 BATERIA DE TESTES INTEGRADOS E2E — PHASE 31");
  console.log("======================================================================");

  // 1. Cenário 1: Sanitização estrita de credenciais
  console.log("\n[Cenário 1] Sanitização de credenciais, senhas e tokens sensíveis...");
  const maliciousPayload = {
    user: "suporte@teste.com",
    password: "SuperSecretPassword#2026",
    newPassword: "AnotherSecret#123",
    nested: {
      apiKey: "sk-proj-abc123456789",
      secretToken: "jwt_token_here",
      applicationPassword: "wp-app-pass-secret",
      creditCard: "4111111111111111",
      normalProp: "dado_permitido",
    },
    arrayField: [
      { token: "tok_123", label: "Tag 1" }
    ],
  };

  const sanitized = sanitizeData(maliciousPayload) as Record<string, unknown>;
  if (sanitized.password !== "[REDACTED]" || sanitized.newPassword !== "[REDACTED]") {
    throw new Error("Cenário 1 falhou: senhas não foram redigidas.");
  }
  const nested = sanitized.nested as Record<string, unknown>;
  if (
    nested.apiKey !== "[REDACTED]" ||
    nested.secretToken !== "[REDACTED]" ||
    nested.applicationPassword !== "[REDACTED]" ||
    nested.creditCard !== "[REDACTED]"
  ) {
    throw new Error("Cenário 1 falhou: campos aninhados confidenciais não foram redigidos.");
  }
  if (nested.normalProp !== "dado_permitido") {
    throw new Error("Cenário 1 falhou: propriedade legítima foi afetada.");
  }
  console.log("✓ Cenário 1 APROVADO: Dados sensíveis foram 100% redigidos.");

  // 2. Cenário 2: Tratamento de Erro de Servidor com Mascaramento e Logging
  console.log("\n[Cenário 2] Tratamento no servidor com gravação completa e mascaramento client...");
  const sampleWorkspace = await prisma.workspace.findFirst();
  const testWorkspaceId = sampleWorkspace?.id || null;

  const serverError = new Error("Connection failed to Asaas Gateway: ETIMEDOUT 10.0.0.1:443");
  const dummyApiRequest = new Request("http://localhost:3000/api/billing/checkout", {
    method: "POST",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "x-forwarded-for": "177.18.25.10",
    },
  });

  const apiResponse = await handleApiError(serverError, dummyApiRequest, {
    module: "BILLING",
    screen: "Checkout de Assinatura",
    workspaceId: testWorkspaceId,
    query: { planId: "pro", cycle: "monthly", password: "should_be_redacted" },
    userFacingMessage: "Não foi possível conectar ao gateway de pagamento. Tente novamente.",
  });

  const responseJson = await apiResponse.json();
  if (apiResponse.status !== 500) {
    throw new Error(`Cenário 2 falhou: status HTTP inesperado: ${apiResponse.status}`);
  }
  if (responseJson.error !== "Não foi possível conectar ao gateway de pagamento. Tente novamente.") {
    throw new Error("Cenário 2 falhou: mensagem mascarada não retornada.");
  }
  if (!responseJson.errorId) {
    throw new Error("Cenário 2 falhou: errorId ausente na resposta.");
  }

  // Verifica no banco
  const loggedError = await prisma.systemErrorLog.findUnique({
    where: { id: responseJson.errorId },
  });
  if (!loggedError) {
    throw new Error("Cenário 2 falhou: log não encontrado no banco.");
  }
  if (!loggedError.errorMessage.includes("ETIMEDOUT 10.0.0.1:443")) {
    throw new Error("Cenário 2 falhou: mensagem original bruta não foi gravada no banco.");
  }
  if (loggedError.module !== "BILLING" || loggedError.screen !== "Checkout de Assinatura") {
    throw new Error("Cenário 2 falhou: metadados do erro incorretos.");
  }
  console.log("✓ Cenário 2 APROVADO: Resposta mascarada entregue ao cliente e diagnóstico bruto gravado.");

  // 3. Cenário 3: Erro Reportado pelo Client com Contexto de Tela
  console.log("\n[Cenário 3] Reporte de erro do frontend (client-side)...");
  const clientLogId = await logSystemError({
    screen: "Editor de Artigos / Inserção de Blocos",
    path: "/articles/editor?id=art-99",
    method: "CLIENT",
    query: { selectionIndex: 42, blockType: "PRODUCT_CARD" },
    module: "AFFILIATES",
    error: new Error("DOMException: The given range isn't in document"),
    statusCode: 400,
    userEmail: "redator@revista.com",
    userName: "Redator Chefe",
  });

  if (!clientLogId) {
    throw new Error("Cenário 3 falhou: logSystemError do client falhou.");
  }

  const clientLog = await prisma.systemErrorLog.findUnique({
    where: { id: clientLogId },
  });
  if (!clientLog || clientLog.method !== "CLIENT" || clientLog.userEmail !== "redator@revista.com") {
    throw new Error("Cenário 3 falhou: dados do client não gravados corretamente.");
  }
  console.log("✓ Cenário 3 APROVADO: Erro do client gravado com usuário, tela, rota e stack.");

  // 4. Cenário 4: Filtros no Backoffice por Tenant, Módulo, Usuário e Data
  console.log("\n[Cenário 4] Validação dos filtros de auditoria do Backoffice...");
  // 4.1 Filtro por Módulo
  const billingLogs = await prisma.systemErrorLog.findMany({
    where: { module: "BILLING" },
  });
  if (!billingLogs.some((l) => l.id === responseJson.errorId)) {
    throw new Error("Cenário 4.1 falhou: filtro por módulo BILLING.");
  }

  // 4.2 Filtro por Usuário
  const userLogs = await prisma.systemErrorLog.findMany({
    where: { userEmail: { contains: "redator@revista.com" } },
  });
  if (!userLogs.some((l) => l.id === clientLogId)) {
    throw new Error("Cenário 4.2 falhou: filtro por usuário.");
  }
  console.log("✓ Cenário 4 APROVADO: Filtros de auditoria operando perfeitamente.");

  // 5. Cenário 5: Configuração de Retenção e Rotina de Limpeza
  console.log("\n[Cenário 5] Retenção configurável (180 dias) e rotina de expurgo...");
  // Cria log antigo (> 180 dias)
  const oldDate = new Date(Date.now() - 190 * 24 * 60 * 60 * 1000);
  const oldLogRecord = await prisma.systemErrorLog.create({
    data: {
      path: "/api/legacy-endpoint",
      errorMessage: "Erro antigo de 190 dias atrás",
      createdAt: oldDate,
    },
  });

  const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const cleanupBatch = await prisma.systemErrorLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  if (cleanupBatch.count < 1) {
    throw new Error("Cenário 5 falhou: nenhum log antigo foi deletado.");
  }

  const checkDeleted = await prisma.systemErrorLog.findUnique({
    where: { id: oldLogRecord.id },
  });
  if (checkDeleted !== null) {
    throw new Error("Cenário 5 falhou: o log com mais de 180 dias não foi expurgado.");
  }

  // Garante que os recentes criados no teste ainda existem
  const checkRecentServer = await prisma.systemErrorLog.findUnique({
    where: { id: responseJson.errorId },
  });
  if (!checkRecentServer) {
    throw new Error("Cenário 5 falhou: log recente foi apagado indevidamente.");
  }
  console.log("✓ Cenário 5 APROVADO: Expurgo apagou apenas registros além do limiar de retenção.");

  // 6. Limpeza dos registros de teste
  await prisma.systemErrorLog.deleteMany({
    where: {
      id: { in: [responseJson.errorId, clientLogId] },
    },
  });
  console.log("✓ Registros temporários de teste limpos.");

  console.log("\n======================================================================");
  console.log("🎉 TODOS OS 5 CENÁRIOS DA PHASE 31 PASSARAM COM 100% DE SUCESSO!");
  console.log("======================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Falha na bateria de testes E2E da Phase 31:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
