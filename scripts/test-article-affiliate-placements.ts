import { prisma } from "@/lib/prisma";
import { ArticlePlacementService } from "@/lib/affiliate/placement-service";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 164 - Article Affiliate Placements ===");

  const timestamp = Date.now();
  const testEmail = `tenant-164-${timestamp}@example.com`;
  const workspaceSlug = `ws-164-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace, Article & Products
    console.log("\n--- Check 1: Setup de Workspace, Artigo e Produtos ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 164" },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 164 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    const article = await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        originalTitle: "Como Escolher o Melhor Fone com Cancelamento de Ruído",
        title: "Guia dos Fones de Ouvido Bluetooth Noise Cancelling",
        summary: "Dicas para encontrar o modelo ideal para viagens e trabalho.",
        content: "<p>Fones com cancelamento de ruído ativo transformaram o mercado de áudio.</p><p>Eles utilizam microfones externos para neutralizar ondas sonoras indesejadas.</p><p>Ao escolher, avalie a duração da bateria, conforto e qualidade sonora.</p>",
        status: "PENDING",
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const productTop = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Sony WH-1000XM5",
        slug: `sony-xm5-${timestamp}`,
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16401-sony",
            price: 2499.0,
            seller: "Sony Loja Oficial",
            status: "ACTIVE",
          },
        },
      },
    });

    const productParagraph = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Bose QuietComfort 45",
        slug: `bose-qc45-${timestamp}`,
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16402-bose",
            price: 1899.0,
            seller: "Bose Store",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("✓ Check 1 PASS: Entidades criadas com sucesso.");

    // 2. Service & Validation: Create Placements
    console.log("\n--- Check 2: Criação e Validação de Placements ---");
    const topPlacement = await ArticlePlacementService.createPlacement(workspace.id, {
      articleId: article.id,
      productId: productTop.id,
      placementType: "TOP_RECOMMENDATION",
      label: "Melhor Escolha Premium para Viagens",
    });

    const paragraphPlacement = await ArticlePlacementService.createPlacement(workspace.id, {
      articleId: article.id,
      productId: productParagraph.id,
      placementType: "AFTER_PARAGRAPH",
      paragraphIndex: 1,
      label: "Melhor Conforto Prolongado",
    });

    if (!topPlacement.id || !paragraphPlacement.id) {
      throw new Error("FAIL Check 2: Placements não foram criados corretamente!");
    }

    const fetchedPlacements = await ArticlePlacementService.getArticlePlacements(workspace.id, article.id);
    if (fetchedPlacements.length !== 2) {
      throw new Error(`FAIL Check 2: Esperados 2 placements, obtidos ${fetchedPlacements.length}`);
    }
    console.log("✓ Check 2 PASS: Placements criados, associados e consultados.");

    // 3. Renderer: Inject Placements into Article HTML
    console.log("\n--- Check 3: Renderização de Placements no Conteúdo HTML ---");
    const renderedHtml = ArticlePlacementService.renderPlacementsInHtml(
      article.content!,
      fetchedPlacements
    );

    // Validate TOP_RECOMMENDATION
    if (!renderedHtml.includes("gerafeed-top-recommendation") || !renderedHtml.includes("Sony WH-1000XM5")) {
      throw new Error("FAIL Check 3: TOP_RECOMMENDATION não foi inserido no topo do HTML!");
    }
    if (!renderedHtml.includes('rel="sponsored nofollow"')) {
      throw new Error("FAIL Check 3: Links de afiliados devem possuir rel='sponsored nofollow'!");
    }

    // Validate AFTER_PARAGRAPH
    if (!renderedHtml.includes("gerafeed-paragraph-product") || !renderedHtml.includes("Bose QuietComfort 45")) {
      throw new Error("FAIL Check 3: AFTER_PARAGRAPH não foi injetado após o parágrafo indicado!");
    }
    console.log("✓ Check 3 PASS: Renderizador HTML injetou todos os placements com marcação correta e links seguros.");

    // 4. Batch Sync Placements
    console.log("\n--- Check 4: Sincronização em Lote de Placements ---");
    const synced = await ArticlePlacementService.syncPlacements(workspace.id, article.id, [
      {
        articleId: article.id,
        productId: productTop.id,
        placementType: "PRODUCT_CARD",
      },
    ]);
    if (synced.length !== 1 || synced[0].placementType !== "PRODUCT_CARD") {
      throw new Error("FAIL Check 4: syncPlacements falhou ao atualizar a lista.");
    }
    console.log("✓ Check 4 PASS: Sincronização em lote testada com sucesso.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleAffiliatePlacement.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 164 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 164:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
