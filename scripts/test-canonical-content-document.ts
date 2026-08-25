import { prisma } from "@/lib/prisma";
import {
  CanonicalDocumentService,
  CanonicalDocument,
  CanonicalBlock,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 123 - Canonical Content Document Architecture ===");

  const WS_SLUG = "test-ws-canonical-doc";

  try {
    // 0. Cleanup
    await prisma.article.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });

    // 1. Setup Workspace
    console.log("\n--- Check 1: Setup de Workspace ---");
    const ws = await prisma.workspace.create({
      data: { name: "Tenant Canonical Doc", slug: WS_SLUG },
    });
    console.log("✓ Check 1 PASS: Workspace configurado.");

    // 2. Construção e Validação dos 8 Tipos de Blocos Canônicos
    console.log("\n--- Check 2: Construção e Validação de Blocos Canônicos ---");
    const blocks: CanonicalBlock[] = [
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {
          text: "Transparência: ao clicar em nossos links, podemos receber comissões.",
          position: "top",
        },
      },
      {
        type: "HEADING",
        data: {
          level: 2,
          text: "Análise Completa: RTX 4070 vs RX 7800 XT",
          id: "intro-heading",
        },
      },
      {
        type: "RICH_TEXT",
        data: {
          html: "<p>A disputa na faixa intermediária premium está mais acirrada do que nunca.</p>",
          markdown: "A disputa na faixa intermediária premium está mais acirrada do que nunca.",
        },
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: "prod_rtx4070_123",
          offerId: "off_rtx4070_loja1",
          highlightBadge: "Melhor em Ray Tracing",
          showSpecs: true,
          showProsCons: true,
          ctaText: "Ver Menor Preço no Mercado Livre",
        },
      },
      {
        type: "PROS_CONS",
        data: {
          productId: "prod_rtx4070_123",
          pros: ["DLSS 3 Frame Generation", "Baixo consumo elétrico"],
          cons: ["Preço elevado"],
        },
      },
      {
        type: "PRODUCT_COMPARISON",
        data: {
          productIds: ["prod_rtx4070_123", "prod_rx7800xt_456"],
          highlightBestId: "prod_rtx4070_123",
          criteria: ["Desempenho 1440p", "Consumo", "Preço"],
          showPriceRow: true,
        },
      },
      {
        type: "IMAGE",
        data: {
          url: "https://example.com/benchmarks-rtx-vs-rx.png",
          alt: "Gráfico de benchmarks de FPS",
          caption: "Média de FPS em 1440p Ultra",
        },
      },
      {
        type: "CTA",
        data: {
          productId: "prod_rtx4070_123",
          offerId: "off_rtx4070_loja1",
          text: "Aproveitar Oferta da RTX 4070",
          subtext: "Estoque limitado com frete grátis",
          buttonStyle: "deal",
        },
      },
    ];

    const canonicalDoc: CanonicalDocument = CanonicalDocumentService.createDocument(blocks, {
      wordCount: 850,
      readingTimeMinutes: 4,
    });

    if (canonicalDoc.blocks.length !== 8 || canonicalDoc.version !== 1) {
      throw new Error("FAIL: Documento canônico não construiu todos os 8 blocos.");
    }
    console.log("✓ Check 2 PASS: Todos os 8 tipos de blocos canônicos validados.");

    // 3. Serialização e Parse
    console.log("\n--- Check 3: Serialização e Parse Bidirecional (Round-Trip) ---");
    const jsonString = CanonicalDocumentService.serialize(canonicalDoc);
    const parsedDoc = CanonicalDocumentService.parse(jsonString);

    if (parsedDoc.blocks.length !== 8 || parsedDoc.blocks[3].type !== "PRODUCT_CARD") {
      throw new Error("FAIL: Parse do JSON canônico divergente.");
    }
    console.log("✓ Check 3 PASS: Serialização e parse funcionaram sem perda de dados.");

    // 4. Extração de IDs de Produtos e Ofertas
    console.log("\n--- Check 4: Extração de Referências de Produtos e Ofertas ---");
    const extractedProductIds = CanonicalDocumentService.extractReferencedProductIds(parsedDoc);
    const extractedOfferIds = CanonicalDocumentService.extractReferencedOfferIds(parsedDoc);

    if (
      extractedProductIds.length !== 2 ||
      !extractedProductIds.includes("prod_rtx4070_123") ||
      !extractedProductIds.includes("prod_rx7800xt_456")
    ) {
      throw new Error("FAIL: Extração de productIds divergente.");
    }

    if (extractedOfferIds.length !== 1 || !extractedOfferIds.includes("off_rtx4070_loja1")) {
      throw new Error("FAIL: Extração de offerIds divergente.");
    }
    console.log("✓ Check 4 PASS: Extração de referências (productIds e offerIds) validada.");

    // 5. Persistência no Banco de Dados (Article.canonicalContent)
    console.log("\n--- Check 5: Persistência no Modelo Article ---");
    const article = await prisma.article.create({
      data: {
        workspaceId: ws.id,
        title: "RTX 4070 vs RX 7800 XT: Comparativo Definitivo",
        content: "<p>HTML legado renderizado</p>",
        commercialType: "COMPARISON",
        canonicalContent: parsedDoc as object,
      },
    });

    const retrievedArticle = await prisma.article.findUniqueOrThrow({
      where: { id: article.id },
    });

    const parsedFromDb = CanonicalDocumentService.parse(retrievedArticle.canonicalContent);
    if (parsedFromDb.blocks.length !== 8 || retrievedArticle.content !== "<p>HTML legado renderizado</p>") {
      throw new Error("FAIL: Persistência ou coexistência com conteúdo legado falhou!");
    }
    console.log("✓ Check 5 PASS: canonicalContent persistido no PostgreSQL mantendo legado intacto.");

    // 6. Conversão de Conteúdo HTML Legado para Canônico
    console.log("\n--- Check 6: Conversão Fallback de HTML Legado ---");
    const converted = CanonicalDocumentService.convertLegacyHtmlToCanonical("<p>Notícia antiga da versão 1</p>");
    if (
      converted.blocks.length !== 1 ||
      converted.blocks[0].type !== "RICH_TEXT" ||
      converted.blocks[0].data.html !== "<p>Notícia antiga da versão 1</p>"
    ) {
      throw new Error("FAIL: Conversor de fallback de HTML legado falhou.");
    }
    console.log("✓ Check 6 PASS: Conversão de fallback de HTML legado validada.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.article.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 123 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 123:", error);
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
