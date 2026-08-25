import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ProductCatalogService,
  ProductOfferService,
  ProductCategoryService,
  CanonicalDocumentService,
  CanonicalDocument,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";
import { WordPressAffiliateRenderer } from "@/lib/publisher";

async function run() {
  console.log("=== TEST: Task 131 - WordPress Canonical Affiliate Renderer ===");

  const WS_SLUG = "test-ws-wp-renderer";
  const PLAN_SLUG = "plan-wp-renderer";

  try {
    // 0. Cleanup
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

    // 1. Setup Workspace, Category, Products & Offers
    console.log("\n--- Check 1: Setup de Dados de Catálogo e Ofertas ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano WP Renderer",
        slug: "plan-wp-renderer",
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
      data: { name: "Tenant WP Renderer Test", slug: WS_SLUG },
    });
    await prisma.subscription.create({
      data: { workspaceId: ws.id, planId: plan.id, status: "ACTIVE" },
    });

    const category = await ProductCategoryService.createCategory(ws.id, {
      name: "Monitores Gamer",
      slug: "monitores-gamer",
    });

    const prod1 = await ProductCatalogService.createProduct(ws.id, {
      name: "Monitor Gamer OLED 27\" 240Hz",
      brand: "UltraDisplay",
      categoryId: category.id,
      rating: 4.9,
      specs: { painel: "QD-OLED", resolucao: "2560x1440", taxaAtualizacao: "240Hz", tempoResposta: "0.03ms" },
      pros: ["Pretos perfeitos e contraste infinito", "Tempo de resposta quase instantâneo"],
      cons: ["Preço elevado"],
    });
    const offer1 = await ProductOfferService.createOffer(ws.id, {
      productId: prod1.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-5001-monitor-oled-27",
      price: 4599.0,
      seller: "UltraDisplay Oficial",
    });

    const prod2 = await ProductCatalogService.createProduct(ws.id, {
      name: "Monitor Gamer IPS 27\" 165Hz",
      brand: "GamerPro",
      categoryId: category.id,
      rating: 4.6,
      specs: { painel: "Fast IPS", resolucao: "2560x1440", taxaAtualizacao: "165Hz", tempoResposta: "1ms" },
      pros: ["Excelente fidelidade de cores", "Ótimo custo-benefício para 1440p"],
      cons: ["Níveis de preto típicos de IPS"],
    });
    await ProductOfferService.createOffer(ws.id, {
      productId: prod2.id,
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-5002-monitor-ips-27",
      price: 1899.0,
      seller: "GamerPro Store",
    });
    console.log("✓ Check 1 PASS: Workspace, produtos e ofertas configurados.");

    // 2. Renderização de todos os tipos de blocos canônicos
    console.log("\n--- Check 2: Renderização de Documento Canônico para HTML ---");
    const canonicalDoc: CanonicalDocument = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {
          text: "Este artigo contém links de afiliados. Se você comprar, recebemos comissão sem custo adicional.",
          position: "top",
        },
      },
      {
        type: "HEADING",
        data: {
          level: 2,
          text: "Os Melhores Monitores Gamer 1440p de 2026",
          id: "intro-monitores",
        },
      },
      {
        type: "RICH_TEXT",
        data: {
          html: "<p>Se você busca a máxima performance em jogos competitivos e imersão visual, confira os modelos abaixo.</p>",
        },
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: prod1.id,
          offerId: offer1.id,
          highlightBadge: "Melhor Escolha Absoluta",
          showSpecs: true,
          showProsCons: true,
          ctaText: "Ver Melhor Preço no Mercado Livre",
        },
      },
      {
        type: "PRODUCT_COMPARISON",
        data: {
          productIds: [prod1.id, prod2.id],
          criteria: ["Painel", "Resolução", "Taxa de Atualização"],
          highlightBestId: prod1.id,
        },
      },
      {
        type: "PROS_CONS",
        data: {
          productId: prod2.id,
          pros: prod2.pros,
          cons: prod2.cons,
        },
      },
      {
        type: "CTA",
        data: {
          productId: prod1.id,
          offerId: offer1.id,
          text: "Aproveitar Oferta do Monitor OLED Campeão",
          subtext: "Estoque limitado com entrega expressa",
          buttonStyle: "deal",
        },
      },
      {
        type: "IMAGE",
        data: {
          url: "https://example.com/images/monitor-gamer.jpg",
          alt: "Monitor Gamer em Destaque",
          caption: "Setup com monitor 27 polegadas 240Hz",
        },
      },
    ]);

    const renderedHtml = await WordPressAffiliateRenderer.renderToHtml(ws.id, canonicalDoc);

    // Validações do HTML gerado
    if (!renderedHtml.includes("nc-affiliate-disclosure") || !renderedHtml.includes("Aviso de Transparência")) {
      throw new Error("FAIL: Bloco de disclosure de afiliados não renderizado corretamente.");
    }

    if (!renderedHtml.includes("<h2 id=\"intro-monitores\">Os Melhores Monitores Gamer 1440p de 2026</h2>")) {
      throw new Error("FAIL: Bloco de heading não renderizado corretamente.");
    }

    if (!renderedHtml.includes("nc-product-card") || !renderedHtml.includes("Melhor Escolha Absoluta")) {
      throw new Error("FAIL: Bloco de card de produto não renderizado corretamente.");
    }

    if (!renderedHtml.includes("nc-comparison-table-wrapper") || !renderedHtml.includes("CAMPEÃO")) {
      throw new Error("FAIL: Bloco de tabela comparativa não renderizado corretamente.");
    }

    if (!renderedHtml.includes("Pontos Positivos") || !renderedHtml.includes("Pontos de Atenção")) {
      throw new Error("FAIL: Bloco de prós e contras não renderizado.");
    }

    if (!renderedHtml.includes("Aproveitar Oferta do Monitor OLED Campeão")) {
      throw new Error("FAIL: Bloco de CTA não renderizado.");
    }
    console.log("✓ Check 2 PASS: Todos os 8 blocos canônicos foram renderizados com formatação semântica.");

    // 3. Resolução Dinâmica de Ofertas e URLs no Momento da Renderização
    console.log("\n--- Check 3: Resolução Dinâmica de Ofertas no Publish ---");
    if (!renderedHtml.includes("4599.00") || !renderedHtml.includes("1899.00")) {
      throw new Error("FAIL: Preços das ofertas ativas não foram injetados dinamicamente.");
    }

    if (!renderedHtml.includes("https://produto.mercadolivre.com.br/MLB-5001-monitor-oled-27")) {
      throw new Error("FAIL: Link de afiliado da oferta 1 não foi resolvido.");
    }
    console.log("✓ Check 3 PASS: Ofertas ativas e preços resolvidos dinamicamente no catálogo.");

    // 4. Compliance e Sanitização de Links (rel="sponsored nofollow noopener")
    console.log("\n--- Check 4: Compliance Editorial e Sanitização de Links ---");
    const linkMatches = renderedHtml.match(/<a\s+[^>]*href="https:\/\/produto\.mercadolivre\.com\.br[^>]*>/g) || [];
    if (linkMatches.length === 0) {
      throw new Error("FAIL: Nenhum link de afiliado encontrado para validação de compliance.");
    }

    for (const linkTag of linkMatches) {
      if (!linkTag.includes('rel="sponsored nofollow noopener"') || !linkTag.includes('target="_blank"')) {
        throw new Error(`FAIL CRÍTICO: Link de afiliado sem conformidade de atributos obrigatórios: ${linkTag}`);
      }
    }
    console.log(`✓ Check 4 PASS: Todos os ${linkMatches.length} links de afiliados possuem rel="sponsored nofollow noopener" e target="_blank".`);

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
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 131 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 131:", error);
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
