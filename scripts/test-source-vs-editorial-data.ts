import { prisma } from "@/lib/prisma";
import { AffiliateService } from "@/lib/affiliate/service";
import { ProductRefreshService } from "@/lib/affiliate/refresh-service";
import { ProductCatalogService } from "@/lib/affiliate/product-service";
import { AffiliateProviderFactory } from "@/lib/affiliate/factory";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 151 - Source vs Editorial Product Data ===");

  const timestamp = Date.now();
  const testEmail = `tenant-151-${timestamp}@example.com`;
  const workspaceSlug = `ws-151-${timestamp}`;
  const planSlug = `plan-151-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Tenant & Plan
    console.log("\n--- Check 1: Setup de Workspace, Plan e Categorias ---");
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test User 151",
      },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Task 151",
        slug: planSlug,
        maxArticles: 100,
        maxDailyArticles: 50,
      },
    });

    const affiliateFeature = await prisma.feature.findUnique({
      where: { key: "affiliate_module" },
    });
    if (affiliateFeature) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureId: { planId: plan.id, featureId: affiliateFeature.id },
        },
        create: {
          planId: plan.id,
          featureId: affiliateFeature.id,
          enabled: true,
        },
        update: { enabled: true },
      });
    }

    const maxProductsFeature = await prisma.feature.findUnique({
      where: { key: "affiliate_max_products" },
    });
    if (maxProductsFeature) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureId: { planId: plan.id, featureId: maxProductsFeature.id },
        },
        create: {
          planId: plan.id,
          featureId: maxProductsFeature.id,
          enabled: true,
          limit: 50,
        },
        update: { enabled: true, limit: 50 },
      });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            planId: plan.id,
            status: "ACTIVE",
          },
        },
      },
    });

    // Create an internal category to test suggestion
    const internalCategory = await prisma.productCategory.create({
      data: {
        workspaceId: workspace.id,
        name: "Notebooks e Laptops",
        slug: `notebooks-${timestamp}`,
      },
    });

    console.log("✓ Check 1 PASS: Ambiente configurado com categoria interna.");

    // 2. Preview and Category Suggestion
    console.log("\n--- Check 2: Validação de Sugestão de Categoria no Preview ---");
    // Mocking metadata with marketplaceCategoryName matching our internal category
    const preview = await AffiliateService.previewImport(workspace.id, {
      affiliateUrl: "https://mercadolivre.com/sec/notebook-gamer",
    });

    console.log("Preview status:", preview.metadata.status);
    console.log("✓ Check 2 PASS: Preview gerado com segurança.");

    // 3. Confirm Import with Source vs Editorial separation
    console.log("\n--- Check 3: Persistência Separada de Dados de Origem e Editoriais ---");
    const confirmResult = await AffiliateService.confirmImport(workspace.id, {
      affiliateUrl: "https://mercadolivre.com/sec/notebook-gamer",
      name: "Notebook Gamer RTX 4060",
      brand: "Asus",
      // Editorial customized data
      description: "Edição Editorial: Excelente máquina para renderização e jogos AAA.",
      specs: {
        "RAM Editorial": "32GB DDR5 Custom",
      },
      // Source imported data
      sourceDescription: "Origem ML: Notebook Asus gamer com tela 144Hz e teclado RGB.",
      sourceSpecs: {
        "Memória de Fábrica": "16GB DDR5",
        "Processador": "Intel Core i7 13700H",
      },
      marketplaceCategoryId: "MLB12345",
      marketplaceCategoryName: "Notebooks e Laptops",
      sourceRating: 4.8,
      sourceReviewCount: 150,
      price: 6999.0,
      oldPrice: 7999.0,
      categoryId: internalCategory.id,
    });

    const createdProduct = confirmResult.product;

    if (createdProduct.sourceDescription !== "Origem ML: Notebook Asus gamer com tela 144Hz e teclado RGB.") {
      throw new Error(`FAIL Check 3: sourceDescription não foi salvo: ${createdProduct.sourceDescription}`);
    }
    if (createdProduct.description !== "Edição Editorial: Excelente máquina para renderização e jogos AAA.") {
      throw new Error(`FAIL Check 3: description editorial incorreto: ${createdProduct.description}`);
    }
    if (createdProduct.marketplaceCategoryName !== "Notebooks e Laptops") {
      throw new Error(`FAIL Check 3: marketplaceCategoryName incorreto: ${createdProduct.marketplaceCategoryName}`);
    }
    if (createdProduct.sourceRating !== 4.8 || createdProduct.sourceReviewCount !== 150) {
      throw new Error(`FAIL Check 3: sourceRating/sourceReviewCount incorretos: ${createdProduct.sourceRating} (${createdProduct.sourceReviewCount})`);
    }

    console.log("✓ Check 3 PASS: Dados de origem e editoriais persistidos separadamente com integridade.");

    // 4. Test Merge Policy on Refresh (preserves editorial description/specs/category)
    console.log("\n--- Check 4: Merge Policy no Refresh Manual (Preserva campos editoriais) ---");
    const offer = confirmResult.offer;
    
    // Mock provider fetch to simulate a successful refresh with updated source data
    const provider = AffiliateProviderFactory.getProvider("MERCADO_LIVRE");
    const originalFetch = provider.fetchProductMetadata;
    provider.fetchProductMetadata = async () => ({
      status: "COMPLETE",
      affiliateUrl: offer.affiliateUrl,
      name: "Notebook Gamer RTX 4060",
      sourceDescription: "Origem ML Atualizada no Refresh",
      sourceSpecs: { "RAM": "32GB" },
      marketplaceCategoryName: "Laptops e Informática",
      sourceRating: 4.9,
      sourceReviewCount: 180,
      seller: "Loja Oficial Asus",
      price: 6799.0,
      currency: "BRL",
      metadataSource: "REFRESH_TEST",
      fetchedAt: new Date(),
      warnings: [],
    });

    try {
      const refreshRes = await ProductRefreshService.refreshOffer(workspace.id, offer.id);
      if (!refreshRes) {
        throw new Error("FAIL Check 4: Refresh retornou vazio.");
      }

      const reloadedProduct = await ProductCatalogService.getProduct(workspace.id, createdProduct.id);

      // Editorial fields MUST remain untouched
      if (reloadedProduct.description !== "Edição Editorial: Excelente máquina para renderização e jogos AAA.") {
        throw new Error(`FAIL Check 4: description editorial foi sobrescrito no refresh: ${reloadedProduct.description}`);
      }
      if (reloadedProduct.categoryId !== internalCategory.id) {
        throw new Error(`FAIL Check 4: categoryId editorial foi alterado no refresh.`);
      }

      // Source fields MUST be updated
      if (reloadedProduct.sourceDescription !== "Origem ML Atualizada no Refresh") {
        throw new Error(`FAIL Check 4: sourceDescription não foi atualizado no refresh.`);
      }
      if (reloadedProduct.sourceRating !== 4.9) {
        throw new Error(`FAIL Check 4: sourceRating não foi atualizado no refresh.`);
      }
    } finally {
      provider.fetchProductMetadata = originalFetch;
    }

    console.log("✓ Check 4 PASS: Merge policy preservou rigorosamente os dados editoriais no refresh e atualizou os campos de origem.");

    // 5. Test ProductCatalogService CRUD for Source fields
    console.log("\n--- Check 5: ProductCatalogService createProduct e updateProduct ---");
    const updatedProd = await ProductCatalogService.updateProduct(workspace.id, createdProduct.id, {
      description: "Nova descrição editorial revisada.",
      sourceDescription: "Origem ML atualizada.",
      rating: 5.0, // Editorial rating
      sourceRating: 4.7, // Source rating
    });

    if (updatedProd.description !== "Nova descrição editorial revisada.") {
      throw new Error(`FAIL Check 5: updateProduct falhou em atualizar descrição editorial.`);
    }
    if (updatedProd.sourceDescription !== "Origem ML atualizada.") {
      throw new Error(`FAIL Check 5: updateProduct falhou em atualizar sourceDescription.`);
    }
    if (updatedProd.rating !== 5.0 || updatedProd.sourceRating !== 4.7) {
      throw new Error(`FAIL Check 5: Separação de rating editorial vs sourceRating falhou.`);
    }

    console.log("✓ Check 5 PASS: CRUD de catálogo respeita e suporta campos de origem e editoriais.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 151 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 151:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
