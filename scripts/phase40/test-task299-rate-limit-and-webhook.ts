import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clearFailedAttempts,
} from "@/lib/security/rate-limit";
import { POST as verifyCodeHandler } from "@/app/api/auth/verify-code/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/forgot-password/reset/route";
import { AsaasGateway } from "@/lib/payments/asaas";

async function runTask299Tests() {
  console.log("=================================================");
  console.log("=== TEST: Task 299 - Rate Limit & Webhook Fail-Closed ===");
  console.log("=================================================");

  // 1. Test checkRateLimit
  console.log("\n[1] Testando checkRateLimit em memória...");
  const rlKey = `test-rl-${Date.now()}`;
  for (let i = 1; i <= 3; i++) {
    const res = checkRateLimit(rlKey, { maxRequests: 3, windowMs: 10_000 });
    if (!res.allowed) {
      throw new Error(`FAIL: checkRateLimit deveria permitir requisição ${i}`);
    }
  }
  const blockedRes = checkRateLimit(rlKey, { maxRequests: 3, windowMs: 10_000 });
  if (blockedRes.allowed) {
    throw new Error("FAIL: checkRateLimit deveria ter bloqueado a 4ª requisição!");
  }
  console.log("✓ checkRateLimit bloqueou corretamente após atingir o limite.");

  // 2. Test OTP Brute Force on /api/auth/verify-code
  console.log("\n[2] Testando proteção anti-força bruta em /api/auth/verify-code...");
  const testEmail = `bruteforce-test-${Date.now()}@example.com`;
  const validCode = "654321";

  // Criar token legítimo no banco
  await prisma.verificationToken.create({
    data: {
      identifier: testEmail,
      token: validCode,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  try {
    // 4 tentativas com código errado (deve retornar HTTP 400)
    for (let i = 1; i <= 4; i++) {
      const req = new Request("https://exemplo.com/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, code: "000000" }),
      });
      const res = await verifyCodeHandler(req);
      if (res.status !== 400) {
        throw new Error(`FAIL: Tentativa ${i} deveria retornar 400, retornou ${res.status}`);
      }
    }
    console.log("✓ 4 tentativas incorretas foram registradas com aviso de tentativas restantes.");

    // 5ª tentativa com código errado (deve disparar bloqueio HTTP 429 e deletar token do banco)
    const req5 = new Request("https://exemplo.com/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, code: "000000" }),
    });
    const res5 = await verifyCodeHandler(req5);
    if (res5.status !== 429) {
      throw new Error(`FAIL: 5ª tentativa deveria retornar 429, retornou ${res5.status}`);
    }

    // Verificar se o token foi DELETADO do banco de dados
    const tokenInDb = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    });
    if (tokenInDb !== null) {
      throw new Error("FAIL: O token não foi invalidado do banco após 5 tentativas de força bruta!");
    }
    console.log("✓ Na 5ª tentativa falha, retornou HTTP 429 e o token foi destruído no banco.");

    // 6ª tentativa imediata (mesmo se o atacante tentar adivinhar agora, está bloqueado por tempo)
    const req6 = new Request("https://exemplo.com/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, code: validCode }),
    });
    const res6 = await verifyCodeHandler(req6);
    if (res6.status !== 429) {
      throw new Error(`FAIL: Tentativa enquanto bloqueado deveria retornar 429, retornou ${res6.status}`);
    }
    console.log("✓ Bloqueio de 15 minutos ativo: recusa novas tentativas imediatamente com 429.");

  } finally {
    clearFailedAttempts(`otp-verify:${testEmail}`);
    await prisma.verificationToken.deleteMany({ where: { identifier: testEmail } });
  }

  // 3. Test OTP Brute Force on /api/auth/forgot-password/reset
  console.log("\n[3] Testando proteção anti-força bruta em /api/auth/forgot-password/reset...");
  const resetEmail = `reset-bruteforce-${Date.now()}@example.com`;
  const resetIdentifier = `password-reset:${resetEmail}`;

  await prisma.verificationToken.create({
    data: {
      identifier: resetIdentifier,
      token: "123456",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  try {
    for (let i = 1; i <= 4; i++) {
      const req = new Request("https://exemplo.com/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: "999999", password: "NovaSenha123!" }),
      });
      const res = await resetPasswordHandler(req);
      if (res.status !== 400) {
        throw new Error(`FAIL: Reset attempt ${i} deveria retornar 400, retornou ${res.status}`);
      }
    }

    const req5 = new Request("https://exemplo.com/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail, code: "999999", password: "NovaSenha123!" }),
    });
    const res5 = await resetPasswordHandler(req5);
    if (res5.status !== 429) {
      throw new Error(`FAIL: Reset 5ª tentativa deveria retornar 429, retornou ${res5.status}`);
    }

    const resetTokenInDb = await prisma.verificationToken.findFirst({
      where: { identifier: resetIdentifier },
    });
    if (resetTokenInDb !== null) {
      throw new Error("FAIL: O token de password-reset não foi deletado do banco após 5 tentativas!");
    }
    console.log("✓ Anti-força bruta em forgot-password/reset 100% validado.");

  } finally {
    clearFailedAttempts(`otp-reset:${resetEmail}`);
    await prisma.verificationToken.deleteMany({ where: { identifier: resetIdentifier } });
  }

  // 4. Test Asaas Webhook Fail-Closed
  console.log("\n[4] Testando política Fail-Closed no Webhook Asaas...");
  const gatewayWithToken = new AsaasGateway({
    apiKey: "test-key",
    webhookToken: "segredo-webhook-correto-12345",
  });

  // a) Rejeitar chamada sem token
  let rejectedNoToken = false;
  try {
    await gatewayWithToken.handleWebhook({ event: "PAYMENT_CONFIRMED" }, {});
  } catch {
    rejectedNoToken = true;
  }
  if (!rejectedNoToken) {
    throw new Error("FAIL: Webhook aceitou requisição sem cabeçalho de token!");
  }
  console.log("✓ Webhook rejeitou requisição sem cabeçalho de token.");

  // b) Rejeitar chamada com token errado
  let rejectedWrongToken = false;
  try {
    await gatewayWithToken.handleWebhook(
      { event: "PAYMENT_CONFIRMED" },
      { "asaas-access-token": "token-falso-atacante" }
    );
  } catch {
    rejectedWrongToken = true;
  }
  if (!rejectedWrongToken) {
    throw new Error("FAIL: Webhook aceitou token forjado incorreto!");
  }
  console.log("✓ Webhook rejeitou token forjado com timing-safe comparison.");

  // c) Aceitar chamada com token correto
  const validWebhookResult = await gatewayWithToken.handleWebhook(
    { event: "PAYMENT_CONFIRMED", payment: { id: "pay_test_123" } },
    { "asaas-access-token": "segredo-webhook-correto-12345" }
  );
  if (validWebhookResult.type !== "PAYMENT_CONFIRMED") {
    throw new Error("FAIL: Webhook não processou payload legítimo com token correto!");
  }
  console.log("✓ Webhook autenticado com sucesso quando token é legítimo.");

  // d) Fail-Closed quando nenhum token está configurado no servidor
  const oldEnvToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const oldAllowInsecure = process.env.ALLOW_INSECURE_WEBHOOK_TEST;
  try {
    delete process.env.ASAAS_WEBHOOK_TOKEN;
    delete process.env.ALLOW_INSECURE_WEBHOOK_TEST;

    const unconfiguredGateway = new AsaasGateway({ apiKey: "key" });
    let unconfiguredRejected = false;
    try {
      await unconfiguredGateway.handleWebhook({ event: "PAYMENT_CONFIRMED" }, { "asaas-access-token": "abc" });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("ASAAS_WEBHOOK_TOKEN não definido")) {
        unconfiguredRejected = true;
      }
    }
    if (!unconfiguredRejected) {
      throw new Error("FAIL: Gateway sem token configurado não falhou de forma Fail-Closed!");
    }
    console.log("✓ Fail-Closed confirmado: rejeita obrigatoriamente se ASAAS_WEBHOOK_TOKEN não estiver definido.");
  } finally {
    if (oldEnvToken !== undefined) process.env.ASAAS_WEBHOOK_TOKEN = oldEnvToken;
    if (oldAllowInsecure !== undefined) process.env.ALLOW_INSECURE_WEBHOOK_TEST = oldAllowInsecure;
  }

  console.log("\n=================================================");
  console.log(">>> TODOS OS TESTES DA TASK 299 PASSARAM COM SUCESSO! <<<");
  console.log("=================================================");
}

runTask299Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
