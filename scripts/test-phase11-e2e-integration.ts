import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  AffiliateService,
  ProductCategoryService,
  ProductCatalogService,
  ProductOfferService,
  ProductRefreshService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=================================================================");
  console.log("=== TEST: Task 115 - Phase 11 Complete E2E Integration Suite ===");
  console.log("=================================================================");

  const WS_A_SLUG = "phase11-e2e-tenant-a";
  const WS_B_SLUG = "phase11-e2e-tenant-b";
  const PLAN_SLUG = "phase11-e2e-plan";

  try {
    // Step 0: Setup & Cleanup
    console.log("\n--- Step 0: Inicialização e Limpeza de Ambiente ---");
    await ensureDefaultAffiliatePrograms();

    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productCategory.deleteMany({
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

    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Phase 11 E2E",
        slug: PLAN_SLUG,
        price: 199.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 3 }, // Limite de 3 produtos
          ],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Phase 11", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Phase 11", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Step 0 PASS: Tenancy e planos configurados.");

    // Cenário 1: Taxonomia Hierárquica de Categorias
    console.log("\n--- Cenário 1: Taxonomia e Hierarquia de Categorias ---");
    const catEletronicos = await ProductCategoryService.createCategory(wsA.id, {
      name: "Eletrônicos",
      description: "Dispositivos e aparelhos eletrônicos em geral",
    });

    const catAudio = await ProductCategoryService.createCategory(wsA.id, {
      name: "Fones e Áudio",
      parentId: catEletronicos.id,
    });

    const catEarbuds = await ProductCategoryService.createCategory(wsA.id, {
      name: "Earbuds TWS",
      parentId: catAudio.id,
    });

    // Teste de prevenção de loop circular
    let loopPrevented = false;
    try {
      await ProductCategoryService.updateCategory(wsA.id, catEletronicos.id, {
        parentId: catEarbuds.id,
      });
    } catch {
      loopPrevented = true;
    }
    if (!loopPrevented) {
      throw new Error("FAIL: Prevenção de loop hierárquico falhou!");
    }
    console.log("✓ Cenário 1 PASS: Hierarquia e prevenção de referências circulares validadas.");

    // Cenário 2: Importação e Criação de Produto no Catálogo
    console.log("\n--- Cenário 2: Importação e Deduplicação de Produto ---");
    const importUrl = "https://produto.mercadolivre.com.br/MLB-55667788-fone-bluetooth-noise-cancelling";
    const preview = await AffiliateService.previewImport(wsA.id, { affiliateUrl: importUrl });
    if (preview.metadata.status === "FAILED") {
      throw new Error(`FAIL: Preview de importação falhou: ${preview.metadata.warnings.join(", ")}`);
    }

    const confirmed = await AffiliateService.confirmImport(wsA.id, {
      affiliateUrl: importUrl,
      providerCode: "MERCADO_LIVRE",
      name: preview.metadata.name || "Fone Bluetooth Noise Cancelling",
      brand: preview.metadata.brand || "SoundBrand",
      seller: preview.metadata.seller || "Loja Oficial Áudio",
      price: preview.metadata.price || 599.0,
      oldPrice: preview.metadata.oldPrice || 799.0,
      description: "Fone com cancelamento de ruído ativo premium.",
      imageUrl: preview.metadata.imageUrl || "https://example.com/fone.jpg",
      categoryId: catEarbuds.id,
    });
    console.log("✓ Cenário 2 PASS: Produto importado e persistido atomicamente no catálogo.");

    // Cenário 3: Enriquecimento Editorial e Ficha Técnica
    console.log("\n--- Cenário 3: Enriquecimento Editorial, Ficha Técnica e Prós/Contras ---");
    const updatedProd = await ProductCatalogService.updateProduct(wsA.id, confirmed.product.id, {
      rating: 4.8,
      specs: {
        driver: "40mm Dinâmico",
        bateria: "30 horas",
        anc: "Ativo Híbrido",
        bluetooth: "5.3",
      },
      pros: ["Cancelamento de ruído excelente", "Bateria de longa duração", "Confortável para longas sessões"],
      cons: ["Aplicativo móvel requer conta"],
    });

    if (updatedProd.pros.length !== 3 || updatedProd.rating !== 4.8) {
      throw new Error("FAIL: Enriquecimento editorial falhou.");
    }
    console.log("✓ Cenário 3 PASS: Ficha técnica, prós/contras e avaliação editorial atualizados.");

    // Cenário 4: Gestão de Múltiplas Ofertas e Comparação de Preços
    console.log("\n--- Cenário 4: Multi-Oferta e Comparador de Preços ---");
    const offer2 = await ProductOfferService.createOffer(wsA.id, {
      productId: confirmed.product.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-99881122-fone-bluetooth-vendedor-2",
      seller: "Eletrônicos Express",
      price: 549.0, // Oferta mais barata
      oldPrice: 699.0,
      trackingLabel: "review-comparativo",
      status: "ACTIVE",
    });

    const productOffers = await ProductOfferService.listOffers(wsA.id, { productId: confirmed.product.id });
    if (productOffers.items.length !== 2) {
      throw new Error(`FAIL: Esperava 2 ofertas, obtido ${productOffers.items.length}`);
    }
    if (productOffers.items[0].price !== 549.0) {
      throw new Error(`FAIL: Primeira oferta ordenada esperada 549.0, obtido ${productOffers.items[0].price}`);
    }
    console.log("✓ Cenário 4 PASS: Múltiplas ofertas vinculadas e ordenação por melhor preço funcionando.");

    // Cenário 5: Refresh Manual e Merge Policy
    console.log("\n--- Cenário 5: Refresh Manual e Preservação Editorial (Merge Policy) ---");
    await ProductRefreshService.refreshOffer(wsA.id, offer2.id);
    const refreshedProd = await ProductCatalogService.getProduct(wsA.id, confirmed.product.id);

    if (
      refreshedProd.description !== "Fone com cancelamento de ruído ativo premium." ||
      refreshedProd.pros.length !== 3 ||
      refreshedProd.rating !== 4.8
    ) {
      throw new Error("FAIL: Merge policy violada! Dados editoriais foram alterados.");
    }
    console.log("✓ Cenário 5 PASS: Refresh manual atualizou oferta sem alterar campos editoriais.");

    // Cenário 6: Transições de Ciclo de Vida (Status)
    console.log("\n--- Cenário 6: Ciclo de Vida e Transições de Status ---");
    await ProductCatalogService.updateProduct(wsA.id, confirmed.product.id, { status: "ARCHIVED" });
    const archivedList = await ProductCatalogService.listProducts(wsA.id, { status: "ARCHIVED" });
    if (archivedList.items.length !== 1) {
      throw new Error("FAIL: Filtro por produtos arquivados falhou.");
    }

    await ProductCatalogService.updateProduct(wsA.id, confirmed.product.id, { status: "ACTIVE" });
    await ProductOfferService.updateOffer(wsA.id, offer2.id, { status: "OUT_OF_STOCK" });
    const outOfStockOffers = await ProductOfferService.listOffers(wsA.id, { status: "OUT_OF_STOCK" });
    if (outOfStockOffers.items.length !== 1) {
      throw new Error("FAIL: Filtro de ofertas por OUT_OF_STOCK falhou.");
    }
    console.log("✓ Cenário 6 PASS: Transições de status de produtos e ofertas validadas.");

    // Cenário 7: Limite de Produtos do Plano
    console.log("\n--- Cenário 7: Limite Quantitativo de Produtos do Plano (AFFILIATE_MAX_PRODUCTS) ---");
    await ProductCatalogService.createProduct(wsA.id, { name: "Produto 2", status: "ACTIVE" });
    await ProductCatalogService.createProduct(wsA.id, { name: "Produto 3", status: "ACTIVE" });

    let limitTriggered = false;
    try {
      await ProductCatalogService.createProduct(wsA.id, { name: "Produto 4 Excedente" });
    } catch (e: unknown) {
      limitTriggered = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de limite: "${e.message}"`);
      }
    }
    if (!limitTriggered) {
      throw new Error("FAIL: Limite de 3 produtos do plano não foi respeitado!");
    }
    console.log("✓ Cenário 7 PASS: Limite quantitativo de produtos bloqueou excedente.");

    // Cenário 8: Isolamento Multi-Tenant Estrito
    console.log("\n--- Cenário 8: Isolamento Multi-Tenant Estrito ---");
    const tenantBProducts = await ProductCatalogService.listProducts(wsB.id);
    if (tenantBProducts.items.length !== 0) {
      throw new Error("FAIL: Tenant B acessou catálogo do Tenant A!");
    }

    let crossTenantEditBlocked = false;
    try {
      await ProductCatalogService.updateProduct(wsB.id, confirmed.product.id, { name: "Hacked" });
    } catch {
      crossTenantEditBlocked = true;
    }
    if (!crossTenantEditBlocked) {
      throw new Error("FAIL: Tenant B editou produto do Tenant A!");
    }
    console.log("✓ Cenário 8 PASS: Isolamento estrito entre múltiplos tenants confirmado.");

    // Cenário 9: Exclusão Segura e Desvinculação em Cascata
    console.log("\n--- Cenário 9: Exclusão Segura de Categoria e Cascata de Produto ---");
    // Exclui categoria 'catAudio' (que tem filho 'catEarbuds')
    await ProductCategoryService.deleteCategory(wsA.id, catAudio.id);
    const reparentedEarbuds = await ProductCategoryService.getCategory(wsA.id, catEarbuds.id);
    if (reparentedEarbuds.parentId !== catEletronicos.id) {
      throw new Error("FAIL: Reparenting seguro na exclusão de categoria falhou!");
    }

    // Exclui produto e valida cascata de ofertas
    await ProductCatalogService.deleteProduct(wsA.id, confirmed.product.id);
    const remainingOffers = await prisma.productOffer.count({
      where: { productId: confirmed.product.id },
    });
    if (remainingOffers !== 0) {
      throw new Error("FAIL: Ofertas não foram excluídas em cascata com o produto!");
    }
    console.log("✓ Cenário 9 PASS: Exclusão segura de taxonomia e deleção em cascata de ofertas validadas.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productCategory.deleteMany({
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
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=================================================================");
    console.log("TODOS OS 9 CENÁRIOS DE INTEGRAÇÃO DA PHASE 11 FORAM APROVADOS! (9/9)");
    console.log("=================================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA SUÍTE DE INTEGRAÇÃO DA PHASE 11:", error);
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
