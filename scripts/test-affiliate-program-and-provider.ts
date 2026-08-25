import { prisma } from "@/lib/prisma";
import {
  ensureDefaultAffiliatePrograms,
  AffiliateProviderFactory,
  MercadoLivreAffiliateProvider,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 101 - Affiliate Program & Provider ===");

  try {
    // 1. Model & Seed
    console.log("\n--- Check 1: AffiliateProgram Model & Seed ---");
    await ensureDefaultAffiliatePrograms();
    await ensureDefaultAffiliatePrograms(); // Idempotency check

    const meliProgram = await prisma.affiliateProgram.findUnique({
      where: { code: "MERCADO_LIVRE" },
    });

    if (!meliProgram) {
      throw new Error("FAIL: AffiliateProgram 'MERCADO_LIVRE' não foi criado pelo seed.");
    }
    if (meliProgram.providerType !== "MERCADO_LIVRE" || !meliProgram.active) {
      throw new Error("FAIL: Propriedades incorretas no AffiliateProgram seedado.");
    }
    console.log("✓ Check 1 PASS: AffiliateProgram 'MERCADO_LIVRE' seedado e idempotente no banco.");

    // 2. Factory & Provider Instance
    console.log("\n--- Check 2: Factory & Registry ---");
    const providerUpper = AffiliateProviderFactory.getProvider("MERCADO_LIVRE");
    const providerLower = AffiliateProviderFactory.getProvider("mercado_livre");

    if (!providerUpper || !(providerUpper instanceof MercadoLivreAffiliateProvider)) {
      throw new Error("FAIL: Factory não retornou instância de MercadoLivreAffiliateProvider.");
    }
    if (providerUpper.code !== providerLower.code) {
      throw new Error("FAIL: Factory falhou na resolução case-insensitive.");
    }

    let invalidThrew = false;
    try {
      AffiliateProviderFactory.getProvider("AMAZON_INEXISTENTE");
    } catch {
      invalidThrew = true;
    }
    if (!invalidThrew) {
      throw new Error("FAIL: Factory não lançou erro para provedor desconhecido.");
    }
    console.log("✓ Check 2 PASS: AffiliateProviderFactory retornou provider esperado e tratou erros.");

    // 3. Capabilities
    console.log("\n--- Check 3: Capabilities ---");
    const caps = providerUpper.capabilities();
    if (caps.automaticAffiliateLinkGeneration !== false) {
      throw new Error("FAIL: automaticAffiliateLinkGeneration deve ser false para Mercado Livre.");
    }
    if (caps.affiliateLinkImport !== true) {
      throw new Error("FAIL: affiliateLinkImport deve ser true para Mercado Livre.");
    }
    if (caps.productMetadataImport !== true) {
      throw new Error("FAIL: productMetadataImport deve ser true para Mercado Livre.");
    }
    if (caps.supportsTrackingLabel !== true) {
      throw new Error("FAIL: supportsTrackingLabel deve ser true para Mercado Livre.");
    }
    console.log("✓ Check 3 PASS: Capabilities do Mercado Livre validadas conforme especificação.");

    // 4. URL Validation & Resolution
    console.log("\n--- Check 4: Validação e Resolução de URL ---");
    const validMeliUrl = "https://produto.mercadolivre.com.br/MLB-123456789-fone-bluetooth-_JM";
    const validResult = await providerUpper.validateAffiliateUrl(validMeliUrl);
    if (!validResult.valid || !validResult.normalizedUrl) {
      throw new Error(`FAIL: Validação de URL válida falhou: ${validResult.error}`);
    }

    const invalidHostUrl = "https://fake-phishing-site.com/MLB-123456";
    const invalidResult = await providerUpper.validateAffiliateUrl(invalidHostUrl);
    if (invalidResult.valid) {
      throw new Error("FAIL: Validação aceitou host não autorizado.");
    }

    const malformedResult = await providerUpper.validateAffiliateUrl("not-a-url");
    if (malformedResult.valid) {
      throw new Error("FAIL: Validação aceitou string malformada.");
    }

    const resolved = await providerUpper.resolveAffiliateUrl(validMeliUrl);
    if (resolved.externalProductId !== "MLB123456789") {
      throw new Error(`FAIL: externalProductId incorreto: ${resolved.externalProductId}`);
    }
    if (resolved.provider !== "MERCADO_LIVRE") {
      throw new Error(`FAIL: provider incorreto: ${resolved.provider}`);
    }
    console.log("✓ Check 4 PASS: Validação e extração de externalProductId funcionando.");

    // 5. Metadata Fetch Contract
    console.log("\n--- Check 5: Fetch Product Metadata Contract ---");
    const meta = await providerUpper.fetchProductMetadata({ affiliateUrl: validMeliUrl });
    if (!meta.status || meta.externalProductId !== "MLB123456789") {
      throw new Error(`FAIL: Retorno do fetchProductMetadata inválido: ${JSON.stringify(meta)}`);
    }
    console.log("✓ Check 5 PASS: Contrato fetchProductMetadata validado com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 101 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 101:", error);
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
