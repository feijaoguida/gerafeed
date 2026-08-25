import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 112 - Product Offer Management ===");

  const WS_A_SLUG = "test-ws-offer-a";
  const WS_B_SLUG = "test-ws-offer-b";
  const PLAN_SLUG = "test-plan-offer";

  try {
    // 0. Seed programs & Cleanup
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
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    // 1. Setup Plan & Workspaces
    console.log("\n--- Check 1: Setup de Planos e Workspaces ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Ofertas Teste",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 10 },
          ],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Ofertas", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Ofertas", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Check 1 PASS: Workspaces A e B configurados.");

    // 2. Criação de Produto e Adição de Ofertas
    console.log("\n--- Check 2: Criação de Produto e Oferta com Resolução de URL ---");
    const productA = await ProductCatalogService.createProduct(wsA.id, {
      name: "Monitor Gamer Curvo 27 Pol",
      brand: "ViewTech",
      status: "ACTIVE",
    });

    const offerA1 = await ProductOfferService.createOffer(wsA.id, {
      productId: productA.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-334455667-monitor-curvo-27",
      seller: "Loja Oficial ViewTech",
      price: 1299.9,
      oldPrice: 1599.9,
      trackingLabel: "campanha-black-friday",
      status: "ACTIVE",
    });

    if (offerA1.productId !== productA.id || offerA1.price !== 1299.9) {
      throw new Error("FAIL: Oferta criada com dados divergentes.");
    }
    if (offerA1.externalProductId !== "MLB334455667") {
      throw new Error(`FAIL: externalProductId incorreto: ${offerA1.externalProductId}`);
    }
    console.log("✓ Check 2 PASS: Oferta criada e externalProductId extraído pelo provider.");

    // 3. Atualização de Oferta (Mudança de Preço e Status PAUSED/OUT_OF_STOCK)
    console.log("\n--- Check 3: Atualização de Oferta e Status de Estoque ---");
    const updatedOffer = await ProductOfferService.updateOffer(wsA.id, offerA1.id, {
      price: 1199.9,
      status: "PAUSED",
      trackingLabel: "campanha-cyber-monday",
    });

    if (updatedOffer.price !== 1199.9 || updatedOffer.status !== "PAUSED") {
      throw new Error("FAIL: Atualização de preço ou status da oferta falhou.");
    }
    console.log("✓ Check 3 PASS: Oferta atualizada com novo preço e status PAUSED.");

    // 4. Listagem e Filtro de Ofertas
    console.log("\n--- Check 4: Listagem e Filtros de Ofertas por Produto e Status ---");
    // Cria 2ª oferta para o mesmo produto (ex: outro seller ou link)
    await ProductOfferService.createOffer(wsA.id, {
      productId: productA.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-778899001-monitor-curvo-outro-seller",
      seller: "Eletrônicos Express",
      price: 1350.0,
      status: "ACTIVE",
    });

    const allProductOffers = await ProductOfferService.listOffers(wsA.id, { productId: productA.id });
    if (allProductOffers.items.length !== 2) {
      throw new Error(`FAIL: listOffers esperava 2 ofertas, retornou ${allProductOffers.items.length}`);
    }

    const activeOnlyOffers = await ProductOfferService.listOffers(wsA.id, { status: "ACTIVE" });
    if (activeOnlyOffers.items.length !== 1) {
      throw new Error(`FAIL: listOffers por status ACTIVE esperava 1 oferta, retornou ${activeOnlyOffers.items.length}`);
    }
    console.log("✓ Check 4 PASS: Listagem e filtros de ofertas validados.");

    // 5. Isolamento Multi-Tenant
    console.log("\n--- Check 5: Isolamento Multi-Tenant Estrito ---");
    // Tenant B tenta listar ofertas
    const tenantBOffers = await ProductOfferService.listOffers(wsB.id);
    if (tenantBOffers.items.length !== 0) {
      throw new Error("FAIL: Tenant B listou ofertas do Tenant A!");
    }

    // Tenant B tenta atualizar oferta do Tenant A
    let crossTenantUpdateBlocked = false;
    try {
      await ProductOfferService.updateOffer(wsB.id, offerA1.id, { price: 10.0 });
    } catch {
      crossTenantUpdateBlocked = true;
    }
    if (!crossTenantUpdateBlocked) {
      throw new Error("FAIL: Tenant B conseguiu atualizar oferta do Tenant A!");
    }

    // Tenant B tenta vincular oferta a produto do Tenant A
    let crossTenantProductAttachBlocked = false;
    try {
      await ProductOfferService.createOffer(wsB.id, {
        productId: productA.id,
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-111-teste",
      });
    } catch {
      crossTenantProductAttachBlocked = true;
    }
    if (!crossTenantProductAttachBlocked) {
      throw new Error("FAIL: Permitiu vincular oferta a produto de outro workspace!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito de ofertas entre múltiplos tenants confirmado.");

    // 6. Exclusão de Oferta
    console.log("\n--- Check 6: Exclusão de Oferta ---");
    await ProductOfferService.deleteOffer(wsA.id, offerA1.id);
    const countAfterDelete = await prisma.productOffer.count({ where: { workspaceId: wsA.id } });
    if (countAfterDelete !== 1) {
      throw new Error(`FAIL: Contagem esperada 1 após exclusão, obtido ${countAfterDelete}`);
    }
    console.log("✓ Check 6 PASS: Exclusão de oferta realizada com sucesso.");

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
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 112 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 112:", error);
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
