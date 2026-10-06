import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import {
  logSystemError,
  sanitizeData,
  handleApiError,
} from "../../src/lib/errors/service";


async function main() {
  console.log("🧪 Testando Serviço de Error Logging e Handler de API (Task 256)...");

  // 1. Testar sanitização de dados sensíveis
  console.log("1. Testando sanitização...");
  const rawPayload = {
    email: "usuario@teste.com",
    password: "SuperSecretPassword123!",
    nested: {
      apiKey: "sk-proj-123456789",
      token: "bearer_xyz987",
      normalField: "valor permitido",
    },
    list: [
      { secret: "hidden", publicName: "item 1" }
    ]
  };

  const sanitized = sanitizeData(rawPayload) as Record<string, unknown>;
  if (sanitized.password !== "[REDACTED]") {
    throw new Error("Sanitização falhou: 'password' não foi mascarado.");
  }
  const nested = sanitized.nested as Record<string, unknown>;
  if (nested.apiKey !== "[REDACTED]" || nested.token !== "[REDACTED]") {
    throw new Error("Sanitização falhou: campos aninhados 'apiKey' ou 'token' não foram mascarados.");
  }
  if (nested.normalField !== "valor permitido") {
    throw new Error("Sanitização falhou: campo legítimo foi alterado.");
  }
  console.log("✓ Sanitização de dados sensíveis aprovada!");

  // 2. Testar gravação de erro via logSystemError
  console.log("2. Testando logSystemError...");
  const fakeError = new Error("Simulação de Falha Crítica na API OpenAI");
  const logId = await logSystemError({
    path: "/api/ai/process",
    method: "POST",
    module: "AI",
    screen: "Artigos / Processamento IA",
    query: { articleId: "art-123", promptType: "NEWS" },
    error: fakeError,
    statusCode: 502,
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 TestBrowser",
  });

  if (!logId) {
    throw new Error("logSystemError não retornou um ID de log.");
  }

  const savedLog = await prisma.systemErrorLog.findUnique({
    where: { id: logId },
  });

  if (!savedLog) {
    throw new Error("Log gravado não foi encontrado no banco de dados.");
  }

  if (savedLog.errorMessage !== "Simulação de Falha Crítica na API OpenAI") {
    throw new Error("Mensagem de erro salva difere da mensagem original.");
  }
  if (savedLog.module !== "AI" || savedLog.statusCode !== 502) {
    throw new Error("Metadados do log gravado estão incorretos.");
  }
  if (!savedLog.errorStack?.includes("Error: Simulação de Falha Crítica")) {
    throw new Error("Stack trace não foi capturado corretamente.");
  }
  console.log("✓ logSystemError gravou com sucesso no banco. ID:", logId);

  // 3. Testar handleApiError mascarando para o usuário
  console.log("3. Testando handleApiError...");
  const dummyRequest = new Request("http://localhost:3000/api/sources?test=123", {
    method: "GET",
    headers: {
      "user-agent": "NodeTestRunner/1.0",
      "x-forwarded-for": "200.100.50.25",
    },
  });

  const response = await handleApiError(
    new Error("Database Connection Timeout ao consultar Feed"),
    dummyRequest,
    {
      module: "RSS",
      screen: "Fontes RSS",
      userFacingMessage: "Não foi possível carregar as fontes RSS no momento.",
    }
  );

  const jsonBody = await response.json();
  if (response.status !== 500) {
    throw new Error(`Status HTTP inesperado: ${response.status}`);
  }
  if (jsonBody.error !== "Não foi possível carregar as fontes RSS no momento.") {
    throw new Error("A mensagem mascarada retornada para o cliente não corresponde ao esperado.");
  }
  if (!jsonBody.errorId) {
    throw new Error("A resposta da API não incluiu o errorId de correlação.");
  }
  console.log("✓ handleApiError mascarou o erro e retornou errorId:", jsonBody.errorId);

  // 4. Limpeza dos logs de teste
  await prisma.systemErrorLog.deleteMany({
    where: {
      id: { in: [logId, jsonBody.errorId] },
    },
  });
  console.log("✓ Logs de teste removidos do banco.");

  console.log("🎉 Teste Task 256 PASSOU com 100% de sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Falha no teste Task 256:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
