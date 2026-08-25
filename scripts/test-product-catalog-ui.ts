import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductCategoryService,
  ProductOfferService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 114 - Product Catalog UI Data & Endpoints ===");

  const WS_SLUG = "test-ws-cat-ui";
  const PLAN_SLUG = "test-plan-cat-ui";

  try {
    // 0. Seed programs & Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.productCategory.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    // 1. Setup Plan & Workspace
    console.log("\n--- Check 1: Setup de Workspace e Categorias ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano UI Teste",
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

    const ws = await prisma.workspace.create({
      data: { name: "Tenant Catálogo UI", slug: WS_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: ws.id, planId: plan.id, status: "ACTIVE" },
    });

    const catHardware = await ProductCategoryService.createCategory(ws.id, {
      name: "Hardware & PCs",
    });
    console.log("✓ Check 1 PASS: Workspace e categoria configurados.");

    // 2. Criação de Produto Completo com Especificações e Prós/Contras
    console.log("\n--- Check 2: Criação de Produto Completo para a UI ---");
    const product = await ProductCatalogService.createProduct(ws.id, {
      name: "Placa de Vídeo RTX 4070 12GB",
      brand: "Nvidia",
      description: "Placa gráfica intermediária premium com DLSS 3 e Ray Tracing.",
      imageUrl: "https://example.com/rtx4070.jpg",
      rating: 4.9,
      categoryId: catHardware.id,
      specs: {
        vram: "12GB GDDR6X",
        tdp: "200W",
        interface: "PCIe 4.0 16x",
        outputs: "3x DisplayPort 1.4a, 1x HDMI 2.1a",
      },
      pros: ["Baixo consumo energético", "Desempenho excelente em 1440p", "DLSS 3 Frame Gen"],
      cons: ["Preço elevado em comparação à geração anterior"],
      status: "ACTIVE",
    });

    const offer1 = await ProductOfferService.createOffer(ws.id, {
      productId: product.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-4070111-rtx-4070-loja-a",
      seller: "Loja Oficial Nvidia",
      price: 3899.0,
      oldPrice: 4299.0,
      trackingLabel: "review-rtx4070",
      status: "ACTIVE",
    });

    if (!offer1.id || !product.id) {
      throw new Error("FAIL: Falha ao criar produto/oferta para UI.");
    }
    console.log("✓ Check 2 PASS: Produto e oferta com dados completos criados.");

    // 3. Validação do Feed de Listagem para UI
    console.log("\n--- Check 3: Validação da Listagem do Catálogo com Filtros ---");
    const listResult = await ProductCatalogService.listProducts(ws.id, {
      categoryId: catHardware.id,
      status: "ACTIVE",
    });

    if (listResult.items.length !== 1 || listResult.items[0].offers.length !== 1) {
      throw new Error("FAIL: Listagem de produtos não retornou a oferta vinculada corretamente.");
    }
    console.log("✓ Check 3 PASS: Listagem com categoria e ofertas vinculadas confirmada.");

    // 4. Validação da Consulta de Detalhes para as Abas da UI
    console.log("\n--- Check 4: Consulta de Detalhes para Abas (Geral, Specs, Ofertas) ---");
    const detail = await ProductCatalogService.getProduct(ws.id, product.id);
    if (
      !detail.specs ||
      typeof detail.specs !== "object" ||
      (detail.specs as Record<string, string>)["vram"] !== "12GB GDDR6X" ||
      detail.pros.length !== 3 ||
      detail.offers.length !== 1
    ) {
      throw new Error("FAIL: Dados para as abas da UI vieram incompletos.");
    }
    console.log("✓ Check 4 PASS: Dados estruturados para as abas de produto validados com sucesso.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.productCategory.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 114 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 114:", error);
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
