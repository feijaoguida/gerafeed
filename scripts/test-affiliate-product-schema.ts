import { prisma } from "@/lib/prisma";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 102 - Affiliate Product Schema & Tenant Isolation ===");

  const WS_A_SLUG = "test-ws-affiliate-schema-a";
  const WS_B_SLUG = "test-ws-affiliate-schema-b";

  try {
    // 0. Ensure programs seed & cleanup
    await ensureDefaultAffiliatePrograms();
    const meliProg = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.productCategory.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });

    // 1. Create Workspaces A & B
    console.log("\n--- Check 1: Criação de Tenants (Workspaces) ---");
    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A", slug: WS_A_SLUG },
    });
    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B", slug: WS_B_SLUG },
    });
    console.log("✓ Check 1 PASS: Workspaces A e B criados.");

    // 2. Create Categories & Multi-tenant Slug Uniqueness
    console.log("\n--- Check 2: ProductCategory & Slug Isolation ---");
    const catA = await prisma.productCategory.create({
      data: {
        workspaceId: wsA.id,
        name: "Eletrônicos",
        slug: "eletronicos",
        description: "Gadgets e tecnologia",
      },
    });

    // Same slug in workspace B must be allowed
    const catB = await prisma.productCategory.create({
      data: {
        workspaceId: wsB.id,
        name: "Eletrônicos",
        slug: "eletronicos",
      },
    });

    if (!catA || !catB || catA.id === catB.id) {
      throw new Error("FAIL: Categorias em tenants distintos falharam.");
    }

    // Duplicate slug in same workspace must fail
    let duplicateCatFailed = false;
    try {
      await prisma.productCategory.create({
        data: {
          workspaceId: wsA.id,
          name: "Outros Eletrônicos",
          slug: "eletronicos",
        },
      });
    } catch {
      duplicateCatFailed = true;
    }
    if (!duplicateCatFailed) {
      throw new Error("FAIL: Constraint única de categoria por workspace não funcionou.");
    }
    console.log("✓ Check 2 PASS: ProductCategory e isolamento de slug por tenant funcionando.");

    // 3. Create Product with rich metadata
    console.log("\n--- Check 3: Product Model & Specs ---");
    const productA = await prisma.product.create({
      data: {
        workspaceId: wsA.id,
        categoryId: catA.id,
        name: "Fone de Ouvido Bluetooth Pro",
        slug: "fone-bluetooth-pro",
        brand: "SoundBrand",
        description: "Fone com cancelamento ativo de ruído.",
        imageUrl: "https://example.com/fone.jpg",
        specs: {
          bateria: "30 horas",
          conexao: "Bluetooth 5.3",
          anc: "Sim",
        },
        pros: ["Excelente bateria", "Ótimo cancelamento de ruído"],
        cons: ["Preço elevado"],
        rating: 4.8,
        status: "ACTIVE",
      },
    });

    if (!productA.id || productA.pros.length !== 2 || (productA.specs as Record<string, string>)?.bateria !== "30 horas") {
      throw new Error("FAIL: Product criado com campos inconsistentes.");
    }
    console.log("✓ Check 3 PASS: Product criado com dados estruturados (specs, pros/cons, rating).");

    // 4. Create ProductOffer
    console.log("\n--- Check 4: ProductOffer & Affiliate Link Metadata ---");
    const offerA = await prisma.productOffer.create({
      data: {
        workspaceId: wsA.id,
        productId: productA.id,
        affiliateProgramId: meliProg.id,
        externalProductId: "MLB987654321",
        originalUrl: "https://produto.mercadolivre.com.br/MLB-987654321-fone",
        resolvedUrl: "https://produto.mercadolivre.com.br/MLB-987654321-fone",
        affiliateUrl: "https://mercadolivre.com/sec/abc1234",
        seller: "Loja Oficial SoundBrand",
        price: 299.90,
        oldPrice: 399.90,
        currency: "BRL",
        trackingLabel: "artigo_tecnologia",
        metadataSource: "MERCADO_LIVRE_IMPORT",
        metadataLastFetchedAt: new Date(),
        status: "ACTIVE",
      },
    });

    if (!offerA.id || offerA.affiliateUrl !== "https://mercadolivre.com/sec/abc1234" || offerA.externalProductId !== "MLB987654321") {
      throw new Error("FAIL: ProductOffer não persistiu campos esperados.");
    }
    console.log("✓ Check 4 PASS: ProductOffer criado com sucesso com affiliateUrl obrigatório e metadados.");

    // 5. Tenant Isolation Verification
    console.log("\n--- Check 5: Tenant Isolation ---");
    const productsInB = await prisma.product.findMany({
      where: { workspaceId: wsB.id },
    });
    const offersInB = await prisma.productOffer.findMany({
      where: { workspaceId: wsB.id },
    });

    if (productsInB.length !== 0 || offersInB.length !== 0) {
      throw new Error("FAIL: Vazamento de dados de produtos/ofertas entre tenants!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito de dados entre workspaces confirmado.");

    // 6. Cascade deletion verification
    console.log("\n--- Check 6: Cascade Deletion ---");
    await prisma.product.delete({
      where: { id: productA.id },
    });
    const remainingOffers = await prisma.productOffer.findMany({
      where: { productId: productA.id },
    });
    if (remainingOffers.length !== 0) {
      throw new Error("FAIL: Ofertas órfãs permaneceram após exclusão do produto.");
    }
    console.log("✓ Check 6 PASS: Exclusão em cascata de ProductOffer validada.");

    // 7. Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productCategory.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 102 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 102:", error);
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
