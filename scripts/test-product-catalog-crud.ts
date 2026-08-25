import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ProductCatalogService, ProductCategoryService } from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 111 - Product Catalog CRUD, Filtering & Limits ===");

  const WS_A_SLUG = "test-ws-prod-crud-a";
  const WS_B_SLUG = "test-ws-prod-crud-b";
  const PLAN_SLUG = "test-plan-prod-crud";

  try {
    // 0. Cleanup
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

    // 1. Setup Plan (Limit = 3 products) & Workspaces
    console.log("\n--- Check 1: Setup de Planos com Limite e Workspaces ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Catálogo Teste",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 3 }, // Limit 3 products
          ],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Catálogo", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Catálogo", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Check 1 PASS: Workspaces A e B configurados com plano (limite = 3 produtos).");

    // 2. Criação de Categoria e Produtos com Dados Estruturados
    console.log("\n--- Check 2: Criação de Produtos com Specs, Pros/Cons e Rating ---");
    const catTech = await ProductCategoryService.createCategory(wsA.id, {
      name: "Tecnologia",
    });

    const prod1 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Notebook Gamer Ultra 16GB",
      brand: "GamerBrand",
      description: "Notebook de alta performance com placa RTX.",
      imageUrl: "https://example.com/notebook.jpg",
      specs: { ram: "16GB", cpu: "Core i7", storage: "1TB SSD" },
      pros: ["Tela 144Hz rápida", "Excelente refrigeração"],
      cons: ["Bateria com autonomia moderada"],
      rating: 4.8,
      categoryId: catTech.id,
      status: "ACTIVE",
    });

    if (prod1.name !== "Notebook Gamer Ultra 16GB" || prod1.rating !== 4.8 || prod1.pros.length !== 2) {
      throw new Error("FAIL: Produto criado com dados estruturados incorretos.");
    }
    console.log("✓ Check 2 PASS: Produto criado com sucesso com specs, pros/cons, rating e categoria.");

    // 3. Atualização e Modificação de Status (ACTIVE -> ARCHIVED)
    console.log("\n--- Check 3: Atualização de Produto e Mudança de Status ---");
    const updatedProd1 = await ProductCatalogService.updateProduct(wsA.id, prod1.id, {
      status: "ARCHIVED",
      rating: 4.9,
      pros: ["Tela 144Hz rápida", "Excelente refrigeração", "Teclado RGB personalizável"],
    });

    if (updatedProd1.status !== "ARCHIVED" || updatedProd1.pros.length !== 3) {
      throw new Error("FAIL: Atualização de status e campos falhou.");
    }
    console.log("✓ Check 3 PASS: Atualização de produto e status ARCHIVED confirmados.");

    // 4. Criação de Produtos Adicionais para Testar Filtros e Busca
    console.log("\n--- Check 4: Listagem, Busca Textual, Filtros e Paginação ---");
    const prod2 = await ProductCatalogService.createProduct(wsA.id, {
      name: "Mouse Sem Fio Ergonômico",
      brand: "ErgoTech",
      description: "Mouse para produtividade sem fio.",
      status: "ACTIVE",
    });

    await ProductCatalogService.createProduct(wsA.id, {
      name: "Teclado Mecânico Compacto",
      brand: "GamerBrand",
      description: "Teclado com switches silenciosos.",
      status: "ACTIVE",
    });

    // Busca por termo "GamerBrand"
    const searchResult = await ProductCatalogService.listProducts(wsA.id, { search: "GamerBrand" });
    if (searchResult.items.length !== 2) {
      throw new Error(`FAIL: Busca por 'GamerBrand' esperava 2 itens, retornou ${searchResult.items.length}`);
    }

    // Filtro por status "ACTIVE"
    const activeResult = await ProductCatalogService.listProducts(wsA.id, { status: "ACTIVE" });
    if (activeResult.items.length !== 2) {
      throw new Error(`FAIL: Filtro por status 'ACTIVE' esperava 2 itens, retornou ${activeResult.items.length}`);
    }

    // Paginação
    const paginatedResult = await ProductCatalogService.listProducts(wsA.id, { page: 1, limit: 2 });
    if (paginatedResult.items.length !== 2 || paginatedResult.total !== 3 || paginatedResult.totalPages !== 2) {
      throw new Error("FAIL: Paginação retornou metadados incorretos.");
    }
    console.log("✓ Check 4 PASS: Listagem com busca textual, filtros de status/brand e paginação validados.");

    // 5. Limite Quantitativo de Produtos do Plano (Limite = 3)
    console.log("\n--- Check 5: Bloqueio do Limite de Produtos do Plano ---");
    let limitBlocked = false;
    try {
      await ProductCatalogService.createProduct(wsA.id, {
        name: "Quarto Produto Bloqueado",
      });
    } catch (e: unknown) {
      limitBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de limite: "${e.message}"`);
      }
    }
    if (!limitBlocked) {
      throw new Error("FAIL: ProductCatalogService permitiu criar produto além do limite de 3!");
    }
    console.log("✓ Check 5 PASS: Limite quantitativo de produtos bloqueou criação excedente.");

    // 6. Isolamento Multi-Tenant
    console.log("\n--- Check 6: Isolamento Estrito Multi-Tenant ---");
    const tenantBList = await ProductCatalogService.listProducts(wsB.id);
    if (tenantBList.items.length !== 0) {
      throw new Error("FAIL: Tenant B listou produtos do Tenant A!");
    }

    let crossTenantUpdateBlocked = false;
    try {
      await ProductCatalogService.updateProduct(wsB.id, prod1.id, { name: "Hack" });
    } catch {
      crossTenantUpdateBlocked = true;
    }
    if (!crossTenantUpdateBlocked) {
      throw new Error("FAIL: Tenant B conseguiu atualizar produto do Tenant A!");
    }
    console.log("✓ Check 6 PASS: Isolamento estrito entre múltiplos tenants confirmado.");

    // 7. Exclusão de Produto
    console.log("\n--- Check 7: Exclusão de Produto ---");
    await ProductCatalogService.deleteProduct(wsA.id, prod2.id);
    const countAfterDelete = await prisma.product.count({ where: { workspaceId: wsA.id } });
    if (countAfterDelete !== 2) {
      throw new Error(`FAIL: Contagem esperada 2 após exclusão, obtido ${countAfterDelete}`);
    }
    console.log("✓ Check 7 PASS: Exclusão de produto realizada com sucesso.");

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
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 111 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 111:", error);
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
