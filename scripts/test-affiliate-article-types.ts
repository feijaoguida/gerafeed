import { prisma } from "@/lib/prisma";
import { CommercialArticleType } from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 120 - Affiliate Article Types & Retrocompatibility ===");

  const WS_A_SLUG = "test-ws-art-types-a";
  const WS_B_SLUG = "test-ws-art-types-b";

  try {
    // 0. Cleanup
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.source.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });

    // 1. Setup Workspaces & Legacy Source
    console.log("\n--- Check 1: Setup de Workspaces e Fonte RSS Legada ---");
    const wsA = await prisma.workspace.create({
      data: { name: "Tenant A Articles", slug: WS_A_SLUG },
    });
    const wsB = await prisma.workspace.create({
      data: { name: "Tenant B Articles", slug: WS_B_SLUG },
    });

    const sourceLegacy = await prisma.source.create({
      data: {
        workspaceId: wsA.id,
        name: "Tech News RSS",
        rssUrl: "https://example.com/rss.xml",
      },
    });
    console.log("✓ Check 1 PASS: Workspaces e fonte criados.");

    // 2. Retrocompatibilidade: Criação de Artigo Legado de Notícia (commercialType = null)
    console.log("\n--- Check 2: Retrocompatibilidade de Artigo de Notícia Legado ---");
    const legacyArticle = await prisma.article.create({
      data: {
        workspaceId: wsA.id,
        sourceId: sourceLegacy.id,
        originalUrl: "https://example.com/news/1",
        originalTitle: "Notícia Convencional Sem Afiliação",
        title: "Título Curado da Notícia",
        content: "Conteúdo reescrito pela IA",
        status: "PENDING",
        commercialType: null,
      },
    });

    if (legacyArticle.commercialType !== null || !legacyArticle.sourceId) {
      throw new Error("FAIL: Artigo legado não foi criado com commercialType nulo!");
    }
    console.log("✓ Check 2 PASS: Artigo legado preservado com commercialType = null.");

    // 3. Criação de Artigos com Todos os 7 Tipos Comerciais
    console.log("\n--- Check 3: Validação dos 7 Tipos de Artigos Comerciais ---");
    const typesToTest: CommercialArticleType[] = [
      "PRODUCT_REVIEW",
      "COMPARISON",
      "BEST_PRODUCTS",
      "BUYING_GUIDE",
      "PROBLEM_SOLUTION",
      "DEALS",
      "SEASONAL",
    ];

    for (let i = 0; i < typesToTest.length; i++) {
      const type = typesToTest[i];
      const created = await prisma.article.create({
        data: {
          workspaceId: wsA.id,
          title: `Artigo Comercial do Tipo ${type}`,
          summary: `Resumo do tipo ${type}`,
          content: `<p>Conteúdo formatado para ${type}</p>`,
          status: "PENDING",
          commercialType: type,
        },
      });

      if (created.commercialType !== type) {
        throw new Error(`FAIL: Artigo comercial criado com tipo divergente: ${created.commercialType}`);
      }
    }
    console.log("✓ Check 3 PASS: Todos os 7 tipos comerciais criados com sucesso no banco de dados.");

    // 4. Validação de Filtros (Filtro por Tipo, isAffiliate=true e isAffiliate=false)
    console.log("\n--- Check 4: Filtros por Tipo Comercial e Segregação de Notícias ---");
    // Filtro por tipo específico PRODUCT_REVIEW
    const reviews = await prisma.article.findMany({
      where: { workspaceId: wsA.id, commercialType: "PRODUCT_REVIEW" },
    });
    if (reviews.length !== 1) {
      throw new Error(`FAIL: Filtro por PRODUCT_REVIEW esperava 1 artigo, retornou ${reviews.length}`);
    }

    // Filtro apenas de artigos de afiliados (commercialType != null)
    const allAffiliateArticles = await prisma.article.findMany({
      where: { workspaceId: wsA.id, commercialType: { not: null } },
    });
    if (allAffiliateArticles.length !== 7) {
      throw new Error(`FAIL: Esperava 7 artigos de afiliados, retornou ${allAffiliateArticles.length}`);
    }

    // Filtro apenas de notícias convencionais (commercialType == null)
    const onlyLegacyArticles = await prisma.article.findMany({
      where: { workspaceId: wsA.id, commercialType: null },
    });
    if (onlyLegacyArticles.length !== 1) {
      throw new Error(`FAIL: Esperava 1 artigo de notícia legado, retornou ${onlyLegacyArticles.length}`);
    }
    console.log("✓ Check 4 PASS: Filtros por tipo comercial e segregação de notícias validados.");

    // 5. Isolamento Multi-Tenant
    console.log("\n--- Check 5: Isolamento Multi-Tenant de Artigos Comerciais ---");
    const tenantBArticles = await prisma.article.findMany({
      where: { workspaceId: wsB.id },
    });
    if (tenantBArticles.length !== 0) {
      throw new Error("FAIL: Tenant B acessou artigos comerciais do Tenant A!");
    }
    console.log("✓ Check 5 PASS: Isolamento estrito entre múltiplos tenants confirmado.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.source.deleteMany({
      where: { workspace: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_A_SLUG, WS_B_SLUG] } },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 120 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 120:", error);
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
