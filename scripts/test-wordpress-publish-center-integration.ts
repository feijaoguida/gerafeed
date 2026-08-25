import { prisma } from "@/lib/prisma";
import { ArticlePlacementService } from "@/lib/affiliate/placement-service";
import { CanonicalDocumentService } from "@/lib/affiliate/canonical-document";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 168 - WordPress Publish Center Integration ===");

  const timestamp = Date.now();
  const testEmail = `tenant-168-${timestamp}@example.com`;
  const workspaceSlug = `ws-168-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace, Source, Category and Products
    console.log("\n--- Check 1: Setup de Workspace, Destinos, Categorias e Produtos ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 168" },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 168 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    const wpSite = await prisma.wordPressSite.create({
      data: {
        workspaceId: workspace.id,
        name: "Portal Tech 168",
        url: "https://portaltech168.example.com",
        username: "admin_168",
        encryptedApplicationPassword: "mock-password-168",
        active: true,
      },
    });

    const wpCategory = await prisma.wordPressCategory.create({
      data: {
        workspaceId: workspace.id,
        wordpressId: 101,
        name: "Tecnologia",
        slug: "tecnologia",
      },
    });

    const source = await prisma.source.create({
      data: {
        workspaceId: workspace.id,
        name: "TechCrunch RSS",
        creditName: "TechCrunch",
        rssUrl: "https://techcrunch.example.com/feed",
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const product = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Smartwatch Amazfit GTR 4",
        slug: `amazfit-gtr4-${timestamp}`,
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16801-amazfit",
            price: 999.0,
            seller: "Amazfit Oficial",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Check 1 PASS: Workspace, WordPressSite, categoria, fonte e produto criados.");

    // 2. Test RSS Article Publishing (Normal + Monetized with Placement)
    console.log("\n--- Check 2: Renderização e Publicação de Notícia RSS (Normal + Monetizada) ---");
    const rssArticle = await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        sourceId: source.id,
        wordpressSiteId: wpSite.id,
        categoryId: wpCategory.id,
        originalTitle: "Amazfit lança atualização para rastreamento esportivo",
        title: "Amazfit Lança Nova Atualização para Smartwatches",
        summary: "Melhorias nos sensores de GPS e monitoramento cardíaco.",
        content: "<p>A Amazfit anunciou hoje um novo firmware com melhorias substanciais no GPS e novos modos esportivos.</p>",
        status: "PENDING",
      },
    });

    // Add affiliate placement to RSS article
    await ArticlePlacementService.createPlacement(workspace.id, {
      articleId: rssArticle.id,
      productId: product.id,
      placementType: "TOP_RECOMMENDATION",
      label: "Modelo Recomendado",
    });

    const rssPlacements = await ArticlePlacementService.getArticlePlacements(workspace.id, rssArticle.id);
    let finalRssContent = rssArticle.content!;

    if (rssPlacements.length > 0) {
      finalRssContent = ArticlePlacementService.renderPlacementsInHtml(finalRssContent, rssPlacements);
    }
    const creditName = source.creditName || source.name;
    if (creditName && !finalRssContent.includes("Fonte:")) {
      finalRssContent += `<br><br><p><em>Fonte: ${creditName}</em></p>`;
    }

    if (!finalRssContent.includes("gerafeed-top-recommendation") || !finalRssContent.includes("Fonte: TechCrunch")) {
      throw new Error("FAIL Check 2: RSS monetizado deve conter o card de placement e a atribuição da fonte!");
    }
    if (!finalRssContent.includes('rel="sponsored nofollow"')) {
      throw new Error("FAIL Check 2: Links de produtos no RSS devem ser sponsored nofollow!");
    }
    console.log("✓ Check 2 PASS: Artigo RSS com monetização e crédito de fonte renderizados com perfeição.");

    // 3. Test Affiliate Commercial Article Publishing (Canonical Document)
    console.log("\n--- Check 3: Renderização e Publicação de Artigo Comercial de Afiliados ---");
    const canonicalDoc = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: { text: "Aviso: Participamos do programa de afiliados." },
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: product.id,
          highlightBadge: "Melhor Custo-Benefício",
          ctaText: "Comprar com Desconto",
        },
      },
      {
        type: "PROS_CONS",
        data: {
          productId: product.id,
          pros: ["Bateria de 14 dias", "GPS preciso"],
          cons: ["Sem resposta de voz no iOS"],
        },
      },
    ]);

    const commercialArticle = await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        wordpressSiteId: wpSite.id,
        categoryId: wpCategory.id,
        title: "Review Amazfit GTR 4: O Melhor Smartwatch Custo-Benefício?",
        summary: "Análise completa com prós, contras e veredito sobre o relógio inteligente.",
        commercialType: "PRODUCT_REVIEW",
        canonicalContent: canonicalDoc as object,
        seoFocusKeyword: "amazfit gtr 4 review",
        status: "PENDING",
      },
    });

    if (!commercialArticle.id) {
      throw new Error("FAIL Check 3: Artigo comercial de teste não foi persistido.");
    }

    const productsForCommercial = await prisma.product.findMany({
      where: { id: product.id, workspaceId: workspace.id },
      include: { offers: { where: { status: "ACTIVE" } } },
    });

    const finalCommercialContent = CanonicalDocumentService.renderToHtml(
      canonicalDoc,
      productsForCommercial
    );

    if (!finalCommercialContent.includes("gerafeed-affiliate-disclosure") || !finalCommercialContent.includes("gerafeed-product-card")) {
      throw new Error("FAIL Check 3: Artigo comercial deve renderizar disclosure e product card canônicos!");
    }
    if (!finalCommercialContent.includes("MLB-16801-amazfit") || !finalCommercialContent.includes('rel="sponsored nofollow"')) {
      throw new Error("FAIL Check 3: Link de afiliado oficial do banco ausente!");
    }
    console.log("✓ Check 3 PASS: Artigo comercial de afiliados renderizado a partir do documento canônico.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleAffiliatePlacement.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.article.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.source.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.wordPressCategory.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.wordPressSite.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 168 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 168:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
