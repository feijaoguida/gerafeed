import { prisma } from "../../src/lib/prisma";
import { CouponService } from "../../src/lib/coupons";
import { PlanHistoryService } from "../../src/lib/plan-history";
import { BillingService } from "../../src/lib/billing";
import { SiteAntifraudService } from "../../src/lib/site-antifraud";
import { getPaymentGateway } from "../../src/lib/payments";

async function runPhase39E2ETests() {
  console.log("================================================================================");
  console.log("      SUÍTE DE TESTES E2E — PHASE 39: CUPONS, CICLOS ASAAS & ANTI-FRAUDE       ");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const testIds: {
    workspaces: string[];
    coupons: string[];
    sites: string[];
  } = {
    workspaces: [],
    coupons: [],
    sites: [],
  };

  try {
    // -------------------------------------------------------------------------
    // CENÁRIO 1: Cadastro de Cupons no Backoffice
    // -------------------------------------------------------------------------
    console.log("--------------------------------------------------------------------------------");
    console.log("CENÁRIO 1: Cadastro de Cupons no Backoffice (Múltiplos Planos, Tipos e Prazos)");
    console.log("--------------------------------------------------------------------------------");

    // 1.1 Localizar plano para o teste (ex: influencer ou pro)
    let influencerPlan = await prisma.plan.findFirst({
      where: { slug: "influencer" },
    });

    if (!influencerPlan) {
      influencerPlan = await prisma.plan.create({
        data: {
          name: "Plano Influencer",
          slug: "influencer",
          price: 89.90,
          monthlyPrice: CouponService.toDecimal(89.90),
          periodicity: "MONTHLY",
          active: true,
        },
      });
    }

    let proPlan = await prisma.plan.findFirst({
      where: { slug: "pro" },
    });

    if (!proPlan) {
      proPlan = await prisma.plan.create({
        data: {
          name: "Plano Pro",
          slug: "pro",
          price: 149.90,
          monthlyPrice: CouponService.toDecimal(149.90),
          periodicity: "MONTHLY",
          active: true,
        },
      });
    }

    console.log(`Planos para teste: ${influencerPlan.name} (R$ ${Number(influencerPlan.monthlyPrice)}) e ${proPlan.name} (R$ ${Number(proPlan.monthlyPrice)})`);

    // 1.2 Cupom Influencer 3 meses por R$ 19,90 (Cliente Novo)
    const infCouponCode = `INFLUENCER19_${timestamp}`;
    const infCoupon = await prisma.coupon.create({
      data: {
        code: infCouponCode,
        name: "Promo Influencer 3 Meses",
        description: "R$ 19,90 nos primeiros 3 meses",
        discountType: "FIXED_PRICE",
        discountValue: CouponService.toDecimal(19.90),
        durationMonths: 3,
        customerType: "NEW",
        active: true,
        plans: {
          create: [{ planId: influencerPlan.id }],
        },
      },
    });
    testIds.coupons.push(infCoupon.id);
    console.log(`[C1.1] Cupom criado: ${infCoupon.code} (FIXED_PRICE R$ 19.90 por 3 meses, NEW)`);

    // 1.3 Cupom Base 50% Vitalício para Múltiplos Planos
    const baseCouponCode = `BASE50FOREVER_${timestamp}`;
    const baseCoupon = await prisma.coupon.create({
      data: {
        code: baseCouponCode,
        name: "Desconto Base 50% Vitalício",
        description: "50% de desconto para sempre em Influencer e Pro",
        discountType: "PERCENTAGE",
        discountValue: CouponService.toDecimal(50.00),
        durationMonths: 0, // Para sempre
        customerType: "BASE",
        active: true,
        plans: {
          create: [
            { planId: influencerPlan.id },
            { planId: proPlan.id },
          ],
        },
      },
    });
    testIds.coupons.push(baseCoupon.id);
    console.log(`[C1.2] Cupom multi-plano criado: ${baseCoupon.code} (PERCENTAGE 50% Vitalício, BASE)`);

    // -------------------------------------------------------------------------
    // CENÁRIO 2: Validação no Cadastro & Auditoria de Logs de Erro
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("CENÁRIO 2: Validação de Cupom na Criação da Conta e Logs de Erro (SystemErrorLog)");
    console.log("--------------------------------------------------------------------------------");

    // 2.1 Validação válida para Cliente Novo
    const valNewOk = await CouponService.validateCouponForTarget({
      code: infCouponCode,
      planId: influencerPlan.id,
      planSlug: influencerPlan.slug,
      customerTypeContext: "NEW",
      reqPath: "/api/billing/coupons/validate",
    });

    if (!valNewOk.valid || !valNewOk.pricing) {
      throw new Error(`Validação de cupom novo deveria ser válida: ${valNewOk.valid ? "" : valNewOk.error}`);
    }

    console.log(`[C2.1] Validação Cliente Novo: Original R$ ${valNewOk.pricing.originalAmount.toNumber()} -> Promocional R$ ${valNewOk.pricing.discountedAmount.toNumber()} (${valNewOk.durationLabel})`);

    // 2.2 Rejeição: Cliente Novo tentando usar cupom exclusivo de Cliente Base
    const errorLogBefore = await prisma.systemErrorLog.count({
      where: { module: "BILLING" },
    });

    const valBaseRejected = await CouponService.validateCouponForTarget({
      code: baseCouponCode,
      planId: influencerPlan.id,
      planSlug: influencerPlan.slug,
      customerTypeContext: "NEW",
      reqPath: "/api/billing/coupons/validate",
    });

    if (valBaseRejected.valid) {
      throw new Error("Cliente Novo NÃO pode usar cupom BASE!");
    }

    const errorLogAfter = await prisma.systemErrorLog.count({
      where: { module: "BILLING" },
    });

    console.log(`[C2.2] Cupom BASE rejeitado com sucesso para Cliente Novo: "${valBaseRejected.error}"`);
    console.log(`[C2.2] Log de erro gravado em SystemErrorLog: ${errorLogAfter > errorLogBefore ? "SIM (PASS)" : "FALHA"}`);

    if (errorLogAfter <= errorLogBefore) {
      throw new Error("Tentativa inválida de cupom deveria ter gerado registro em SystemErrorLog!");
    }

    // -------------------------------------------------------------------------
    // CENÁRIO 3: Contratação no Asaas e Ciclo Promocional Automático (3x 19,90 -> 89,90)
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("CENÁRIO 3: Contratação no Asaas e Ciclo Promocional Automático (3x R$ 19,90 -> R$ 89,90)");
    console.log("--------------------------------------------------------------------------------");

    const ws3 = await prisma.workspace.create({
      data: {
        name: `Workspace Cenário 3 ${timestamp}`,
        slug: `ws3-${timestamp}`,
      },
    });
    testIds.workspaces.push(ws3.id);

    const asaasSubId3 = `sub_mock_3_${timestamp}`;
    const sub3 = await prisma.subscription.create({
      data: {
        workspaceId: ws3.id,
        planId: influencerPlan.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        billingMethod: "CREDIT_CARD",
        amount: CouponService.toDecimal(19.90),
        originalPlanAmount: CouponService.toDecimal(89.90),
        discountedAmount: CouponService.toDecimal(19.90),
        discountDurationMonths: 3,
        discountCyclesUsed: 0,
        couponId: infCoupon.id,
        asaasSubscriptionId: asaasSubId3,
        providerSubscriptionId: asaasSubId3,
      },
    });

    const redemption3 = await prisma.couponRedemption.create({
      data: {
        couponId: infCoupon.id,
        workspaceId: ws3.id,
        planId: influencerPlan.id,
        originalAmount: CouponService.toDecimal(89.90),
        discountedAmount: CouponService.toDecimal(19.90),
        durationMonths: 3,
        cyclesUsed: 0,
        status: "ACTIVE",
      },
    });

    console.log(`[C3.1] Assinatura criada no Asaas com preço promocional: R$ ${Number(sub3.amount).toFixed(2)} (Original R$ 89.90)`);

    // Ciclo 1
    await prisma.invoice.create({
      data: {
        workspaceId: ws3.id,
        subscriptionId: sub3.id,
        provider: "asaas",
        providerPaymentId: `pay_c3_1_${timestamp}`,
        amount: CouponService.toDecimal(19.90),
        billingMethod: "CREDIT_CARD",
        status: "CONFIRMED",
      },
    });
    const c1Result = await BillingService.evaluateSubscriptionDiscountLifecycle(sub3.id, { eventType: "PAYMENT_CONFIRMED" });
    console.log(`[C3.2] Fatura 1 paga -> Ciclos usados: ${c1Result.cyclesUsed}/3 | Restaurou preço? ${c1Result.transitionedToOriginalPrice}`);
    if (c1Result.transitionedToOriginalPrice) throw new Error("Preço não deveria ser restaurado no ciclo 1!");

    // Ciclo 2
    await prisma.invoice.create({
      data: {
        workspaceId: ws3.id,
        subscriptionId: sub3.id,
        provider: "asaas",
        providerPaymentId: `pay_c3_2_${timestamp}`,
        amount: CouponService.toDecimal(19.90),
        billingMethod: "CREDIT_CARD",
        status: "CONFIRMED",
      },
    });
    const c2Result = await BillingService.evaluateSubscriptionDiscountLifecycle(sub3.id, { eventType: "PAYMENT_CONFIRMED" });
    console.log(`[C3.3] Fatura 2 paga -> Ciclos usados: ${c2Result.cyclesUsed}/3 | Restaurou preço? ${c2Result.transitionedToOriginalPrice}`);
    if (c2Result.transitionedToOriginalPrice) throw new Error("Preço não deveria ser restaurado no ciclo 2!");

    // Ciclo 3 (Último ciclo promocional)
    await prisma.invoice.create({
      data: {
        workspaceId: ws3.id,
        subscriptionId: sub3.id,
        provider: "asaas",
        providerPaymentId: `pay_c3_3_${timestamp}`,
        amount: CouponService.toDecimal(19.90),
        billingMethod: "CREDIT_CARD",
        status: "CONFIRMED",
      },
    });
    const c3Result = await BillingService.evaluateSubscriptionDiscountLifecycle(sub3.id, { eventType: "PAYMENT_CONFIRMED" });
    console.log(`[C3.4] Fatura 3 paga -> Ciclos usados: ${c3Result.cyclesUsed}/3 | Transição executada? ${c3Result.transitionedToOriginalPrice}`);

    if (!c3Result.transitionedToOriginalPrice) {
      throw new Error("Após a 3ª fatura o sistema deveria ter transitado automaticamente para o preço original de R$ 89,90!");
    }

    // Verificar se Subscription foi atualizada para R$ 89,90
    const sub3Updated = await prisma.subscription.findUnique({ where: { id: sub3.id } });
    console.log(`[C3.5] Valor na Subscription no DB agora: R$ ${Number(sub3Updated?.amount).toFixed(2)} (Esperado: 89.90)`);
    if (Number(sub3Updated?.amount) !== 89.90) {
      throw new Error(`Valor da assinatura após transição incorreto. Esperado 89.90, obteve ${sub3Updated?.amount}`);
    }

    // Verificar se CouponRedemption foi marcada como COMPLETED
    const redemption3Updated = await prisma.couponRedemption.findUnique({ where: { id: redemption3.id } });
    console.log(`[C3.6] Status da redenção do cupom: ${redemption3Updated?.status} (Esperado: COMPLETED)`);
    if (redemption3Updated?.status !== "COMPLETED") {
      throw new Error(`Status de CouponRedemption deveria ser COMPLETED, obteve ${redemption3Updated?.status}`);
    }

    // Verificar histórico DISCOUNT_ENDED
    const discountEndedHistory = await prisma.planHistory.findFirst({
      where: {
        workspaceId: ws3.id,
        eventType: "DISCOUNT_ENDED",
      },
    });
    console.log(`[C3.7] Registro DISCOUNT_ENDED em PlanHistory: ${discountEndedHistory ? "SIM (PASS)" : "NÃO (FALHA)"}`);
    if (!discountEndedHistory) {
      throw new Error("Evento DISCOUNT_ENDED não encontrado em PlanHistory!");
    }

    // -------------------------------------------------------------------------
    // CENÁRIO 4: Aplicação de Cupom em Plano & Cobrança (Cliente Base)
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("CENÁRIO 4: Aplicação de Cupom em Plano & Cobrança para Cliente Base");
    console.log("--------------------------------------------------------------------------------");

    const ws4 = await prisma.workspace.create({
      data: {
        name: `Workspace Cenário 4 ${timestamp}`,
        slug: `ws4-${timestamp}`,
      },
    });
    testIds.workspaces.push(ws4.id);

    const asaasSubId4 = `sub_mock_4_${timestamp}`;
    const sub4 = await prisma.subscription.create({
      data: {
        workspaceId: ws4.id,
        planId: proPlan.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        billingMethod: "CREDIT_CARD",
        amount: CouponService.toDecimal(149.90),
        asaasSubscriptionId: asaasSubId4,
        providerSubscriptionId: asaasSubId4,
      },
    });

    // Validar e aplicar cupom BASE50FOREVER (50% de 149.90 = 74.95)
    const base4Val = await CouponService.validateCouponForTarget({
      code: baseCouponCode,
      planId: proPlan.id,
      planSlug: proPlan.slug,
      customerTypeContext: "BASE",
      reqPath: "/api/billing/coupons/apply",
    });

    if (!base4Val.valid || !base4Val.pricing) {
      throw new Error("Cupom BASE50FOREVER deveria ser aceito para Cliente Base no Plano Pro!");
    }

    const discountedPrice4 = base4Val.pricing.discountedAmount.toNumber();
    console.log(`[C4.1] Desconto de 50% calculado no Plano Pro: De R$ 149.90 por R$ ${discountedPrice4.toFixed(2)}`);

    // Atualizar no Asaas com updatePendingPayments: true
    const gateway = getPaymentGateway();
    const updateResult4 = await gateway.updateSubscription({
      subscriptionId: asaasSubId4,
      value: discountedPrice4,
      updatePendingPayments: true,
      description: `Cupom ${baseCoupon.code} aplicado na assinatura Pro`,
    });

    if (!updateResult4.updated) {
      throw new Error("Gateway updateSubscription falhou ao aplicar cupom base!");
    }

    await prisma.subscription.update({
      where: { id: sub4.id },
      data: {
        couponId: baseCoupon.id,
        amount: discountedPrice4,
        originalPlanAmount: 149.90,
        discountedAmount: discountedPrice4,
        discountDurationMonths: 0,
        discountCyclesUsed: 0,
      },
    });

    await PlanHistoryService.recordEvent({
      workspaceId: ws4.id,
      newPlanId: proPlan.id,
      newPlanName: proPlan.name,
      eventType: "COUPON_APPLIED",
      billingCycle: "MONTHLY",
      originalAmount: 149.90,
      chargedAmount: discountedPrice4,
      couponId: baseCoupon.id,
      couponCode: baseCoupon.code,
      discountDurationMonths: 0,
      asaasSubscriptionId: asaasSubId4,
      notes: `Cupom 50% vitalício aplicado pelo cliente base`,
    });

    const timeline4 = await prisma.planHistory.findMany({
      where: { workspaceId: ws4.id },
    });
    console.log(`[C4.2] Evento COUPON_APPLIED gravado no histórico: ${timeline4.length} evento(s)`);
    if (timeline4.length === 0) throw new Error("Histórico de planos vazio para Workspace 4!");

    // -------------------------------------------------------------------------
    // CENÁRIO 5: Histórico e Trava Anti-Fraude de Cadastro de Sites
    // -------------------------------------------------------------------------
    console.log("\n--------------------------------------------------------------------------------");
    console.log("CENÁRIO 5: Histórico e Trava Anti-Fraude de Sites (1ª e 2ª OK, 3ª Bloqueada + Suporte)");
    console.log("--------------------------------------------------------------------------------");

    const fraudTargetDomain = `fraudedominio-${timestamp}.com.br`;
    console.log(`Domínio sob teste de fraude: ${fraudTargetDomain}`);

    // Criação de 3 Workspaces distintos
    const wsFraud1 = await prisma.workspace.create({
      data: { name: `Conta 1 Fraude ${timestamp}`, slug: `wsf1-${timestamp}` },
    });
    const wsFraud2 = await prisma.workspace.create({
      data: { name: `Conta 2 Fraude ${timestamp}`, slug: `wsf2-${timestamp}` },
    });
    const wsFraud3 = await prisma.workspace.create({
      data: { name: `Conta 3 Fraude ${timestamp}`, slug: `wsf3-${timestamp}` },
    });
    testIds.workspaces.push(wsFraud1.id, wsFraud2.id, wsFraud3.id);

    // Tentativa 1: Workspace 1 cadastra com https://www.
    console.log("\n[C5.1] Conta 1 cadastrando https://www." + fraudTargetDomain + "...");
    const check1 = await SiteAntifraudService.validateAndRecordSiteRegistration({
      rawUrl: `https://www.${fraudTargetDomain}`,
      workspaceId: wsFraud1.id,
      userEmail: "conta1@teste.com",
      sourceContext: "WORDPRESS_SITE",
      reqPath: "/api/wordpress/sites",
    });

    console.log(`       Resultado: allowed = ${check1.allowed}, tentativa #${check1.attemptNumber}`);
    if (!check1.allowed || check1.attemptNumber !== 1) {
      throw new Error(`Tentativa 1 deveria ter sido permitida. Allowed: ${check1.allowed}, tentativa: ${check1.attemptNumber}`);
    }

    // Cria WordPressSite vinculado e depois exclui simulando cancelamento
    const wpSite1 = await prisma.wordPressSite.create({
      data: {
        workspaceId: wsFraud1.id,
        name: "Site da Conta 1",
        url: `https://www.${fraudTargetDomain}`,
        username: "admin",
        encryptedApplicationPassword: "mock-encrypted-pw",
      },
    });
    testIds.sites.push(wpSite1.id);

    // Conta 1 exclui o site
    console.log("       Conta 1 excluindo o destino WordPress...");
    await prisma.wordPressSite.delete({ where: { id: wpSite1.id } });

    // Verifica que o histórico perpétuo permaneceu intacto
    const histAfterDel = await prisma.siteRegistrationHistory.count({
      where: { normalizedDomain: fraudTargetDomain },
    });
    console.log(`       Histórico perpétuo após deleção do WordPressSite: ${histAfterDel} registro(s) presente(s)`);
    if (histAfterDel === 0) {
      throw new Error("Histórico de registro de site não pode ser apagado após exclusão do WordPressSite!");
    }

    // Tentativa 2: Workspace 2 cadastra com http:// sem www e com path
    console.log("\n[C5.2] Conta 2 cadastrando http://" + fraudTargetDomain + "/wp-json...");
    const check2 = await SiteAntifraudService.validateAndRecordSiteRegistration({
      rawUrl: `http://${fraudTargetDomain}/wp-json`,
      workspaceId: wsFraud2.id,
      userEmail: "conta2@teste.com",
      sourceContext: "WORDPRESS_SITE",
      reqPath: "/api/wordpress/sites",
    });

    console.log(`       Resultado: allowed = ${check2.allowed}, tentativa #${check2.attemptNumber}`);
    if (!check2.allowed || check2.attemptNumber !== 2) {
      throw new Error(`Tentativa 2 deveria ter sido permitida. Allowed: ${check2.allowed}, tentativa: ${check2.attemptNumber}`);
    }

    // Tentativa 3: Workspace 3 tenta cadastrar o mesmo domínio -> DEVE SER BLOQUEADO!
    console.log("\n[C5.3] Conta 3 tentando cadastrar https://" + fraudTargetDomain + "/ (3ª CONTA)...");
    const fraudErrorCountBefore = await prisma.systemErrorLog.count({
      where: { module: "WORDPRESS" },
    });

    const check3 = await SiteAntifraudService.validateAndRecordSiteRegistration({
      rawUrl: `https://${fraudTargetDomain}/`,
      workspaceId: wsFraud3.id,
      userEmail: "conta3@teste.com",
      sourceContext: "WORDPRESS_SITE",
      reqPath: "/api/wordpress/sites",
    });

    const fraudErrorCountAfter = await prisma.systemErrorLog.count({
      where: { module: "WORDPRESS" },
    });

    console.log(`       Resultado: allowed = ${check3.allowed}, tentativa #${check3.attemptNumber}`);
    console.log(`       Mensagem exibida: "${check3.blockedMessage}"`);
    console.log(`       Log gravado em SystemErrorLog: ${fraudErrorCountAfter > fraudErrorCountBefore ? "SIM (PASS)" : "FALHA"}`);

    if (check3.allowed) {
      throw new Error("Tentativa 3 de cadastrar o mesmo site em 3ª conta DEVERIA TER SIDO BLOQUEADA!");
    }

    if (!check3.blockedMessage?.includes("suporte") && !check3.blockedMessage?.includes("Suporte")) {
      throw new Error("Mensagem de bloqueio da 3ª tentativa deve instruir o usuário a procurar o suporte!");
    }

    if (fraudErrorCountAfter <= fraudErrorCountBefore) {
      throw new Error("Bloqueio de antifraude na 3ª tentativa deveria ter gerado registro em SystemErrorLog!");
    }

    // 5.4 Teste de Liberação de Suporte pelo SuperAdmin
    console.log("\n[C5.4] SuperAdmin liberando o domínio para a Conta 3 via clearDomainForWorkspace...");
    const unlocked = await SiteAntifraudService.clearDomainForWorkspace({
      rawUrl: fraudTargetDomain,
      workspaceId: wsFraud3.id,
      reason: "Propriedade legítima comprovada pelo suporte técnico",
    });

    if (!unlocked.success) {
      throw new Error("Falha ao desbloquear domínio");
    }

    // Agora Conta 3 tenta novamente e deve ser permitida
    const checkAfterUnlock = await SiteAntifraudService.validateAndRecordSiteRegistration({
      rawUrl: `https://${fraudTargetDomain}`,
      workspaceId: wsFraud3.id,
      userEmail: "conta3@teste.com",
      sourceContext: "WORDPRESS_SITE",
      reqPath: "/api/wordpress/sites",
    });

    console.log(`       Resultado após liberação pelo suporte: allowed = ${checkAfterUnlock.allowed} (PASS)`);
    if (!checkAfterUnlock.allowed) {
      throw new Error("Cadastro deveria ser permitido após liberação pelo suporte técnico!");
    }

    console.log("\n================================================================================");
    console.log("   TODOS OS 5 CENÁRIOS DA PHASE 39 FORAM VALIDADOS COM 100% DE SUCESSO!        ");
    console.log("================================================================================\n");
  } finally {
    // Cleanup limpo
    console.log("Executando limpeza dos dados de teste...");
    try {
      if (testIds.sites.length > 0) {
        await prisma.wordPressSite.deleteMany({ where: { id: { in: testIds.sites } } });
      }
      if (testIds.workspaces.length > 0) {
        await prisma.invoice.deleteMany({ where: { workspaceId: { in: testIds.workspaces } } });
        await prisma.planHistory.deleteMany({ where: { workspaceId: { in: testIds.workspaces } } });
        await prisma.couponRedemption.deleteMany({ where: { workspaceId: { in: testIds.workspaces } } });
        await prisma.siteRegistrationHistory.deleteMany({ where: { workspaceId: { in: testIds.workspaces } } });
        await prisma.subscription.deleteMany({ where: { workspaceId: { in: testIds.workspaces } } });
        await prisma.workspace.deleteMany({ where: { id: { in: testIds.workspaces } } });
      }
      if (testIds.coupons.length > 0) {
        await prisma.couponPlan.deleteMany({ where: { couponId: { in: testIds.coupons } } });
        await prisma.coupon.deleteMany({ where: { id: { in: testIds.coupons } } });
      }
      console.log("Limpeza concluída com sucesso.");
    } catch (cleanupErr) {
      console.warn("Aviso durante limpeza:", cleanupErr);
    }
  }
}

runPhase39E2ETests().catch((err) => {
  console.error("FALHA CRÍTICA NA SUÍTE DE TESTES E2E DA PHASE 39:", err);
  process.exit(1);
});
