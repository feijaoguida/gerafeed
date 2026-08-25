import { prisma } from "@/lib/prisma";
import {
  BillingService,
  AFFILIATE_FEATURES,
} from "@/lib/billing";
import {
  AffiliateService,
  ensureDefaultAffiliatePrograms,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 105 - Affiliate Import Preview & Confirm ===");

  const WS_SLUG = "test-ws-affiliate-import-flow";
  const PLAN_SLUG = "test-plan-affiliate-importer";

  try {
    // 0. Seed programs & cleanup
    await ensureDefaultAffiliatePrograms();

    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.product.deleteMany({
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

    // 1. Setup Features & Plan with Limit = 2 products
    console.log("\n--- Check 1: Configuração de Entitlements e Limites ---");
    await BillingService.ensureDefaultFeatures();
    const featModule = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MODULE } });
    const featMaxProducts = await prisma.feature.findUniqueOrThrow({ where: { key: AFFILIATE_FEATURES.MAX_PRODUCTS } });

    const plan = await prisma.plan.create({
      data: {
        name: "Plano Teste Importador",
        slug: PLAN_SLUG,
        price: 99.0,
        planFeatures: {
          create: [
            { featureId: featModule.id, enabled: true },
            { featureId: featMaxProducts.id, enabled: true, limit: 2 }, // Max 2 products
          ],
        },
      },
    });

    const ws = await prisma.workspace.create({
      data: { name: "Workspace Import Test", slug: WS_SLUG },
    });

    await prisma.subscription.create({
      data: {
        workspaceId: ws.id,
        planId: plan.id,
        status: "ACTIVE",
      },
    });
    console.log("✓ Check 1 PASS: Workspace configurado com plano de limite = 2 produtos.");

    // 2. Preview Flow
    console.log("\n--- Check 2: Preview de Importação e Deduplicação Inicial ---");
    const testAffiliateUrl = "https://produto.mercadolivre.com.br/MLB-777666555-smartwatch-fitness";
    const preview1 = await AffiliateService.previewImport(ws.id, {
      affiliateUrl: testAffiliateUrl,
    });

    if (!preview1.metadata || preview1.isDuplicate !== false) {
      throw new Error("FAIL: Preview inicial deve retornar isDuplicate = false.");
    }
    if (preview1.metadata.externalProductId !== "MLB777666555") {
      throw new Error(`FAIL: externalProductId incorreto no preview: ${preview1.metadata.externalProductId}`);
    }
    console.log("✓ Check 2 PASS: Preview gerado com sucesso e marcado como não duplicado.");

    // 3. Confirm Flow & Transaction Persistence
    console.log("\n--- Check 3: Confirmação e Persistência Atômica em Transação ---");
    const confirmResult1 = await AffiliateService.confirmImport(ws.id, {
      affiliateUrl: testAffiliateUrl,
      resolvedUrl: preview1.metadata.resolvedUrl,
      externalProductId: preview1.metadata.externalProductId,
      name: "Smartwatch Fitness Pro 2026",
      brand: "FitTech",
      description: "Relógio com monitor cardíaco e GPS.",
      imageUrl: "https://http2.mlstatic.com/smartwatch.jpg",
      seller: "Loja Oficial FitTech",
      price: 199.9,
      oldPrice: 299.9,
      currency: "BRL",
      metadataSource: "PREVIEW_CONFIRMED",
    });

    if (!confirmResult1.product || !confirmResult1.offer) {
      throw new Error("FAIL: Produto ou oferta não retornados na confirmação.");
    }
    if (confirmResult1.product.name !== "Smartwatch Fitness Pro 2026") {
      throw new Error(`FAIL: Nome do produto incorreto: ${confirmResult1.product.name}`);
    }
    if (confirmResult1.offer.affiliateUrl !== testAffiliateUrl || confirmResult1.offer.price !== 199.9) {
      throw new Error(`FAIL: Dados da oferta incorretos na confirmação.`);
    }

    const savedProduct = await prisma.product.findUnique({
      where: { id: confirmResult1.product.id },
      include: { offers: true },
    });
    if (!savedProduct || savedProduct.offers.length !== 1) {
      throw new Error("FAIL: Produto ou oferta não persistidos no banco.");
    }
    console.log("✓ Check 3 PASS: Produto e oferta persistidos atomicamente via transação.");

    // 4. Deduplication Check on Second Preview
    console.log("\n--- Check 4: Detecção de Duplicação no Segundo Preview ---");
    const preview2 = await AffiliateService.previewImport(ws.id, {
      affiliateUrl: testAffiliateUrl,
    });

    if (!preview2.isDuplicate || !preview2.existingProduct) {
      throw new Error("FAIL: Segundo preview não detectou duplicação existente!");
    }
    if (preview2.existingProduct.id !== confirmResult1.product.id) {
      throw new Error("FAIL: existingProduct ID não corresponde ao produto cadastrado.");
    }
    console.log("✓ Check 4 PASS: Deduplicação detectou produto existente perfeitamente.");

    // 5. Update / Overwrite Flow
    console.log("\n--- Check 5: Atualização / Overwrite do Produto Existente ---");
    const updateResult = await AffiliateService.confirmImport(ws.id, {
      affiliateUrl: testAffiliateUrl,
      externalProductId: "MLB777666555",
      name: "Smartwatch Fitness Pro 2026 - Edição Atualizada",
      price: 179.9, // Price drop
      overwriteExistingProductId: confirmResult1.product.id,
    });

    if (updateResult.product.id !== confirmResult1.product.id) {
      throw new Error("FAIL: Overwrite criou um novo produto em vez de atualizar o existente.");
    }
    if (updateResult.product.name !== "Smartwatch Fitness Pro 2026 - Edição Atualizada") {
      throw new Error("FAIL: Nome não foi atualizado no overwrite.");
    }
    if (updateResult.offer.price !== 179.9) {
      throw new Error("FAIL: Preço da oferta não foi atualizado no overwrite.");
    }

    const totalProductsCount = await prisma.product.count({ where: { workspaceId: ws.id } });
    if (totalProductsCount !== 1) {
      throw new Error(`FAIL: Contagem de produtos deve ser 1 após overwrite, obtido: ${totalProductsCount}`);
    }
    console.log("✓ Check 5 PASS: Atualização de produto existente validada sem duplicação de registros.");

    // 6. Quantity Limits Enforcement
    console.log("\n--- Check 6: Limite Quantitativo de Produtos do Plano ---");
    // Add 2nd product (reaches limit of 2)
    await AffiliateService.confirmImport(ws.id, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-222333444-segundo-produto",
      externalProductId: "MLB222333444",
      name: "Segundo Produto Teste",
      price: 50.0,
    });

    // Attempt 3rd product (must fail due to limit = 2)
    let limitBlocked = false;
    try {
      await AffiliateService.confirmImport(ws.id, {
        affiliateUrl: "https://produto.mercadolivre.com.br/MLB-999888777-terceiro-produto",
        externalProductId: "MLB999888777",
        name: "Terceiro Produto Excedente",
        price: 80.0,
      });
    } catch (e: unknown) {
      limitBlocked = true;
      if (e instanceof Error) {
        console.log(`  Mensagem esperada de limite capturada: "${e.message}"`);
      }
    }
    if (!limitBlocked) {
      throw new Error("FAIL: confirmImport não bloqueou criação de produto acima do limite do plano!");
    }
    console.log("✓ Check 6 PASS: Limite quantitativo de produtos aplicado e bloqueado com sucesso.");

    // 7. Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.productOffer.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.product.deleteMany({
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
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 105 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 105:", error);
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
