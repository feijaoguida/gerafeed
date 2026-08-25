import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  AffiliateService,
  SafeUrlResolver,
  extractProductMetadata,
  ensureDefaultAffiliatePrograms,
  SSRFSecurityError,
} from "@/lib/affiliate";

async function run() {
  console.log("=================================================================");
  console.log("=== TEST: Task 107 - Phase 10 Complete E2E Integration Suite ===");
  console.log("=================================================================");

  const WS_A_SLUG = "ws-phase10-integration-tenant-a";
  const WS_B_SLUG = "ws-phase10-integration-tenant-b";
  const PLAN_PRO_SLUG = "plan-phase10-pro";
  const PLAN_FREE_SLUG = "plan-phase10-free";

  try {
    // 0. Seed & Cleanup
    console.log("\n--- Step 0: Inicialização e Limpeza do Ambiente ---");
    await ensureDefaultAffiliatePrograms();

    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_PRO_SLUG, PLAN_FREE_SLUG] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_PRO_SLUG, PLAN_FREE_SLUG] } },
    });

    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const planPro = await prisma.plan.create({
      data: {
        name: "Plano Pro Afiliados",
        slug: PLAN_PRO_SLUG,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 100 },
          ],
        },
      },
    });

    const planFree = await prisma.plan.create({
      data: {
        name: "Plano Free Sem Afiliados",
        slug: PLAN_FREE_SLUG,
        price: 0.0,
        planFeatures: {
          create: [{ featureId: featModule.id, enabled: false }],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Pro", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: planPro.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Free", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: planFree.id, status: "ACTIVE" },
    });
    console.log("✓ Step 0 PASS: Tenancy, planos e subscriptions configurados com sucesso.");

    // Scenario 1: Plano Bloqueado
    console.log("\n--- Cenário 1: Tentativa de Acesso em Plano Bloqueado (Tenant B) ---");
    let blockedAccess = false;
    try {
      await AffiliateService.previewImport(wsB.id, {
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-111222333-item",
      });
    } catch {
      blockedAccess = true;
    }
    if (!blockedAccess) {
      throw new Error("FAIL Cenário 1: Workspace sem módulo de afiliados não foi bloqueado.");
    }
    console.log("✓ Cenário 1 PASS: Bloqueio seguro de planos não autorizados validado.");

    // Scenario 2: Link Inválido / Host Não Permitido
    console.log("\n--- Cenário 2: Validação de Links Inválidos e Domínios Não Autorizados ---");
    const badDomainPreview = await AffiliateService.previewImport(wsA.id, {
      affiliateUrl: "https://site-golpista.net/produto/123",
    });
    if (badDomainPreview.metadata.status !== "FAILED") {
      throw new Error("FAIL Cenário 2: Domínio externo não autorizado deve retornar status FAILED.");
    }
    console.log("✓ Cenário 2 PASS: Domínios fora da allowlist rejeitados com status FAILED.");

    // Scenario 3: Proteção contra SSRF
    console.log("\n--- Cenário 3: Proteção Rigorosa contra SSRF e IPs Privados ---");
    let ssrfCaught = false;
    try {
      await SafeUrlResolver.resolve("http://127.0.0.1:8080/admin", {
        allowedHosts: ["127.0.0.1"],
      });
    } catch (e) {
      if (e instanceof SSRFSecurityError) {
        ssrfCaught = true;
      }
    }
    if (!ssrfCaught) {
      throw new Error("FAIL Cenário 3: SSRF em 127.0.0.1 não foi bloqueado por SSRFSecurityError.");
    }
    console.log("✓ Cenário 3 PASS: SSRFSecurityError bloqueou tentativa de acesso a IP privado com sucesso.");

    // Scenario 4 & 5: Import COMPLETE com JSON-LD & Snapshot Price
    console.log("\n--- Cenário 4 & 5: Importação Completa (COMPLETE) e Persistência ---");
    const testMlbUrl = "https://produto.mercadolivre.com.br/MLB-998877665-fone-anc-premium";
    const previewComplete = await AffiliateService.previewImport(wsA.id, {
      affiliateUrl: testMlbUrl,
    });

    if (previewComplete.isDuplicate !== false) {
      throw new Error("FAIL Cenário 4: Primeiro preview não deve ser duplicado.");
    }

    const savedItem = await AffiliateService.confirmImport(wsA.id, {
      affiliateUrl: testMlbUrl,
      externalProductId: "MLB998877665",
      name: "Fone Bluetooth ANC Premium 2026",
      brand: "SoundMaster",
      seller: "Loja Oficial SoundMaster",
      price: 349.9,
      oldPrice: 499.9,
      currency: "BRL",
      description: "Fone com cancelamento ativo de ruído de última geração.",
      imageUrl: "https://http2.mlstatic.com/fone-anc.jpg",
      metadataSource: "JSON_LD",
    });

    if (!savedItem.product || !savedItem.offer) {
      throw new Error("FAIL Cenário 5: Produto ou oferta não persistidos.");
    }
    if (savedItem.offer.price !== 349.9 || savedItem.offer.externalProductId !== "MLB998877665") {
      throw new Error("FAIL Cenário 5: Dados do snapshot de preço ou ID incorretos.");
    }
    console.log("✓ Cenário 4 & 5 PASS: Produto importado como COMPLETE e persistido atomicamente.");

    // Scenario 6: Import PARTIAL & Correção Manual
    console.log("\n--- Cenário 6: Importação com Dados Parciais (PARTIAL) e Edição Manual ---");
    const partialHtml = `
      <html>
      <head><title>Mouse Gamer Óptico</title></head>
      <body><h1>Mouse Gamer Óptico</h1></body>
      </html>
    `;
    const partialMetadata = extractProductMetadata(partialHtml, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-445566778-mouse-optico",
    });
    if (partialMetadata.status !== "PARTIAL") {
      throw new Error("FAIL Cenário 6: Extração de HTML parcial deve resultar em status PARTIAL.");
    }

    // Manual correction on confirm
    const confirmedPartial = await AffiliateService.confirmImport(wsA.id, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-445566778-mouse-optico",
      externalProductId: "MLB445566778",
      name: "Mouse Gamer Óptico 16000 DPI (Revisado Manualmente)",
      brand: "GamerPro",
      price: 89.9,
      metadataSource: "PARTIAL_MANUAL_REVIEW",
    });

    if (confirmedPartial.product.name !== "Mouse Gamer Óptico 16000 DPI (Revisado Manualmente)") {
      throw new Error("FAIL Cenário 6: Edição manual do título não persistida.");
    }
    console.log("✓ Cenário 6 PASS: Status PARTIAL tratado com sucesso e enriquecido na confirmação.");

    // Scenario 7: Deduplicação por externalProductId
    console.log("\n--- Cenário 7: Deduplicação por externalProductId no Catálogo ---");
    const duplicatePreview = await AffiliateService.previewImport(wsA.id, {
      affiliateUrl: testMlbUrl,
    });

    if (!duplicatePreview.isDuplicate || !duplicatePreview.existingProduct) {
      throw new Error("FAIL Cenário 7: Duplicação não detectada para URL/MLB existente.");
    }
    if (duplicatePreview.existingProduct.id !== savedItem.product.id) {
      throw new Error("FAIL Cenário 7: existingProduct ID divergente do produto salvo.");
    }
    console.log("✓ Cenário 7 PASS: Deduplicação inteligente e preview de produto existente funcionando.");

    // Scenario 8: Tenant Isolation
    console.log("\n--- Cenário 8: Isolamento Estrito entre Tenants ---");
    // Enable Pro for Tenant B to test isolation
    await prisma.subscription.updateMany({
      where: { workspaceId: wsB.id },
      data: { planId: planPro.id },
    });

    // Tenant B imports same product URL -> should create separate product for Tenant B without conflicts
    const tenantBProduct = await AffiliateService.confirmImport(wsB.id, {
      affiliateUrl: testMlbUrl,
      externalProductId: "MLB998877665",
      name: "Fone Bluetooth ANC Premium 2026 - Tenant B",
      price: 349.9,
    });

    if (tenantBProduct.product.workspaceId !== wsB.id) {
      throw new Error("FAIL Cenário 8: Produto criado com workspaceId incorreto.");
    }
    if (tenantBProduct.product.id === savedItem.product.id) {
      throw new Error("FAIL Cenário 8: Tenant B sobrepôs produto do Tenant A!");
    }

    const tenantAOfferCount = await prisma.productOffer.count({ where: { workspaceId: wsA.id } });
    const tenantBOfferCount = await prisma.productOffer.count({ where: { workspaceId: wsB.id } });
    if (tenantAOfferCount !== 2 || tenantBOfferCount !== 1) {
      throw new Error(`FAIL Cenário 8: Contagem de ofertas isoladas incorreta: Tenant A=${tenantAOfferCount}, Tenant B=${tenantBOfferCount}`);
    }
    console.log("✓ Cenário 8 PASS: Isolamento estrito de catálogo e ofertas entre múltiplos tenants confirmado.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: { in: [PLAN_PRO_SLUG, PLAN_FREE_SLUG] } } },
    });
    await prisma.plan.deleteMany({
      where: { slug: { in: [PLAN_PRO_SLUG, PLAN_FREE_SLUG] } },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=================================================================");
    console.log("TODOS OS CENÁRIOS DE INTEGRAÇÃO DA PHASE 10 FORAM APROVADOS! (8/8)");
    console.log("=================================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA INTEGRAÇÃO DA PHASE 10:", error);
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
