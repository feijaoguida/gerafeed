import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { ProductCategoryService } from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 110 - Product Category Taxonomy & Hierarchy ===");

  const WS_A_SLUG = "test-ws-cat-a";
  const WS_B_SLUG = "test-ws-cat-b";
  const PLAN_SLUG = "test-plan-cat";

  try {
    // 0. Cleanup
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

    // 1. Setup Plan & Workspaces
    console.log("\n--- Check 1: Setup de Planos e Workspaces ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Categorias Teste",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [{ featureId: featModule.id, enabled: true }],
        },
      },
    });

    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Categorias", slug: WS_A_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsA.id, planId: plan.id, status: "ACTIVE" },
    });

    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Categorias", slug: WS_B_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: wsB.id, planId: plan.id, status: "ACTIVE" },
    });
    console.log("✓ Check 1 PASS: Workspaces A e B criados com plano habilitado.");

    // 2. CRUD Básico de Categorias
    console.log("\n--- Check 2: CRUD Básico de Categorias de Produtos ---");
    const catEletronicos = await ProductCategoryService.createCategory(wsA.id, {
      name: "Eletrônicos & Tech",
      description: "Dispositivos e acessórios de tecnologia.",
    });

    if (catEletronicos.name !== "Eletrônicos & Tech" || catEletronicos.slug !== "eletronicos-tech") {
      throw new Error(`FAIL: Criação de categoria com slug inválido: ${catEletronicos.slug}`);
    }

    const fetchedCat = await ProductCategoryService.getCategory(wsA.id, catEletronicos.id);
    if (fetchedCat.id !== catEletronicos.id) {
      throw new Error("FAIL: getCategory retornou ID incorreto.");
    }

    const updatedCat = await ProductCategoryService.updateCategory(wsA.id, catEletronicos.id, {
      description: "Descrição atualizada para eletrônicos.",
      active: true,
    });
    if (updatedCat.description !== "Descrição atualizada para eletrônicos.") {
      throw new Error("FAIL: Atualização de categoria falhou.");
    }
    console.log("✓ Check 2 PASS: Criação, busca e atualização de categorias funcionando.");

    // 3. Hierarquia Parent / Child
    console.log("\n--- Check 3: Hierarquia de Categorias (Parent/Child) ---");
    const catSmartphones = await ProductCategoryService.createCategory(wsA.id, {
      name: "Smartphones e Celulares",
      parentId: catEletronicos.id,
    });

    if (catSmartphones.parentId !== catEletronicos.id) {
      throw new Error("FAIL: parentId não foi associado corretamente.");
    }

    const catAcessorios = await ProductCategoryService.createCategory(wsA.id, {
      name: "Capas e Películas",
      parentId: catSmartphones.id,
    });

    const listWithChildren = await ProductCategoryService.listCategories(wsA.id, { includeChildren: true });
    if (listWithChildren.length !== 3) {
      throw new Error(`FAIL: listCategories esperava 3 categorias, retornou ${listWithChildren.length}`);
    }
    console.log("✓ Check 3 PASS: Hierarquia de categorias (Avô -> Pai -> Filho) associada com sucesso.");

    // 4. Prevenção de Referência Circular
    console.log("\n--- Check 4: Prevenção de Referências Circulares e Auto-Paternidade ---");
    let selfParentBlocked = false;
    try {
      await ProductCategoryService.updateCategory(wsA.id, catEletronicos.id, {
        parentId: catEletronicos.id,
      });
    } catch (e: unknown) {
      selfParentBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de auto-paternidade: "${e.message}"`);
      }
    }
    if (!selfParentBlocked) {
      throw new Error("FAIL: Auto-paternidade não foi bloqueada!");
    }

    let circularBlocked = false;
    try {
      // Tentativa de fazer a categoria raiz (Eletrônicos) ter como pai a categoria neta (Capas)
      await ProductCategoryService.updateCategory(wsA.id, catEletronicos.id, {
        parentId: catAcessorios.id,
      });
    } catch (e: unknown) {
      circularBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de ciclo circular: "${e.message}"`);
      }
    }
    if (!circularBlocked) {
      throw new Error("FAIL: Ciclo circular de hierarquia não foi bloqueado!");
    }
    console.log("✓ Check 4 PASS: Prevenção de ciclos circulares e auto-paternidade validada com sucesso.");

    // 5. Isolamento Multi-Tenant e Unicidade de Slugs
    console.log("\n--- Check 5: Isolamento Multi-Tenant e Slugs Independentes ---");
    // Tenant B cria categoria com mesmo nome -> deve ter slug idêntico sem colisão
    const catTenantB = await ProductCategoryService.createCategory(wsB.id, {
      name: "Eletrônicos & Tech",
    });

    if (catTenantB.slug !== "eletronicos-tech" || catTenantB.workspaceId !== wsB.id) {
      throw new Error("FAIL: Slug idêntico em tenants distintos causou colisão ou falha de isolamento.");
    }

    // Tenant A tenta acessar categoria do Tenant B
    let crossTenantBlocked = false;
    try {
      await ProductCategoryService.getCategory(wsA.id, catTenantB.id);
    } catch {
      crossTenantBlocked = true;
    }
    if (!crossTenantBlocked) {
      throw new Error("FAIL: Tenant A conseguiu acessar categoria do Tenant B!");
    }

    // Tenant A tenta usar categoria do Tenant B como parentId
    let crossParentBlocked = false;
    try {
      await ProductCategoryService.createCategory(wsA.id, {
        name: "Item Invasor",
        parentId: catTenantB.id,
      });
    } catch {
      crossParentBlocked = true;
    }
    if (!crossParentBlocked) {
      throw new Error("FAIL: Permitiu associar parentId de outro workspace!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito de categorias entre tenants confirmado.");

    // 6. Safe Deletion, Reparenting & Detach de Produtos
    console.log("\n--- Check 6: Exclusão Segura com Reparenting e Desvinculação de Produtos ---");
    // Cria produto atrelado a catSmartphones
    const testProduct = await prisma.product.create({
      data: {
        workspaceId: wsA.id,
        name: "Smartphone Teste Categoria",
        slug: "smartphone-teste-cat",
        categoryId: catSmartphones.id,
      },
    });

    // Exclui catSmartphones (que tem parent: catEletronicos e child: catAcessorios)
    await ProductCategoryService.deleteCategory(wsA.id, catSmartphones.id);

    // Verifica que o produto teve categoryId setado como null
    const productAfterDelete = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    if (productAfterDelete?.categoryId !== null) {
      throw new Error("FAIL: Produto não foi desvinculado com categoryId: null.");
    }

    // Verifica que catAcessorios teve seu parentId atualizado para catEletronicos
    const acessoriosAfterDelete = await prisma.productCategory.findUnique({
      where: { id: catAcessorios.id },
    });
    if (acessoriosAfterDelete?.parentId !== catEletronicos.id) {
      throw new Error(`FAIL: Reparenting de filhos falhou. Esperado: ${catEletronicos.id}, obtido: ${acessoriosAfterDelete?.parentId}`);
    }
    console.log("✓ Check 6 PASS: Exclusão segura com reparenting de filhos e desvinculação de produtos confirmada.");

    // 7. Cleanup
    console.log("\n--- Cleanup ---");
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
    console.log("TODOS OS TESTES DA TASK 110 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 110:", error);
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
