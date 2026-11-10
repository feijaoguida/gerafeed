import { prisma } from "../../src/lib/prisma";
import { CouponService } from "../../src/lib/coupons";
import { PlanHistoryService } from "../../src/lib/plan-history";
import { SiteAntifraudService } from "../../src/lib/site-antifraud";

async function main() {
  console.log("--- TESTANDO TASK 290: CORE SERVICES ---");

  // 1. Testar Normalização e Cálculo de Cupons
  console.log("\n1. Testando CouponService...");
  const code = CouponService.normalizeCouponCode("  influencer 19  ");
  if (code !== "INFLUENCER19") {
    throw new Error(`Normalização falhou: ${code}`);
  }

  // Preço de R$ 89,90 com FIXED_PRICE de R$ 19,90
  const pricing1 = CouponService.calculateCouponPricing(89.9, "FIXED_PRICE", 19.9);
  console.log("FIXED_PRICE 19.90:", pricing1);
  if (pricing1.discountedAmount.toNumber() !== 19.9) {
    throw new Error("Cálculo FIXED_PRICE falhou");
  }

  // Preço de R$ 89,90 com PERCENTAGE de 20%
  const pricing2 = CouponService.calculateCouponPricing(89.9, "PERCENTAGE", 20);
  console.log("PERCENTAGE 20%:", pricing2);
  if (pricing2.discountedAmount.toNumber() !== 71.92) {
    throw new Error("Cálculo PERCENTAGE falhou");
  }

  // 2. Testar Normalização de Domínio WordPress
  console.log("\n2. Testando SiteAntifraudService...");
  const norm1 = SiteAntifraudService.normalizeSiteDomain("https://www.meusite.com.br/wp-admin/");
  const norm2 = SiteAntifraudService.normalizeSiteDomain("http://meusite.com.br:8080/wp-login.php?redirect_to=xxx");
  const norm3 = SiteAntifraudService.normalizeSiteDomain("meusite.com.br/xmlrpc.php#section");
  console.log("Domínios normalizados:", { norm1, norm2, norm3 });

  if (norm1 !== "meusite.com.br" || norm2 !== "meusite.com.br" || norm3 !== "meusite.com.br") {
    throw new Error("Falha na normalização de domínio");
  }

  // 3. Testar Antifraude com 3 tentativas em contas distintas
  const testDomain = `test-antifraud-${Date.now()}.com.br`;
  console.log(`\nTestando regra de 3 contas no domínio: ${testDomain}`);

  // Tentativa 1 (Conta A) -> ALLOWED
  const res1 = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: `https://${testDomain}`,
    workspaceId: "test-workspace-account-1",
    userEmail: "user1@teste.com",
    sourceContext: "WORDPRESS_SITE",
  });
  console.log("Tentativa 1 (Conta 1):", res1);
  if (!res1.allowed || res1.attemptNumber !== 1) {
    throw new Error("Tentativa 1 deveria ser ALLOWED");
  }

  // Tentativa 1 repetida pela MESMA Conta A -> ALLOWED (mesma conta não conta como nova)
  const res1Repeat = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: `https://${testDomain}/wp-admin`,
    workspaceId: "test-workspace-account-1",
    userEmail: "user1@teste.com",
    sourceContext: "WORDPRESS_SITE",
  });
  console.log("Tentativa repetida (Conta 1):", res1Repeat);
  if (!res1Repeat.allowed) {
    throw new Error("Tentativa repetida da mesma conta deveria ser ALLOWED");
  }

  // Tentativa 2 (Conta B) -> ALLOWED
  const res2 = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: `http://www.${testDomain}`,
    workspaceId: "test-workspace-account-2",
    userEmail: "user2@teste.com",
    sourceContext: "WORDPRESS_SITE",
  });
  console.log("Tentativa 2 (Conta 2):", res2);
  if (!res2.allowed || res2.attemptNumber !== 2) {
    throw new Error("Tentativa 2 deveria ser ALLOWED");
  }

  // Tentativa 3 (Conta C) -> BLOQUEADO!
  const res3 = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: `https://${testDomain}`,
    workspaceId: "test-workspace-account-3",
    userEmail: "user3@teste.com",
    sourceContext: "WORDPRESS_SITE",
  });
  console.log("Tentativa 3 (Conta 3 - Bloqueio):", res3);
  if (res3.allowed !== false || res3.attemptNumber !== 3 || !res3.blockedMessage?.includes("Suporte")) {
    throw new Error("Tentativa 3 deveria ser BLOQUEADA com mensagem de suporte");
  }

  // Verificar se o log de erro foi gravado no SystemErrorLog
  const errorLog = await prisma.systemErrorLog.findFirst({
    where: {
      errorMessage: { contains: testDomain },
      statusCode: 403,
    },
    orderBy: { createdAt: "desc" },
  });
  console.log("SystemErrorLog registrado:", errorLog?.errorMessage);
  if (!errorLog) {
    throw new Error("SystemErrorLog não foi gravado para o bloqueio da 3ª conta!");
  }

  // 4. Testar PlanHistoryService
  console.log("\n4. Testando PlanHistoryService...");
  // Vamos buscar um workspace existente para testar o registro de histórico de planos
  const ws = await prisma.workspace.findFirst();
  if (ws) {
    await PlanHistoryService.recordPlanEvent({
      workspaceId: ws.id,
      newPlanId: "test-plan",
      newPlanName: "Plano Teste",
      eventType: "ACCOUNT_CREATED",
      originalAmount: 89.9,
      chargedAmount: 19.9,
      couponCode: "INFLUENCER19",
      notes: "Teste de gravação de histórico de planos",
    });

    const history = await PlanHistoryService.getWorkspacePlanHistory(ws.id, 5);
    console.log("Histórico gravado:", history.length > 0 ? "OK" : "Vazio");
  }

  // Limpeza de teste
  await prisma.siteRegistrationHistory.deleteMany({
    where: { normalizedDomain: testDomain },
  });
  await prisma.systemErrorLog.deleteMany({
    where: { errorMessage: { contains: testDomain } },
  });

  console.log("\n✅ TODOS OS TESTES DA TASK 290 PASSARAM COM SUCESSO!");
}

main()
  .catch((err) => {
    console.error("❌ Erro no teste:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

