import { prisma } from "@/lib/prisma";
import { ProductReviewGenerator } from "@/lib/affiliate/generators/review-generator";
import { CanonicalDocumentService } from "@/lib/affiliate/canonical-document";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";
import { AIProvider } from "@/lib/ai/types";

async function run() {
  console.log("=== TEST: Task 167 - Affiliate Generation & Preview ===");

  const timestamp = Date.now();
  const testEmail = `tenant-167-${timestamp}@example.com`;
  const workspaceSlug = `ws-167-${timestamp}`;
  const planSlug = `plan-167-${timestamp}`;

  try {
    await ensureDefaultAffiliatePrograms();
    const { AffiliatePromptTemplateService } = await import("@/lib/affiliate/prompt-template-service");
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. Setup Workspace, Entitlements, Enriched Product with Reviews & Reference Sources
    console.log("\n--- Check 1: Setup de Produto Enriquecido (Reviews + Fontes Externas) ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 167" },
    });

    const plan = await prisma.plan.create({
      data: {
        name: "Plan Affiliate 167",
        slug: planSlug,
        maxArticles: 100,
        maxDailyArticles: 20,
        maxSources: 5,
        maxWordPressSites: 2,
      },
    });

    const affiliateFeature = await prisma.feature.findUniqueOrThrow({
      where: { key: "affiliate_module" },
    });
    await prisma.planFeature.create({
      data: {
        planId: plan.id,
        featureId: affiliateFeature.id,
        enabled: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 167 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
        subscription: {
          create: { planId: plan.id, status: "ACTIVE" },
        },
      },
    });

    const mlProgram = await prisma.affiliateProgram.findUniqueOrThrow({
      where: { code: "MERCADO_LIVRE" },
    });

    const product = await prisma.product.create({
      data: {
        workspaceId: workspace.id,
        name: "Monitor Gamer Dell 27 165Hz IPS",
        brand: "Dell",
        slug: `monitor-dell-27-${timestamp}`,
        description: "Monitor gamer com painel Fast IPS QHD de 27 polegadas e 1ms GtG.",
        rating: 4.9,
        pros: ["Excelente fidelidade de cores", "Suporte ergonômico completo", "165Hz fluido"],
        cons: ["Preço elevado"],
        offers: {
          create: {
            workspaceId: workspace.id,
            affiliateProgramId: mlProgram.id,
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16701-dell",
            price: 2199.0,
            seller: "Dell Loja Oficial",
            status: "ACTIVE",
          },
        },
        reviewSamples: {
          create: [
            {
              workspaceId: workspace.id,
              provider: "MERCADO_LIVRE",
              text: "Cores fantásticas para edição e jogos. Não cansa a vista.",
              rating: 5,
            },
          ],
        },
        referenceSources: {
          create: [
            {
              workspaceId: workspace.id,
              url: "https://techreviews.example.com/dell-27-qhd",
              title: "TechReview Lab Análise",
              summary: "Medição de contraste 1000:1 e 99% sRGB confirmados em laboratório.",
              status: "READY",
            },
          ],
        },
      },
    });

    console.log("✓ Check 1 PASS: Produto cadastrado com reviews e fontes externas de referência.");

    // 2. Generate Review with Mock AI Provider
    console.log("\n--- Check 2: Geração de Artigo Canônico e Metadados SEO ---");
    let capturedDescription = "";
    const mockAiProvider: AIProvider = {
      name: "Mock AI Provider",
      model: "mock-v1",
      async testConnection() {
        return { connected: true, provider: "mock", model: "mock-v1" };
      },
      async generateArticle(input) {
        capturedDescription = input.originalDescription || "";
        return {
          relevant: true,
          score: 9.8,
          title: "Review Monitor Gamer Dell 27 165Hz: Vale o Investimento?",
          summary: "Análise técnica completa do monitor Dell QHD Fast IPS para entusiastas e profissionais.",
          content: "<p>O Monitor Dell 27 entrega alta performance visual para jogos e produtividade.</p>",
          suggestedCategoryId: null,
          tags: ["Monitores", "Dell", "Gamer", "IPS"],
          seoFocusKeyword: "monitor gamer dell 27 165hz",
          seoTitle: "Review Monitor Gamer Dell 27 165Hz IPS QHD - Testes e Veredito",
          seoDescription: "Confira nossa análise aprofundada do monitor Dell 27 com painel Fast IPS 165Hz.",
        };
      },
    };

    const genResult = await ProductReviewGenerator.generate({
      workspaceId: workspace.id,
      productId: product.id,
      focusKeyword: "monitor gamer dell 27 165hz",
      customInstructions: "Destaque a cobertura de cores para trabalho híbrido.",
      aiProvider: mockAiProvider,
    });

    if (!genResult.article.id || !genResult.canonicalDocument) {
      throw new Error("FAIL Check 2: Artigo ou documento canônico não gerado!");
    }

    // Verify that qualitative reviews and reference summaries were injected into the AI prompt
    if (!capturedDescription.includes("Cores fantásticas") || !capturedDescription.includes("TechReview Lab")) {
      throw new Error("FAIL Check 2: Prompt da IA não recebeu as amostras de review ou resumos de referência!");
    }
    console.log("✓ Check 2 PASS: Grounding validado no prompt da IA com reviews e fontes externas.");

    // 3. Validate Canonical Structure & No Hallucinated Links
    console.log("\n--- Check 3: Validação de Blocos Canônicos e Links Anti-Alucinação ---");
    const doc = genResult.canonicalDocument;
    const blockTypes = doc.blocks.map((b) => b.type);
    if (!blockTypes.includes("AFFILIATE_DISCLOSURE") || !blockTypes.includes("PRODUCT_CARD") || !blockTypes.includes("PROS_CONS")) {
      throw new Error("FAIL Check 3: Blocos canônicos obrigatórios ausentes!");
    }

    const referencedIds = CanonicalDocumentService.extractReferencedProductIds(doc);
    if (referencedIds.length !== 1 || referencedIds[0] !== product.id) {
      throw new Error("FAIL Check 3: Anti-alucinação violada: IDs desconhecidos ou inválidos no documento!");
    }

    // 4. Validate Preview / HTML Rendering (Links injected by renderer)
    console.log("\n--- Check 4: Renderização da Prévia HTML com Links Oficiais ---");
    const renderedHtml = CanonicalDocumentService.renderToHtml(doc, [
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        offers: [
          {
            id: "off-1",
            affiliateUrl: "https://produto.mercadolivre.com.br/MLB-16701-dell",
            price: 2199.0,
            seller: "Dell Loja Oficial",
            status: "ACTIVE",
          },
        ],
      },
    ]);

    if (!renderedHtml.includes("MLB-16701-dell") || !renderedHtml.includes('rel="sponsored nofollow"')) {
      throw new Error("FAIL Check 4: Renderizador HTML falhou ao injetar link de afiliado oficial do banco!");
    }
    console.log("✓ Check 4 PASS: Documento canônico renderizado para HTML com links oficiais e disclosure.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.articleProduct.deleteMany({ where: { articleId: genResult.article.id } });
    await prisma.article.deleteMany({ where: { id: genResult.article.id } });
    await prisma.productReviewSample.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.productReferenceSource.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.productOffer.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 167 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 167:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
