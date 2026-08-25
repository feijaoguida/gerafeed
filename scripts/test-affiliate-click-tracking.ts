import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import {
  ClickTrackingService,
  ProductCatalogService,
  ProductOfferService,
  CanonicalDocument,
  CanonicalDocumentService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";
import { WordPressAffiliateRenderer } from "@/lib/publisher";
import { POST as trackClickRoute } from "@/app/api/affiliate/clicks/route";

async function run() {
  console.log("=== TEST: Task 134 - Affiliate Click Tracking & Non-blocking Beacon ===");

  const WS_SLUG = "test-ws-clicks";
  const WS2_SLUG = "test-ws-clicks-2";
  const PLAN_SLUG = "plan-click-tracking-test";

  try {
    // 0. Cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.affiliateClick.deleteMany({
      where: {
        workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } },
      },
    });
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_SLUG, WS2_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    // 1. Setup Plans & Workspaces
    console.log("\n--- Check 1: Setup de Workspaces, Plano e Ofertas ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({
      where: { key: AFFILIATE_FEATURES.MODULE },
    });
    const featMaxProd = await prisma.feature.findUniqueOrThrow({
      where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Clicks Test",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProd.id, enabled: true, limit: 20 },
          ],
        },
      },
    });

    const ws1 = await prisma.workspace.create({
      data: { name: "Workspace Clicks 1", slug: WS_SLUG, active: true },
    });
    await prisma.subscription.create({
      data: { workspaceId: ws1.id, planId: plan.id, status: "ACTIVE" },
    });

    const ws2 = await prisma.workspace.create({
      data: { name: "Workspace Clicks 2", slug: WS2_SLUG, active: true },
    });
    await prisma.subscription.create({
      data: { workspaceId: ws2.id, planId: plan.id, status: "ACTIVE" },
    });


    const prod1 = await ProductCatalogService.createProduct(ws1.id, {
      name: "Smartphone Galaxy Ultra",
      brand: "Samsung",
      rating: 4.8,
      pros: ["Tela excelente", "Bateria duradoura"],
      cons: ["Preço elevado"],
    });

    const offer1 = await ProductOfferService.createOffer(ws1.id, {
      productId: prod1.id,
      providerCode: "MERCADO_LIVRE",
      affiliateUrl: "https://mercadolivre.com/sec/galaxy-ultra-aff",
      price: 4999.0,
      seller: "Samsung Oficial",
    });

    const article1 = await prisma.article.create({
      data: {
        workspaceId: ws1.id,
        title: "Review Completo Galaxy Ultra",
        status: "PUBLISHED",
      },
    });

    console.log("✓ Workspaces, plano, produto, oferta e artigo criados com sucesso.");

    // 2. Token Generation & Verification
    console.log("\n--- Check 2: Geração e Verificação Criptográfica de Tokens ---");
    const validToken = ClickTrackingService.generateEventToken({
      workspaceId: ws1.id,
      articleId: article1.id,
      productId: prod1.id,
      offerId: offer1.id,
      component: "PRODUCT_CARD",
      position: 1,
    });

    console.log(`✓ Token gerado: ${validToken.substring(0, 40)}...`);

    const decoded = ClickTrackingService.verifyEventToken(validToken);
    if (
      decoded.workspaceId !== ws1.id ||
      decoded.articleId !== article1.id ||
      decoded.productId !== prod1.id ||
      decoded.offerId !== offer1.id ||
      decoded.component !== "PRODUCT_CARD" ||
      decoded.position !== 1
    ) {
      throw new Error(`Dados decodificados do token não coincidem: ${JSON.stringify(decoded)}`);
    }
    console.log("✓ Token decodificado com integridade perfeita.");

    // 3. Abuse Prevention & Security Verification
    console.log("\n--- Check 3: Prevenção contra Abuso e Adulteração ---");
    
    // 3.1 Tampered signature
    const [payloadPart, sigPart] = validToken.split(".");
    const corruptedSig = sigPart.slice(0, -2) + (sigPart.slice(-2) === "aa" ? "bb" : "aa");
    const tamperedToken = `${payloadPart}.${corruptedSig}`;

    let threwTamper = false;
    try {
      ClickTrackingService.verifyEventToken(tamperedToken);
    } catch {
      threwTamper = true;
    }
    if (!threwTamper) {
      throw new Error("FALHA: Token com assinatura adulterada não foi rejeitado!");
    }
    console.log("✓ Token com assinatura adulterada rejeitado com sucesso.");

    // 3.2 Forged payload with altered workspaceId
    const forgedPayload = Buffer.from(
      JSON.stringify({ workspaceId: ws2.id, productId: prod1.id }),
      "utf8"
    ).toString("base64url");
    const forgedToken = `${forgedPayload}.${sigPart}`;

    let threwForgery = false;
    try {
      ClickTrackingService.verifyEventToken(forgedToken);
    } catch {
      threwForgery = true;
    }
    if (!threwForgery) {
      throw new Error("FALHA: Token com payload forjado/adulterado não foi rejeitado!");
    }
    console.log("✓ Token com payload forjado/adulterado rejeitado com sucesso.");

    // 3.3 Malformed token format
    let threwMalformed = false;
    try {
      ClickTrackingService.verifyEventToken("not-a-valid-token");
    } catch {
      threwMalformed = true;
    }
    if (!threwMalformed) {
      throw new Error("FALHA: Token malformado não foi rejeitado!");
    }
    console.log("✓ Token malformado rejeitado com sucesso.");

    // 4. Direct Href & Non-Blocking Renderer Verification
    console.log("\n--- Check 4: Validação de Href Direto e Script Non-blocking no Renderer ---");
    const canonicalDoc: CanonicalDocument = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: {},
      },
      {
        type: "PRODUCT_CARD",
        data: {
          productId: prod1.id,
          showSpecs: true,
          showProsCons: true,
          highlightBadge: "Top Escolha",
        },
      },
      {
        type: "CTA",
        data: {
          productId: prod1.id,
          text: "Aproveitar Oferta no Mercado Livre",
        },
      },
    ]);

    const renderedHtml = await WordPressAffiliateRenderer.renderToHtml(ws1.id, canonicalDoc, {
      articleId: article1.id,
    });

    // Check direct href
    if (!renderedHtml.includes('href="https://mercadolivre.com/sec/galaxy-ultra-aff"')) {
      throw new Error("FALHA: O HTML renderizado não possui o link direto para o Mercado Livre.");
    }
    console.log("✓ Href direto para affiliateUrl confirmado no HTML renderizado.");

    // Check data-nc-token attribute
    if (!renderedHtml.includes("data-nc-token=")) {
      throw new Error("FALHA: O HTML renderizado não contém atributos data-nc-token.");
    }
    console.log("✓ Atributo data-nc-token com token assinado embutido nos links.");

    // Check rel="sponsored nofollow noopener"
    if (!renderedHtml.includes('rel="sponsored nofollow noopener"')) {
      throw new Error("FALHA: Links não possuem rel='sponsored nofollow noopener'.");
    }
    console.log("✓ Compliance de links com rel='sponsored nofollow noopener' confirmado.");

    // Check non-blocking tracking script
    if (
      !renderedHtml.includes("sendBeacon") ||
      !renderedHtml.includes("window.__nc_tracking_initialized") ||
      !renderedHtml.includes("/api/affiliate/clicks")
    ) {
      throw new Error("FALHA: Script de rastreamento non-blocking não foi embutido.");
    }
    console.log("✓ Script de tracking non-blocking com sendBeacon/fetch verificado.");

    // 5. Database Persistence & Click Recording
    console.log("\n--- Check 5: Gravação de Cliques no Banco com Isolamento de Tenant ---");
    const recordedClick = await ClickTrackingService.recordClick(validToken);

    if (
      !recordedClick.id ||
      recordedClick.workspaceId !== ws1.id ||
      recordedClick.articleId !== article1.id ||
      recordedClick.productId !== prod1.id ||
      recordedClick.offerId !== offer1.id ||
      recordedClick.component !== "PRODUCT_CARD" ||
      recordedClick.position !== 1
    ) {
      throw new Error(`Dados gravados do clique inválidos: ${JSON.stringify(recordedClick)}`);
    }
    console.log(`✓ Clique registrado com sucesso no banco (ID: ${recordedClick.id}).`);

    // Verify DB count
    const totalClicksWs1 = await prisma.affiliateClick.count({
      where: { workspaceId: ws1.id },
    });
    const totalClicksWs2 = await prisma.affiliateClick.count({
      where: { workspaceId: ws2.id },
    });
    if (totalClicksWs1 !== 1 || totalClicksWs2 !== 0) {
      throw new Error(`Contagem de cliques violou isolamento de tenant: ws1=${totalClicksWs1}, ws2=${totalClicksWs2}`);
    }
    console.log("✓ Isolamento multi-tenant de cliques validado.");

    // 6. API Route Execution (POST /api/affiliate/clicks)
    console.log("\n--- Check 6: Execução da Rota de API POST /api/affiliate/clicks ---");

    // 6.1 Valid JSON Request
    const ctaToken = ClickTrackingService.generateEventToken({
      workspaceId: ws1.id,
      articleId: article1.id,
      productId: prod1.id,
      offerId: offer1.id,
      component: "CTA",
    });

    const jsonReq = new Request("http://localhost:3000/api/affiliate/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: ctaToken }),
    });

    const jsonRes = await trackClickRoute(jsonReq);
    if (jsonRes.status !== 201) {
      const errBody = await jsonRes.json();
      throw new Error(`Rota falhou ao processar requisição JSON válida: ${JSON.stringify(errBody)}`);
    }
    const jsonResData = await jsonRes.json();
    console.log(`✓ Rota de API registrou clique via JSON com sucesso (ID: ${jsonResData.id}).`);

    // 6.2 Beacon / Plain Text Request
    const compToken = ClickTrackingService.generateEventToken({
      workspaceId: ws1.id,
      articleId: article1.id,
      productId: prod1.id,
      offerId: offer1.id,
      component: "COMPARISON_TABLE",
      position: 0,
    });

    const beaconReq = new Request("http://localhost:3000/api/affiliate/clicks", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ token: compToken }),
    });

    const beaconRes = await trackClickRoute(beaconReq);
    if (beaconRes.status !== 201) {
      const errBody = await beaconRes.json();
      throw new Error(`Rota falhou ao processar requisição beacon: ${JSON.stringify(errBody)}`);
    }
    console.log("✓ Rota de API registrou clique via payload Beacon text/plain com sucesso.");

    // 6.3 Rejection of Tampered Token via API
    const badReq = new Request("http://localhost:3000/api/affiliate/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tamperedToken }),
    });
    const badRes = await trackClickRoute(badReq);
    if (badRes.status !== 400) {
      throw new Error(`Esperava status 400 para token adulterado, recebeu ${badRes.status}`);
    }
    console.log("✓ Rota de API retornou status 400 para token com assinatura adulterada.");

    // 6.4 Rejection of Missing Token
    const emptyReq = new Request("http://localhost:3000/api/affiliate/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const emptyRes = await trackClickRoute(emptyReq);
    if (emptyRes.status !== 400) {
      throw new Error(`Esperava status 400 para payload vazio, recebeu ${emptyRes.status}`);
    }
    console.log("✓ Rota de API retornou status 400 para requisição sem token.");

    // Total clicks registered should now be 3
    const finalClicks = await prisma.affiliateClick.count({
      where: { workspaceId: ws1.id },
    });
    if (finalClicks !== 3) {
      throw new Error(`Esperava 3 cliques gravados, encontrou ${finalClicks}`);
    }
    console.log(`✓ Total de 3 cliques verificados no banco para o workspace.`);

    // 7. Cleanup
    await prisma.affiliateClick.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.product.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: { in: [WS_SLUG, WS2_SLUG] } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { in: [WS_SLUG, WS2_SLUG] } },
    });
    await prisma.planFeature.deleteMany({
      where: { plan: { slug: PLAN_SLUG } },
    });
    await prisma.plan.deleteMany({
      where: { slug: PLAN_SLUG },
    });

    console.log("\n========================================================");
    console.log("🎉 TODOS OS TESTES DA TASK 134 PASSARAM COM SUCESSO!");
    console.log("========================================================");
  } catch (err) {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  }
}

run();
