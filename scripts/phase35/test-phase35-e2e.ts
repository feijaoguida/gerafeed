import assert from "node:assert/strict";
import sharp from "sharp";
import { prisma } from "../../src/lib/prisma";
import {
  COMPLETION_LEVEL_DEFINITIONS,
  VALID_COMPLETION_LEVELS,
  CompletionLevel,
  buildManualArticlePrompts,
  isValidCompletionLevel,
} from "../../src/lib/ai/manual-prompts";
import { buildArticlePrompts } from "../../src/lib/ai/types";
import {
  validateAndOptimizeUploadedImage,
  processAndStoreImage,
  buildInlineImageHtml,
  distributeImagesInHtmlContent,
} from "../../src/lib/imageProcessor";
import { formatRawTextToHtmlParagraphs } from "../../src/app/api/articles/manual/route";
import { replaceInlineDataUriImagesWithWordPressMedia } from "../../src/lib/wordpress";
import { ArticlePersistenceService } from "../../src/lib/affiliate/article-persistence-service";

async function run() {
  console.log("=== Phase 35 E2E Verification Suite ===");

  // 1. Validate 4 CompletionLevel contracts & prompts
  console.log("1. Testing 4 CompletionLevel definitions and prompt builders...");
  assert.equal(VALID_COMPLETION_LEVELS.length, 4);
  const expectedLevels: Array<{ key: CompletionLevel; label: string }> = [
    { key: "FORMAT_ONLY", label: "Formatar" },
    { key: "LIGHT", label: "Leve" },
    { key: "MEDIUM", label: "Média" },
    { key: "LARGE", label: "Grande" },
  ];

  for (const expected of expectedLevels) {
    assert.equal(isValidCompletionLevel(expected.key), true);
    const found = COMPLETION_LEVEL_DEFINITIONS[expected.key];
    assert.ok(found, `Missing definition for ${expected.key}`);
    assert.equal(found.label, expected.label);
  }
  assert.equal(isValidCompletionLevel("INVALID_LEVEL"), false);
  assert.equal(isValidCompletionLevel(null), false);

  const sampleInput = {
    originalTitle: "Entrevista exclusiva sobre energia solar no Brasil",
    originalContent:
      "Pergunta: Como está o mercado solar em 2026?\nResposta: Cresceu 35% no primeiro semestre.\nNota da pauta: destacar geração distribuída e novos investimentos no Nordeste.",
    categories: [
      { id: "cat-energia", name: "Energia", slug: "energia" },
      { id: "cat-economia", name: "Economia", slug: "economia" },
    ],
    promptSettings: {
      portalArea: "Energia e Sustentabilidade",
      customPortalArea: "",
      writingStyles: ["Jornalístico", "Analítico"],
      customWritingStyle: "",
    },
  };

  const formatPrompts = buildArticlePrompts({
    ...sampleInput,
    completionLevel: "FORMAT_ONLY",
  });
  assert.ok(
    formatPrompts.systemPrompt.includes("MODO SELECIONADO PELO AUTOR: FORMATAR"),
    "FORMAT_ONLY system prompt must identify FORMAT_ONLY mode"
  );
  assert.ok(
    formatPrompts.systemPrompt.includes(
      "NÃO FAÇA NENHUMA ALTERAÇÃO NO TEXTO DO CORPO DA MATÉRIA"
    ),
    "FORMAT_ONLY system prompt must forbid text alterations"
  );

  const lightPrompts = buildArticlePrompts({
    ...sampleInput,
    completionLevel: "LIGHT",
  });
  assert.ok(
    lightPrompts.systemPrompt.includes("MODO SELECIONADO PELO AUTOR: COMPLEMENTO LEVE"),
    "LIGHT system prompt must identify LIGHT mode"
  );
  assert.ok(
    lightPrompts.systemPrompt.includes("PODE INSERIR PEQUENOS TRECHOS"),
    "LIGHT system prompt must mention small excerpts"
  );

  const mediumPrompts = buildArticlePrompts({
    ...sampleInput,
    completionLevel: "MEDIUM",
  });
  assert.ok(
    mediumPrompts.systemPrompt.includes("MODO SELECIONADO PELO AUTOR: COMPLEMENTO MÉDIO"),
    "MEDIUM system prompt must identify MEDIUM mode"
  );
  assert.ok(
    mediumPrompts.systemPrompt.includes("PODE INSERIR TRECHOS CRIADOS PELA IA"),
    "MEDIUM system prompt must mention AI-created excerpts"
  );

  const largePrompts = buildManualArticlePrompts({
    level: "LARGE",
    titleHint: sampleInput.originalTitle,
    rawText: sampleInput.originalContent,
    categories: sampleInput.categories,
    promptSettings: sampleInput.promptSettings,
  });
  assert.ok(
    largePrompts.systemPrompt.includes("MODO SELECIONADO PELO AUTOR: COMPLEMENTO GRANDE"),
    "LARGE system prompt must identify LARGE mode"
  );
  assert.ok(
    largePrompts.systemPrompt.includes("INSERIR GRANDES PARTES DE TRECHOS CRIADOS PELA IA"),
    "LARGE system prompt must mention large AI-created sections"
  );
  console.log("   [PASS] 4 CompletionLevel definitions & prompt builders verified.");

  // 2. Validate Image Upload & Sharp Processing
  console.log("2. Testing image upload validation, magic bytes check & Sharp processing...");
  const testPngBuffer = await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 3,
      background: { r: 24, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();

  const uploadResult = await validateAndOptimizeUploadedImage(testPngBuffer, {
    generateModified: true,
    maxWidth: 1200,
  });
  assert.ok(uploadResult.imageUrl.startsWith("data:image/jpeg;base64,"));
  assert.ok(uploadResult.modifiedImageUrl?.startsWith("data:image/jpeg;base64,"));
  assert.equal(uploadResult.width, 400);
  assert.equal(uploadResult.height, 300);
  assert.equal(uploadResult.format, "jpeg");

  // Reject invalid magic bytes
  await assert.rejects(
    async () => {
      await validateAndOptimizeUploadedImage(Buffer.from("not-a-valid-image-payload"));
    },
    /Arquivo inválido|Formato de imagem/i
  );

  // Reject empty buffer
  await assert.rejects(
    async () => {
      await validateAndOptimizeUploadedImage(Buffer.alloc(0));
    },
    /vazio/i
  );

  // Test processAndStoreImage with Data URI
  const storedDataUri = await processAndStoreImage(uploadResult.imageUrl, "phase35-e2e");
  assert.ok(
    storedDataUri && storedDataUri.startsWith("data:image/jpeg;base64,"),
    "processAndStoreImage should process Data URI inputs"
  );
  console.log("   [PASS] Image upload validation & Sharp Data URI pipeline verified.");

  // 3. Validate HTML formatting & inline image distribution
  console.log("3. Testing raw text formatting & inline image distribution...");
  const formattedHtml = formatRawTextToHtmlParagraphs(
    "Primeiro parágrafo de pauta.\n\nSegundo parágrafo com <script>alert(1)</script> seguro.\n\nTerceiro parágrafo final."
  );
  assert.ok(formattedHtml.includes("<p>Primeiro parágrafo de pauta.</p>"));
  assert.ok(!formattedHtml.includes("<script>"), "Must escape raw HTML tags in fallback formatter");

  const distributedHtml = distributeImagesInHtmlContent(formattedHtml, [
    { imageUrl: uploadResult.imageUrl, caption: 'Foto 1 <teste> & "aspas"' },
    { imageUrl: uploadResult.modifiedImageUrl!, caption: "Foto 2 da entrevista" },
  ]);
  assert.ok(distributedHtml.includes('<figure class="wp-block-image'));
  assert.ok(distributedHtml.includes("Foto 1 &lt;teste&gt; &amp; &quot;aspas&quot;"));
  assert.ok(distributedHtml.includes("Foto 2 da entrevista"));

  const singleFigure = buildInlineImageHtml(uploadResult.imageUrl, "Legenda da foto");
  assert.ok(singleFigure.includes("<figcaption>Legenda da foto</figcaption>"));
  console.log("   [PASS] Raw text formatting & inline image distribution verified.");

  // 4. Validate WordPress inline Data URI media replacement
  console.log("4. Testing WordPress inline Data URI image upload replacement...");
  const originalFetch = global.fetch;
  let wpMediaUploadCalls = 0;
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    if (urlStr.includes("/wp-json/wp/v2/media")) {
      wpMediaUploadCalls += 1;
      return new Response(
        JSON.stringify({
          id: 900 + wpMediaUploadCalls,
          source_url: `https://wp.example.com/wp-content/uploads/2026/11/inline-${wpMediaUploadCalls}.jpg`,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
    return originalFetch(input, init);
  };

  try {
    const replacedHtml = await replaceInlineDataUriImagesWithWordPressMedia(
      {
        url: "https://wp.example.com",
        username: "editor",
        applicationPassword: "app-password",
      },
      distributedHtml,
      "phase35-article-e2e"
    );
    assert.equal(
      wpMediaUploadCalls,
      2,
      "Both inline Data URI images must be uploaded to WP media"
    );
    assert.ok(
      replacedHtml.includes(
        "https://wp.example.com/wp-content/uploads/2026/11/inline-1.jpg"
      ),
      "First inline Data URI must be replaced with WordPress hosted URL"
    );
    assert.ok(
      replacedHtml.includes(
        "https://wp.example.com/wp-content/uploads/2026/11/inline-2.jpg"
      ),
      "Second inline Data URI must be replaced with WordPress hosted URL"
    );
    assert.ok(
      !replacedHtml.includes("data:image/jpeg;base64,"),
      "No raw Data URI should remain in published HTML after WP media upload"
    );
  } finally {
    global.fetch = originalFetch;
  }
  console.log("   [PASS] WordPress inline Data URI media upload & URL replacement verified.");

  // 5. Validate Database creation & update of Manual Articles (with originalUrl: null)
  console.log("5. Testing Database persistence for manual articles (multiple null originalUrl)...");
  let testWorkspaceId: string | null = null;
  let createdWorkspace = false;
  const createdArticleIds: string[] = [];

  try {
    const existingWorkspace = await prisma.workspace.findFirst({
      select: { id: true },
    });

    if (existingWorkspace) {
      testWorkspaceId = existingWorkspace.id;
    } else {
      const ws = await prisma.workspace.create({
        data: {
          name: "Phase 35 Test Workspace",
          slug: `phase35-test-${Date.now()}`,
        },
      });
      testWorkspaceId = ws.id;
      createdWorkspace = true;
    }

    const article1 = await prisma.article.create({
      data: {
        workspaceId: testWorkspaceId,
        sourceId: null,
        originalUrl: null,
        originalTitle: "Pauta Manual 1",
        originalContent: "Texto base da pauta 1",
        title: "Matéria Manual 1 Formatada",
        content: distributedHtml,
        summary: "Resumo da matéria 1",
        status: "PENDING",
        originalImageUrl: uploadResult.imageUrl,
        modifiedImageUrl: uploadResult.modifiedImageUrl,
        selectedImage: "ORIGINAL",
      },
    });
    createdArticleIds.push(article1.id);

    const article2 = await prisma.article.create({
      data: {
        workspaceId: testWorkspaceId,
        sourceId: null,
        originalUrl: null,
        originalTitle: "Pauta Manual 2 (Entrevista)",
        originalContent: "Texto base da pauta 2",
        title: "Matéria Manual 2 Complemento Grande",
        content: "<p>Conteúdo expandido pela IA.</p>",
        summary: "Resumo da matéria 2",
        status: "PENDING",
        generatedImageUrl: uploadResult.imageUrl,
        selectedImage: "AI_GENERATED",
      },
    });
    createdArticleIds.push(article2.id);

    // Update via ArticlePersistenceService with new image fields
    const updated = await ArticlePersistenceService.validateAndSaveArticle(
      testWorkspaceId,
      article1.id,
      {
        generatedImageUrl: uploadResult.imageUrl,
        selectedImage: "AI_GENERATED",
        imagePrompt: "Editorial photo of solar panels in Brazil",
      }
    );
    assert.equal(updated.selectedImage, "AI_GENERATED");
    assert.equal(updated.imagePrompt, "Editorial photo of solar panels in Brazil");
    assert.ok(updated.generatedImageUrl?.startsWith("data:image/jpeg;base64,"));
  } finally {
    if (createdArticleIds.length > 0) {
      await prisma.article.deleteMany({
        where: { id: { in: createdArticleIds } },
      });
    }
    if (createdWorkspace && testWorkspaceId) {
      await prisma.workspace.delete({
        where: { id: testWorkspaceId },
      });
    }
  }
  console.log("   [PASS] Database persistence for manual articles verified.");

  console.log("=== ALL PHASE 35 E2E TESTS PASSED ===");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Phase 35 E2E test failed:", err);
    process.exit(1);
  });
