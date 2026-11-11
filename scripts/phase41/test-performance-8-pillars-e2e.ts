import fs from "fs";
import path from "path";
import { prisma } from "../../src/lib/prisma";
import { useDebounce } from "../../src/hooks/use-debounce";

async function runPerformanceAuditSuite() {
  console.log("================================================================================");
  console.log("   AUDITORIA E2E DOS 8 PILARES DE PERFORMANCE SAAS MULTI-TENANT (PHASE 41)       ");
  console.log("================================================================================");

  let passedChecks = 0;
  let totalChecks = 0;

  function assertCheck(name: string, condition: boolean, details?: string) {
    totalChecks++;
    if (condition) {
      console.log(`  [OK] ${name}`);
      passedChecks++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? `-> ${details}` : ""}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // PILAR 1: BANCO DE DADOS (Índices Compostos Multi-Tenant + Pool)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 1] Banco de Dados (Índices Compostos Multi-Tenant + Pool):");

  const pgIndexes: Array<{ tablename: string; indexname: string }> = await prisma.$queryRawUnsafe(`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public';
  `);

  const indexNames = new Set(pgIndexes.map((i) => i.indexname.toLowerCase()));

  const expectedIndexes = [
    "source_workspaceid_active_idx",
    "source_workspaceid_createdat_idx",
    "article_workspaceid_status_createdat_idx",
    "article_workspaceid_processedat_idx",
    "article_workspaceid_sourceid_status_idx",
    "article_workspaceid_wordpresssiteid_status_idx",
    "article_workspaceid_originalpublishedat_idx",
    "product_workspaceid_status_updatedat_idx",
    "product_workspaceid_categoryid_status_idx",
    "productoffer_workspaceid_status_price_idx",
    "productoffer_productid_status_price_idx",
    "invoice_workspaceid_createdat_idx",
    "invoice_subscriptionid_status_idx",
    "systemerrorlog_workspaceid_module_createdat_idx",
    "planhistory_workspaceid_createdat_idx",
  ];

  for (const idx of expectedIndexes) {
    assertCheck(`Índice Composto Multi-Tenant "${idx}" presente no PostgreSQL`, indexNames.has(idx));
  }

  const prismaFileContent = fs.readFileSync(path.join(process.cwd(), "src/lib/prisma.ts"), "utf-8");
  assertCheck(
    "Pool de Conexões com idleTimeoutMillis: 15000",
    prismaFileContent.includes("idleTimeoutMillis: 15000")
  );

  // ---------------------------------------------------------------------------
  // PILAR 2: QUERIES (Paginação Obrigatória, Seleção Explícita, Zero N+1)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 2] Queries (Paginação Obrigatória + Seleção Explícita + Zero N+1):");

  const articlesRouteContent = fs.readFileSync(path.join(process.cwd(), "src/app/api/articles/route.ts"), "utf-8");
  assertCheck(
    "GET /api/articles implementa limit máximo travado em 100",
    articlesRouteContent.includes("Math.min(100") && articlesRouteContent.includes("take: limit")
  );
  assertCheck(
    "GET /api/articles projeta selectFields explícito sem carregar texto pesado por padrão",
    articlesRouteContent.includes("select: selectFields") && articlesRouteContent.includes("includeContent")
  );
  assertCheck(
    "GET /api/articles suporta retorno paginado retrocompatível (?paginated=true)",
    articlesRouteContent.includes("isPaginatedResponse") && articlesRouteContent.includes("pagination:")
  );

  const invoicesRouteContent = fs.readFileSync(path.join(process.cwd(), "src/app/api/billing/invoices/route.ts"), "utf-8");
  assertCheck(
    "GET /api/billing/invoices implementa limite de segurança take",
    invoicesRouteContent.includes("take: limit") && invoicesRouteContent.includes("Math.min(100")
  );

  const companiesRouteContent = fs.readFileSync(path.join(process.cwd(), "src/app/api/backoffice/companies/route.ts"), "utf-8");
  assertCheck(
    "GET /api/backoffice/companies utiliza groupBy eliminando N+1",
    companiesRouteContent.includes("prisma.article.groupBy") &&
      companiesRouteContent.includes("prisma.source.groupBy") &&
      !companiesRouteContent.includes("prisma.article.count({")
  );

  const rssLibContent = fs.readFileSync(path.join(process.cwd(), "src/lib/rss.ts"), "utf-8");
  assertCheck(
    "src/lib/rss.ts inclui wordpressSiteSources no findMany e filtra existingArticles por workspaceId",
    rssLibContent.includes("wordpressSiteSources:") && rssLibContent.includes("workspaceId,")
  );

  const wpLibContent = fs.readFileSync(path.join(process.cwd(), "src/lib/wordpress.ts"), "utf-8");
  assertCheck(
    "src/lib/wordpress.ts sincroniza categorias com lote transacional prisma.$transaction",
    wpLibContent.includes("prisma.$transaction(")
  );

  const syncRouteContent = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/wordpress/sites/[id]/categories/sync/route.ts"),
    "utf-8"
  );
  assertCheck(
    "POST /api/wordpress/sites/[id]/categories/sync sincroniza em lote com prisma.$transaction",
    syncRouteContent.includes("prisma.$transaction(")
  );

  const analyticsContent = fs.readFileSync(path.join(process.cwd(), "src/lib/affiliate/analytics-service.ts"), "utf-8");
  assertCheck(
    "src/lib/affiliate/analytics-service.ts aplica take: 5000 em clicksInPeriod",
    analyticsContent.includes("take: 5000")
  );

  const pubSyncContent = fs.readFileSync(path.join(process.cwd(), "src/lib/publisher/publication-sync.ts"), "utf-8");
  assertCheck(
    "src/lib/publisher/publication-sync.ts filtra no banco com string_contains em vez de carregar todos os JSONs",
    pubSyncContent.includes("string_contains:") && pubSyncContent.includes("select: { id: true }")
  );

  // ---------------------------------------------------------------------------
  // PILAR 3: ASSINCRONISMO (Desacoplamento Pós-Resposta)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 3] Assincronismo (Tarefas Lentas em Background):");

  const offerServiceContent = fs.readFileSync(path.join(process.cwd(), "src/lib/affiliate/offer-service.ts"), "utf-8");
  assertCheck(
    "src/lib/affiliate/offer-service.ts agenda republicações dependentes de forma não-bloqueante (after/fallback)",
    offerServiceContent.includes("scheduleTask") && offerServiceContent.includes("after(scheduleTask)")
  );

  // ---------------------------------------------------------------------------
  // PILAR 4: INTEGRAÇÕES (Timeouts Estritos + Paralelismo Promise.all)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 4] Integrações (Timeouts Estritos + Paralelismo):");

  const asaasContent = fs.readFileSync(path.join(process.cwd(), "src/lib/payments/asaas.ts"), "utf-8");
  assertCheck(
    "AsaasGateway possui AbortSignal.timeout(15000) em suas requisições fetch",
    asaasContent.includes("signal: AbortSignal.timeout(15000)")
  );

  assertCheck(
    "src/lib/wordpress.ts possui AbortSignal.timeout configurado nas chamadas REST e mídia",
    wpLibContent.includes("signal: AbortSignal.timeout(25000)") &&
      wpLibContent.includes("signal: AbortSignal.timeout(15000)") &&
      wpLibContent.includes("signal: AbortSignal.timeout(20000)")
  );

  const wcPublisherContent = fs.readFileSync(
    path.join(process.cwd(), "src/lib/affiliate/woocommerce-publisher.ts"),
    "utf-8"
  );
  assertCheck(
    "WooCommercePublisherService possui AbortSignal.timeout(20000) e uploads paralelos com Promise.all",
    wcPublisherContent.includes("signal: AbortSignal.timeout(20000)") &&
      wcPublisherContent.includes("Promise.all(")
  );

  const openaiContent = fs.readFileSync(path.join(process.cwd(), "src/lib/ai/providers/openai.ts"), "utf-8");
  const geminiContent = fs.readFileSync(path.join(process.cwd(), "src/lib/ai/providers/gemini.ts"), "utf-8");
  const anthropicContent = fs.readFileSync(path.join(process.cwd(), "src/lib/ai/providers/anthropic.ts"), "utf-8");
  const openaiCompContent = fs.readFileSync(
    path.join(process.cwd(), "src/lib/ai/providers/openai-compatible.ts"),
    "utf-8"
  );
  const dalleContent = fs.readFileSync(path.join(process.cwd(), "src/lib/images/adapters/openai-dalle.ts"), "utf-8");

  assertCheck("OpenAIProvider possui timeout configurado", openaiContent.includes("timeout: 45000"));
  assertCheck("GeminiProvider possui AbortSignal.timeout configurado", geminiContent.includes("AbortSignal.timeout(45000)"));
  assertCheck("AnthropicProvider possui AbortSignal.timeout configurado", anthropicContent.includes("AbortSignal.timeout(45000)"));
  assertCheck("OpenAICompatibleProvider possui AbortSignal.timeout configurado", openaiCompContent.includes("AbortSignal.timeout(45000)"));
  assertCheck("OpenAiDalleAdapter possui timeout configurado", dalleContent.includes("timeout: 45000"));

  const smtpContent = fs.readFileSync(path.join(process.cwd(), "src/lib/mail/adapters/smtp-adapter.ts"), "utf-8");
  assertCheck(
    "SmtpAdapter possui connectionTimeout, greetingTimeout e socketTimeout configurados",
    smtpContent.includes("connectionTimeout: 10000") &&
      smtpContent.includes("greetingTimeout: 10000") &&
      smtpContent.includes("socketTimeout: 15000")
  );

  const processAiRouteContent = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/articles/[id]/process-ai/route.ts"),
    "utf-8"
  );
  assertCheck(
    "POST /api/articles/[id]/process-ai executa checagens de limite em paralelo",
    processAiRouteContent.includes("Promise.all([") &&
      processAiRouteContent.includes('checkLimit(workspaceId, "ARTICLES_DAILY")')
  );

  const aiServiceContent = fs.readFileSync(path.join(process.cwd(), "src/lib/ai.ts"), "utf-8");
  assertCheck(
    "src/lib/ai.ts executa geração textual do LLM e processamento de imagem em paralelo",
    aiServiceContent.includes("Promise.all([") &&
      aiServiceContent.includes("provider.generateArticle({") &&
      aiServiceContent.includes("processAndStoreImage(")
  );

  const refreshServiceContent = fs.readFileSync(
    path.join(process.cwd(), "src/lib/affiliate/refresh-service.ts"),
    "utf-8"
  );
  assertCheck(
    "src/lib/affiliate/refresh-service.ts atualiza ofertas do produto com Promise.allSettled",
    refreshServiceContent.includes("Promise.allSettled(")
  );

  // ---------------------------------------------------------------------------
  // PILAR 5: IA (Streaming de Respostas / Progresso SSE)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 5] IA (Streaming de Respostas e Progresso SSE):");

  assertCheck(
    "src/lib/ai.ts exporta AiProgressEvent e suporta callback onProgress",
    aiServiceContent.includes("export type AiProgressEvent =") &&
      aiServiceContent.includes("onProgress?: (event: AiProgressEvent) => void")
  );

  assertCheck(
    "POST /api/articles/[id]/process-ai suporta streaming SSE (text/event-stream) com ?stream=1",
    processAiRouteContent.includes('searchParams.get("stream") === "1"') &&
      processAiRouteContent.includes("text/event-stream") &&
      processAiRouteContent.includes("new ReadableStream({")
  );

  // ---------------------------------------------------------------------------
  // PILAR 6: FRONTEND STATE (Deduplicação e Optimistic UI)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 6] Frontend State (Deduplicação e Optimistic UI):");

  const blockManagerContent = fs.readFileSync(
    path.join(process.cwd(), "src/components/affiliate/affiliate-block-manager.tsx"),
    "utf-8"
  );
  assertCheck(
    "AffiliateBlockManager utiliza attemptedProductIdsRef evitando re-fetch repetido a cada digitação",
    blockManagerContent.includes("attemptedProductIdsRef = useRef<Set<string>>") &&
      blockManagerContent.includes("!attemptedProductIdsRef.current.has(p.productId)")
  );

  const offerListContent = fs.readFileSync(
    path.join(process.cwd(), "src/components/affiliate/offer-list.tsx"),
    "utf-8"
  );
  assertCheck(
    "OfferList implementa Optimistic UI na exclusão de ofertas com rollback",
    offerListContent.includes("previousOffers = offers") &&
      offerListContent.includes("setOffers((prev) => prev.filter(") &&
      offerListContent.includes("setOffers(previousOffers)")
  );

  // ---------------------------------------------------------------------------
  // PILAR 7: INPUTS (Debounce em Buscas e Filtros)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 7] Inputs (Debounce em Buscas e Filtros):");

  assertCheck("useDebounce hook criado e exportado", typeof useDebounce === "function");

  const productListContent = fs.readFileSync(
    path.join(process.cwd(), "src/components/affiliate/product-list.tsx"),
    "utf-8"
  );
  assertCheck(
    "ProductList utiliza debouncedSearch no carregamento",
    productListContent.includes("debouncedSearch = useDebounce(search, 400)")
  );

  assertCheck(
    "CompanyList utiliza debouncedSearch",
    companiesRouteContent.length > 0 &&
      fs.readFileSync(path.join(process.cwd(), "src/components/backoffice/company-list.tsx"), "utf-8").includes("debouncedSearch = useDebounce(search, 400)")
  );

  assertCheck(
    "ErrorLogsViewer utiliza debouncedSearchTerm",
    fs.readFileSync(path.join(process.cwd(), "src/components/backoffice/error-logs-viewer.tsx"), "utf-8").includes("debouncedSearchTerm = useDebounce(searchTerm, 400)")
  );

  assertCheck(
    "RssPublishingQueue utiliza DebouncedDateInput",
    fs.readFileSync(path.join(process.cwd(), "src/components/publishing/rss-publishing-queue.tsx"), "utf-8").includes("<DebouncedDateInput")
  );

  // ---------------------------------------------------------------------------
  // PILAR 8: INFRAESTRUTURA E REDE (Checklist de Configuração Next.js)
  // ---------------------------------------------------------------------------
  console.log("\n[PILAR 8] Infraestrutura e Rede (next.config.ts):");

  const nextConfigFileContent = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf-8");
  assertCheck("next.config.ts com compress: true", nextConfigFileContent.includes("compress: true"));
  assertCheck("next.config.ts com poweredByHeader: false", nextConfigFileContent.includes("poweredByHeader: false"));
  assertCheck(
    "next.config.ts com optimizePackageImports para bibliotecas de UI",
    nextConfigFileContent.includes("optimizePackageImports:") && nextConfigFileContent.includes("lucide-react")
  );
  assertCheck(
    "next.config.ts com Cache-Control imutável para /modified-images/:path*",
    nextConfigFileContent.includes("/modified-images/:path*") &&
      nextConfigFileContent.includes("public, max-age=31536000, immutable")
  );

  // ---------------------------------------------------------------------------
  // RESUMO E STATUS DOS 8 PILARES
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`   RESULTADO: ${passedChecks}/${totalChecks} VERIFICAÇÕES PASSARAM COM SUCESSO!`);
  console.log("================================================================================");

  if (passedChecks === totalChecks) {
    console.log("✅ TODOS OS 8 PILARES DE PERFORMANCE DE ARQUITETURA SAAS ESTÃO CONFORMES!\n");
  } else {
    console.error("❌ ALGUNS ITENS FALHARAM NA VERIFICAÇÃO.");
    process.exit(1);
  }
}

runPerformanceAuditSuite()
  .catch((err) => {
    console.error("Erro fatal na execução da suíte E2E dos 8 Pilares:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
