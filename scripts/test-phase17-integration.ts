import { prisma } from "@/lib/prisma";
import { AffiliateService } from "@/lib/affiliate/service";
import { ProductCatalogService } from "@/lib/affiliate/product-service";
import { ProductRefreshService } from "@/lib/affiliate/refresh-service";
import { ProductReviewService } from "@/lib/affiliate/review-service";
import { ProductReferenceSourceService } from "@/lib/affiliate/reference-source-service";
import { AffiliateProviderFactory } from "@/lib/affiliate/factory";
import { SafeUrlResolver } from "@/lib/affiliate/resolver";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== INTEGRATION TEST: Phase 17 - Product Enrichment & Research ===");

  const timestamp = Date.now();
  const testEmailA = `tenant-156-a-${timestamp}@example.com`;
  const testEmailB = `tenant-156-b-${timestamp}@example.com`;
  const wsSlugA = `ws-156-a-${timestamp}`;
  const wsSlugB = `ws-156-b-${timestamp}`;
  const planSlug = `plan-156-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup 2 Tenants (A and B) to test tenancy isolation
    console.log("\n--- Check 1: Setup de Múltiplos Workspaces ---");
    const userA = await prisma.user.create({ data: { email: testEmailA, name: "User A 156" } });
    const userB = await prisma.user.create({ data: { email: testEmailB, name: "User B 156" } });

    const plan = await prisma.plan.create({
      data: { name: "Plan Phase 17", slug: planSlug, maxArticles: 100, maxDailyArticles: 50 },
    });

    const affiliateFeature = await prisma.feature.findUnique({ where: { key: "affiliate_module" } });
    if (affiliateFeature) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId: affiliateFeature.id } },
        create: { planId: plan.id, featureId: affiliateFeature.id, enabled: true },
        update: { enabled: true },
      });
    }

    const maxProductsFeature = await prisma.feature.findUnique({ where: { key: "affiliate_max_products" } });
    if (maxProductsFeature) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId: maxProductsFeature.id } },
        create: { planId: plan.id, featureId: maxProductsFeature.id, enabled: true, limit: 50 },
        update: { enabled: true, limit: 50 },
      });
    }

    const wsA = await prisma.workspace.create({
      data: {
        name: `Workspace 156 A ${timestamp}`,
        slug: wsSlugA,
        members: { create: { userId: userA.id, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE" } },
      },
    });

    const wsB = await prisma.workspace.create({
      data: {
        name: `Workspace 156 B ${timestamp}`,
        slug: wsSlugB,
        members: { create: { userId: userB.id, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE" } },
      },
    });

    console.log("✓ Check 1 PASS: Workspaces A e B criados com sucesso.");

    // 2. Import enriched product in Workspace A
    console.log("\n--- Check 2: Preview & Confirm Import Enriquecido ---");
    const provider = AffiliateProviderFactory.getProvider("MERCADO_LIVRE");
    const originalFetch = provider.fetchProductMetadata;

    provider.fetchProductMetadata = async () => ({
      status: "COMPLETE",
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-156001-robo-aspirador-inteligente",
      name: "Robô Aspirador Inteligente Laser Mop 5000Pa",
      brand: "CleanTech",
      description: "Robô aspirador com navegação a laser LDS e sucção potente de 5000Pa.",
      sourceDescription: "Robô aspirador com navegação a laser LDS e sucção potente de 5000Pa.",
      sourceSpecs: {
        "Poder de Sucção": "5000 Pa",
        "Autonomia": "180 minutos",
        "Mapeamento": "Laser LDS 360",
      },
      marketplaceCategoryId: "MLB5678",
      marketplaceCategoryName: "Eletrodomésticos > Aspiradores > Robôs",
      sourceRating: 4.8,
      sourceReviewCount: 340,
      seller: "Loja Oficial CleanTech",
      price: 1999.0,
      oldPrice: 2499.0,
      imageUrl: "https://http2.mlstatic.com/robo-aspirador.jpg",
      metadataSource: "PREVIEW_MOCK",
      fetchedAt: new Date(),
      warnings: [],
      reviewSamples: [
        {
          rating: 5,
          title: "Mapeamento impecável",
          text: "Mapeou o apartamento de 90m2 em 15 minutos sem bater nos móveis.",
          authorName: "Juliana R.",
          capturedAt: new Date(),
        },
        {
          rating: 4.5,
          title: "Muito silencioso",
          text: "Excelente poder de sucção mesmo no modo silencioso.",
          authorName: "Thiago M.",
          capturedAt: new Date(),
        },
      ],
    });

    const preview = await AffiliateService.previewImport(wsA.id, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-156001-robo-aspirador-inteligente",
    });

    const confirmImport = await AffiliateService.confirmImport(wsA.id, {
      affiliateUrl: preview.metadata.affiliateUrl,
      name: preview.metadata.name || "Robô Aspirador Inteligente Laser Mop 5000Pa",
      brand: preview.metadata.brand,
      description: preview.metadata.description,
      sourceDescription: preview.metadata.sourceDescription,
      sourceSpecs: preview.metadata.sourceSpecs,
      marketplaceCategoryId: preview.metadata.marketplaceCategoryId,
      marketplaceCategoryName: preview.metadata.marketplaceCategoryName,
      sourceRating: preview.metadata.sourceRating,
      sourceReviewCount: preview.metadata.sourceReviewCount,
      imageUrl: preview.metadata.imageUrl,
      price: preview.metadata.price,
      oldPrice: preview.metadata.oldPrice,
      seller: preview.metadata.seller,
      reviewSamples: preview.metadata.reviewSamples,
    });

    const initialProduct = await ProductCatalogService.getProduct(wsA.id, confirmImport.product.id);
    if (!initialProduct.reviewSamples || initialProduct.reviewSamples.length !== 2) {
      throw new Error(`FAIL Check 2: Review samples não persistidos.`);
    }
    console.log("✓ Check 2 PASS: Produto importado com todos os metadados de origem e review samples.");

    // 3. Edit Editorial Fields
    console.log("\n--- Check 3: Edição Editorial Personalizada ---");
    const updatedEditorial = await ProductCatalogService.updateProduct(wsA.id, initialProduct.id, {
      name: "Robô Aspirador CleanTech Laser Pro - Escolha do Editor",
      description: "Análise detalhada: o melhor custo-benefício para casas com pets e múltiplos cômodos.",
      rating: 4.9,
      pros: ["Navegação a laser ultrarrápida", "Passa pano com pressão constante"],
      cons: ["Reservatório de poeira exige limpeza frequente"],
      specs: {
        "Poder de Sucção": "5000 Pa (Modo Turbo)",
        "Autonomia Real": "3 horas contínuas",
        "Garantia": "12 meses nacional",
      },
    });

    if (updatedEditorial.name !== "Robô Aspirador CleanTech Laser Pro - Escolha do Editor") {
      throw new Error("FAIL Check 3: Atualização editorial falhou.");
    }
    console.log("✓ Check 3 PASS: Dados editoriais personalizados salvos com sucesso.");

    // 4. Trigger Refresh & Verify Merge Policy
    console.log("\n--- Check 4: Refresh com Mudança de Preço e Verificação de Preservação ---");
    provider.fetchProductMetadata = async () => ({
      status: "COMPLETE",
      affiliateUrl: confirmImport.offer.affiliateUrl,
      name: "NOME NOVO DO MARKETPLACE (IGNORAR)",
      brand: "MARCA NOVA (IGNORAR)",
      description: "DESCRICAO NOVA DO MARKETPLACE (IGNORAR EDITORIAL)",
      sourceDescription: "Nova descrição atualizada da fábrica no Mercado Livre.",
      sourceSpecs: {
        "Poder de Sucção": "5200 Pa revisado",
        "Autonomia": "180 min",
      },
      marketplaceCategoryId: "MLB5678",
      marketplaceCategoryName: "Eletrodomésticos > Aspiradores > Robôs",
      sourceRating: 4.9,
      sourceReviewCount: 420,
      seller: "Mercado Livre Full",
      price: 1799.0, // Preço baixou
      oldPrice: 1999.0,
      imageUrl: "https://http2.mlstatic.com/nova-foto.jpg",
      metadataSource: "REFRESH_INTEGRATION",
      fetchedAt: new Date(),
      warnings: [],
      reviewSamples: [
        {
          rating: 5,
          title: "Novo review atualizado",
          text: "Passa pano excelente e aplicativo muito intuitivo.",
          authorName: "Camila S.",
          capturedAt: new Date(),
        },
      ],
    });

    const refreshResult = await ProductRefreshService.refreshOffer(wsA.id, confirmImport.offer.id);
    if (!refreshResult.priceChanged || refreshResult.newPrice !== 1799.0) {
      throw new Error("FAIL Check 4: Detecção de mudança de preço no refresh falhou.");
    }

    const reloadedProduct = await ProductCatalogService.getProduct(wsA.id, initialProduct.id);
    if (reloadedProduct.name !== "Robô Aspirador CleanTech Laser Pro - Escolha do Editor") {
      throw new Error("FAIL Check 4: Nome editorial sobrescrito no refresh!");
    }
    if (reloadedProduct.description !== "Análise detalhada: o melhor custo-benefício para casas com pets e múltiplos cômodos.") {
      throw new Error("FAIL Check 4: Descrição editorial sobrescrita no refresh!");
    }
    if (reloadedProduct.rating !== 4.9 || reloadedProduct.pros.length !== 2) {
      throw new Error("FAIL Check 4: Avaliação/Prós editoriais sobrescritos no refresh!");
    }
    if (reloadedProduct.sourceRating !== 4.9 || reloadedProduct.sourceReviewCount !== 420) {
      throw new Error("FAIL Check 4: sourceRating ou sourceReviewCount não sincronizados no refresh!");
    }
    console.log("✓ Check 4 PASS: Política de merge executada: dados editoriais preservados e metadados de origem atualizados.");

    // 5. Add External Reference Source & Summarize
    console.log("\n--- Check 5: Cadastro e Sumarização de Fonte de Pesquisa Externa ---");
    const originalResolve = SafeUrlResolver.resolve;
    SafeUrlResolver.resolve = async () => ({
      resolved: true,
      initialUrl: "https://techportal.example.com/review-cleantech-laser",
      finalUrl: "https://techportal.example.com/review-cleantech-laser",
      redirectChain: [],
      statusCode: 200,
      headers: {},
      body: `
        <html>
        <head><title>Review Completo: Aspirador CleanTech</title></head>
        <body>
          <article>
            <p>Em nossos testes de bancada, o robô aspirador removeu 98% dos pelos de animais em carpetes altos.</p>
            <p>O nível de ruído medido foi de apenas 58dB, tornando-o um dos mais silenciosos da categoria.</p>
          </article>
        </body>
        </html>
      `,
    });

    const refSource = await ProductReferenceSourceService.createReferenceSource(wsA.id, {
      productId: initialProduct.id,
      url: "https://techportal.example.com/review-cleantech-laser",
    });

    const processedSource = await ProductReferenceSourceService.processReferenceSource(
      wsA.id,
      refSource.id
    );

    if (processedSource.status !== "READY" || !processedSource.summary) {
      throw new Error(`FAIL Check 5: Processamento da fonte de referência falhou: ${processedSource.error}`);
    }

    const reviewGrounding = ProductReviewService.formatReviewsForAiGrounding(reloadedProduct.reviewSamples);
    const sourceGrounding = ProductReferenceSourceService.formatReferenceSourcesForAiGrounding([processedSource]);

    if (!reviewGrounding.includes("Amostras Qualitativas de Opiniões de Consumidores")) {
      throw new Error("FAIL Check 5: Grounding de reviews formatado incorretamente.");
    }
    if (!sourceGrounding.includes("Pesquisa e Fontes Especializadas de Referência")) {
      throw new Error("FAIL Check 5: Grounding de fontes de referência formatado incorretamente.");
    }
    console.log("✓ Check 5 PASS: Fonte externa processada e grounding de IA montado com sucesso.");

    // 6. Multi-Tenant Isolation
    console.log("\n--- Check 6: Isolamento Multi-Tenant ---");
    let tenantLeak = false;
    try {
      await ProductCatalogService.getProduct(wsB.id, initialProduct.id);
      tenantLeak = true;
    } catch {
      // Expected: product not found in workspace B
    }
    if (tenantLeak) {
      throw new Error("FAIL Check 6: Workspace B conseguiu acessar o produto do Workspace A!");
    }

    const wsBSources = await ProductReferenceSourceService.getReferenceSources(wsB.id, initialProduct.id);
    if (wsBSources.length > 0) {
      throw new Error("FAIL Check 6: Workspace B conseguiu ver as fontes do Workspace A!");
    }
    console.log("✓ Check 6 PASS: Isolamento estrito entre tenants validado.");

    // Restore mocks
    provider.fetchProductMetadata = originalFetch;
    SafeUrlResolver.resolve = originalResolve;

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: wsA.id } });
    await prisma.workspace.delete({ where: { id: wsB.id } });
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("INTEGRAÇÃO DA FASE 17 PASSOU 100% COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DA INTEGRAÇÃO DA FASE 17:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
