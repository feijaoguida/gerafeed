import { prisma } from "@/lib/prisma";
import { ProductReferenceSourceService } from "@/lib/affiliate/reference-source-service";
import { ProductCatalogService } from "@/lib/affiliate/product-service";
import { SafeUrlResolver } from "@/lib/affiliate/resolver";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 153 - Product Reference Sources ===");

  const timestamp = Date.now();
  const testEmail = `tenant-153-${timestamp}@example.com`;
  const workspaceSlug = `ws-153-${timestamp}`;
  const planSlug = `plan-153-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();

    // 1. Setup Workspace, Plan and Product
    console.log("\n--- Check 1: Setup de Workspace, Plano e Produto ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 153" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Task 153",
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
        name: `Workspace 153 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    const product = await ProductCatalogService.createProduct(workspace.id, {
      name: "Teclado Mecânico Custom Wireless",
      brand: "KeyTech",
      description: "Teclado mecânico custom com switches lubrificados.",
      status: "ACTIVE",
    });

    console.log("✓ Check 1 PASS: Produto e ambiente configurados.");

    // 2. Create Reference Source (Validation and PENDING state)
    console.log("\n--- Check 2: Cadastro de Fonte de Referência (PENDING) ---");
    const source = await ProductReferenceSourceService.createReferenceSource(workspace.id, {
      productId: product.id,
      url: "https://techreview.example.com/analise-teclado-keytech",
    });

    if (source.status !== "PENDING" || source.productId !== product.id) {
      throw new Error(`FAIL Check 2: Status esperado PENDING, obtido: ${source.status}`);
    }

    // Invalid URL check
    let invalidThrown = false;
    try {
      await ProductReferenceSourceService.createReferenceSource(workspace.id, {
        productId: product.id,
        url: "javascript:alert(1)",
      });
    } catch {
      invalidThrown = true;
    }
    if (!invalidThrown) {
      throw new Error("FAIL Check 2: URL inválida não foi rejeitada!");
    }

    console.log("✓ Check 2 PASS: Cadastro inicial em PENDING e validação de URL aprovados.");

    // 3. Mock Safe Fetch & Process Reference Source
    console.log("\n--- Check 3: Processamento com Safe Fetch e Resumo de IA (READY) ---");
    const originalResolve = SafeUrlResolver.resolve;
    SafeUrlResolver.resolve = async () => ({
      resolved: true,
      initialUrl: "https://techreview.example.com/analise-teclado-keytech",
      finalUrl: "https://techreview.example.com/analise-teclado-keytech",
      redirectChain: [],
      statusCode: 200,
      headers: {},
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Análise Completa: Teclado Mecânico KeyTech Wireless</title>
          <meta property="og:title" content="Review Especializado: Teclado KeyTech Custom" />
        </head>
        <body>
          <nav>Menu de navegacao</nav>
          <article>
            <h1>KeyTech Custom Wireless em Teste</h1>
            <p>O teclado surpreendeu pela excelente acústica dos switches pré-lubrificados de fábrica e construção pesada em alumínio usinado CNC.</p>
            <p>A latência no modo sem fio 2.4GHz é imperceptível para jogos competitivos. A bateria durou cerca de 4 semanas com iluminação desligada.</p>
            <p>Como ponto negativo, o software proprietário de mapeamento de teclas ainda possui interface confusa.</p>
          </article>
          <footer>Rodapé</footer>
        </body>
        </html>
      `,
    });

    try {
      const processed = await ProductReferenceSourceService.processReferenceSource(
        workspace.id,
        source.id
      );

      if (processed.status !== "READY") {
        throw new Error(`FAIL Check 3: Status esperado READY, obtido: ${processed.status}, erro: ${processed.error}`);
      }
      if (!processed.title?.includes("KeyTech")) {
        throw new Error(`FAIL Check 3: Título extraído incorreto: ${processed.title}`);
      }
      if (!processed.summary || processed.summary.length < 20) {
        throw new Error(`FAIL Check 3: Resumo não foi gerado ou está vazio.`);
      }

      console.log(`  Título extraído: ${processed.title}`);
      console.log(`  Resumo gerado: ${processed.summary.slice(0, 120)}...`);
      console.log("✓ Check 3 PASS: Processamento, extração de texto e resumo concluídos com sucesso.");

      // 4. Grounding Formatter for AI
      console.log("\n--- Check 4: Formatação de Grounding para Prompts de Conteúdo ---");
      const grounding = ProductReferenceSourceService.formatReferenceSourcesForAiGrounding([processed]);

      if (!grounding.includes("Pesquisa e Fontes Especializadas de Referência")) {
        throw new Error("FAIL Check 4: Cabeçalho de grounding ausente.");
      }
      if (!grounding.includes("techreview.example.com")) {
        throw new Error("FAIL Check 4: URL da fonte não referenciada no grounding.");
      }

      console.log("✓ Check 4 PASS: Grounding formatado corretamente para o motor de IA.");

      // 5. Reprocess & Delete
      console.log("\n--- Check 5: Reprocessamento e Exclusão ---");
      const reprocessed = await ProductReferenceSourceService.processReferenceSource(
        workspace.id,
        source.id
      );
      if (reprocessed.status !== "READY") {
        throw new Error(`FAIL Check 5: Falha no reprocessamento: ${reprocessed.status}`);
      }

      const delRes = await ProductReferenceSourceService.deleteReferenceSource(
        workspace.id,
        source.id
      );
      if (!delRes.success) {
        throw new Error("FAIL Check 5: deleteReferenceSource falhou.");
      }

      const sourcesRemaining = await ProductReferenceSourceService.getReferenceSources(
        workspace.id,
        product.id
      );
      if (sourcesRemaining.length !== 0) {
        throw new Error("FAIL Check 5: Fonte de referência ainda presente após exclusão.");
      }
      console.log("✓ Check 5 PASS: Reprocessamento e exclusão multi-tenant validados.");
    } finally {
      SafeUrlResolver.resolve = originalResolve;
    }

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 153 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 153:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
