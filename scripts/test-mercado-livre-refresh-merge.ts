import { prisma } from "@/lib/prisma";
import { ProductRefreshService } from "@/lib/affiliate/refresh-service";
import { ProductCatalogService } from "@/lib/affiliate/product-service";
import { AffiliateProviderFactory } from "@/lib/affiliate/factory";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 155 - Mercado Livre Refresh & Merge Policy ===");

  const timestamp = Date.now();
  const testEmail = `tenant-155-${timestamp}@example.com`;
  const workspaceSlug = `ws-155-${timestamp}`;
  const planSlug = `plan-155-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace, Plan, Category & Product with Editorial Overrides
    console.log("\n--- Check 1: Setup com Dados Editoriais Personalizados ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 155" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Task 155",
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
        where: { planId_featureId: { planId: plan.id, featureId: affiliateFeature.id } },
        create: { planId: plan.id, featureId: affiliateFeature.id, enabled: true },
        update: { enabled: true },
      });
    }

    const maxProductsFeature = await prisma.feature.findUnique({
      where: { key: "affiliate_max_products" },
    });
    if (maxProductsFeature) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId: maxProductsFeature.id } },
        create: { planId: plan.id, featureId: maxProductsFeature.id, enabled: true, limit: 50 },
        update: { enabled: true, limit: 50 },
      });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 155 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    const internalCategory = await prisma.productCategory.create({
      data: {
        workspaceId: workspace.id,
        name: "Áudio & Headsets Premium",
        slug: `audio-premium-${timestamp}`,
      },
    });

    // Create product with customized EDITORIAL data and initial SOURCE data
    const initialEditorial = {
      name: "Headset Gamer Sem Fio Pro X - Edição Editorial",
      slug: `headset-pro-x-editorial-${timestamp}`,
      brand: "Logitech Editorial",
      description: "Descrição editorial refinada manualmente pela equipe de redação.",
      imageUrl: "https://minha-cdn.com/headset-foto-custom.jpg",
      rating: 4.8,
      pros: ["Áudio espacial 7.1 cristalino", "Almofadas de veludo confortáveis"],
      cons: ["Software G Hub pode ser instável no Mac"],
      specs: {
        "Duração da Bateria": "29 horas",
        "Conectividade": "Lightspeed 2.4GHz e Bluetooth",
      },
      categoryId: internalCategory.id,
      sourceDescription: "Descrição original antiga do Mercado Livre",
      marketplaceCategoryId: "MLB1055",
      marketplaceCategoryName: "Eletrônicos > Áudio",
      sourceRating: 4.5,
      sourceReviewCount: 120,
    };

    const product = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        ...initialEditorial,
      },
    });

    // Create Offer
    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const offer = await prisma.productOffer.create({
      data: {
        workspaceId: workspace.id,
        productId: product.id,
        affiliateProgramId: mlProgram.id,
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-999999-headset-gamer",
        price: 999.9,
        oldPrice: 1199.9,
        seller: "Loja Oficial Logitech",
        metadataSource: "IMPORT_INITIAL",
      },
    });

    console.log("✓ Check 1 PASS: Produto editorial e oferta criados.");

    // 2. Mock Refreshed Marketplace Data (Price drop, seller change, new source description & reviews)
    console.log("\n--- Check 2: Simulação de Atualização (Refresh) do Mercado Livre ---");
    const provider = AffiliateProviderFactory.getProvider("MERCADO_LIVRE");
    const originalFetch = provider.fetchProductMetadata;

    provider.fetchProductMetadata = async () => ({
      status: "COMPLETE",
      affiliateUrl: offer.affiliateUrl,
      name: "TITULO NOVO DO MERCADO LIVRE (DEVE SER IGNORADO)",
      brand: "MARCA NOVA (DEVE SER IGNORADA)",
      description: "DESCRICAO NOVA DO MARKETPLACE (DEVE IR APENAS PARA SOURCEDESCRIPTION)",
      sourceDescription: "Nova descrição detalhada vinda do Mercado Livre via API/scraping",
      sourceSpecs: {
        "Sensibilidade": "91.7 dB",
        "Driver": "Pro-G 50mm",
      },
      marketplaceCategoryId: "MLB9999",
      marketplaceCategoryName: "Eletrônicos > Fones e Headsets > Gamers",
      sourceRating: 4.7,
      sourceReviewCount: 250,
      seller: "Mercado Livre Direto",
      price: 849.9, // Preço baixou
      oldPrice: 999.9,
      imageUrl: "https://http2.mlstatic.com/nova-imagem-ml.jpg",
      metadataSource: "REFRESH_TEST",
      fetchedAt: new Date(),
      warnings: [],
      reviewSamples: [
        {
          rating: 5,
          title: "Incrível",
          text: "Melhor headset que já usei, o microfone Blue Voice é surreal.",
          authorName: "Marcos L.",
          capturedAt: new Date(),
        },
      ],
    });

    try {
      // 3. Execute Refresh
      const refreshResult = await ProductRefreshService.refreshOffer(workspace.id, offer.id);

      console.log("\n--- Check 3: Verificação do Diff Retornado ---");
      if (!refreshResult.priceChanged || refreshResult.newPrice !== 849.9) {
        throw new Error(`FAIL Check 3: Alteração de preço não detectada corretamente.`);
      }
      if (!refreshResult.diffs.some((d) => d.field === "price" && d.current === 849.9)) {
        throw new Error(`FAIL Check 3: Diff de preço ausente.`);
      }
      if (!refreshResult.diffs.some((d) => d.field === "seller")) {
        throw new Error(`FAIL Check 3: Diff de seller ausente.`);
      }
      console.log(`  Diffs detectados: ${refreshResult.diffs.map((d) => d.field).join(", ")}`);
      console.log("✓ Check 3 PASS: Diff estruturado gerado com sucesso.");

      // 4. Assert Strict Editorial Preservation vs Source Update
      console.log("\n--- Check 4: Verificação da Política Estrita de Preservação Editorial ---");
      const updatedProduct = await ProductCatalogService.getProduct(workspace.id, product.id);

      // Editorial fields MUST remain 100% untouched
      if (updatedProduct.name !== initialEditorial.name) {
        throw new Error(`FAIL Check 4: name editorial foi sobrescrito! '${updatedProduct.name}'`);
      }
      if (updatedProduct.slug !== initialEditorial.slug) {
        throw new Error(`FAIL Check 4: slug editorial foi sobrescrito!`);
      }
      if (updatedProduct.brand !== initialEditorial.brand) {
        throw new Error(`FAIL Check 4: brand editorial foi sobrescrito!`);
      }
      if (updatedProduct.description !== initialEditorial.description) {
        throw new Error(`FAIL Check 4: description editorial foi sobrescrito!`);
      }
      if (updatedProduct.imageUrl !== initialEditorial.imageUrl) {
        throw new Error(`FAIL Check 4: imageUrl editorial foi sobrescrito!`);
      }
      if (updatedProduct.rating !== initialEditorial.rating) {
        throw new Error(`FAIL Check 4: rating editorial foi sobrescrito!`);
      }
      if (updatedProduct.categoryId !== initialEditorial.categoryId) {
        throw new Error(`FAIL Check 4: categoryId editorial foi sobrescrito!`);
      }
      console.log("updatedProduct.specs:", JSON.stringify(updatedProduct.specs));
      console.log("initialEditorial.specs:", JSON.stringify(initialEditorial.specs));
      const updSpecs = updatedProduct.specs as Record<string, string>;
      const initSpecs = initialEditorial.specs as Record<string, string>;
      if (updSpecs["Duração da Bateria"] !== initSpecs["Duração da Bateria"] || updSpecs["Conectividade"] !== initSpecs["Conectividade"]) {
        throw new Error(`FAIL Check 4: specs editoriais foram sobrescritas!`);
      }
      if (JSON.stringify(updatedProduct.pros) !== JSON.stringify(initialEditorial.pros)) {
        throw new Error(`FAIL Check 4: pros editoriais foram sobrescritos!`);
      }
      if (JSON.stringify(updatedProduct.cons) !== JSON.stringify(initialEditorial.cons)) {
        throw new Error(`FAIL Check 4: cons editoriais foram sobrescritos!`);
      }

      // Source fields MUST be updated
      if (updatedProduct.sourceDescription !== "Nova descrição detalhada vinda do Mercado Livre via API/scraping") {
        throw new Error(`FAIL Check 4: sourceDescription não foi atualizado!`);
      }
      if (updatedProduct.sourceRating !== 4.7) {
        throw new Error(`FAIL Check 4: sourceRating não foi atualizado!`);
      }
      if (updatedProduct.sourceReviewCount !== 250) {
        throw new Error(`FAIL Check 4: sourceReviewCount não foi atualizado!`);
      }
      if (updatedProduct.marketplaceCategoryId !== "MLB9999") {
        throw new Error(`FAIL Check 4: marketplaceCategoryId não foi atualizado!`);
      }

      console.log("✓ Check 4 PASS: Todos os campos editoriais foram estritamente preservados e os metadados de origem foram sincronizados.");

      // 5. Test Full Product Refresh with All Offers
      console.log("\n--- Check 5: Execução do ProductRefreshService.refreshProduct ---");
      const fullRefresh = await ProductRefreshService.refreshProduct(workspace.id, product.id);
      if (fullRefresh.refreshedCount !== 1) {
        throw new Error(`FAIL Check 5: Esperado 1 oferta atualizada, obtido: ${fullRefresh.refreshedCount}`);
      }
      console.log("✓ Check 5 PASS: refreshProduct global concluído com sucesso.");
    } finally {
      provider.fetchProductMetadata = originalFetch;
    }

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 155 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 155:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
