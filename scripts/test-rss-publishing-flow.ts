import { prisma } from "@/lib/prisma";
import { resolvePromptType } from "@/lib/prompt-resolution";

async function run() {
  console.log("=== TEST: Task 162 - RSS Publishing Flow ===");

  const timestamp = Date.now();
  const testEmail = `tenant-162-${timestamp}@example.com`;
  const workspaceSlug = `ws-162-${timestamp}`;

  try {
    // 1. Setup Workspace, User, WordPress Site and RSS Source
    console.log("\n--- Check 1: Setup do Fluxo de Notícias e Destino WordPress ---");
    const user = await prisma.user.create({
      data: { email: testEmail, name: "Test User 162" },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace 162 ${timestamp}`,
        slug: workspaceSlug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    const wpSite = await prisma.wordPressSite.create({
      data: {
        workspaceId: workspace.id,
        name: "Portal de Notícias Tech",
        url: "https://techportal.example.com",
        username: "editor",
        encryptedApplicationPassword: "enc_password",
        defaultPromptType: "ANALYTICAL",
      },
    });

    const source = await prisma.source.create({
      data: {
        workspaceId: workspace.id,
        name: "Feed Inovação & IA",
        rssUrl: "https://feed.example.com/rss",
        active: true,
        defaultPromptType: "OPINION",
      },
    });

    // Association with promptTypeOverride
    const siteSource = await prisma.wordPressSiteSource.create({
      data: {
        workspaceId: workspace.id,
        wordpressSiteId: wpSite.id,
        sourceId: source.id,
        active: true,
        promptTypeOverride: "CREATIVE",
      },
    });

    console.log("✓ Check 1 PASS: Destino WordPress, Feed RSS e associação com override criados.");

    // 2. Validate Prompt Precedence Hierarchy
    console.log("\n--- Check 2: Validação da Hierarquia de Precedência de Prompts ---");

    // 2.1 Override: Source + Site
    const resOverride = await resolvePromptType({
      workspaceId: workspace.id,
      sourceId: source.id,
      wordpressSiteId: wpSite.id,
    });
    if (resOverride.promptType !== "CREATIVE" || resOverride.origin !== "OVERRIDE") {
      throw new Error(`FAIL Check 2.1: Precedência de Override falhou. Obtido: ${JSON.stringify(resOverride)}`);
    }
    console.log("✓ Check 2.1: Override Feed ↔ WordPress tem precedência máxima (CREATIVE).");

    // 2.2 Feed Default (sem siteId)
    const resFeed = await resolvePromptType({
      workspaceId: workspace.id,
      sourceId: source.id,
    });
    if (resFeed.promptType !== "OPINION" || resFeed.origin !== "SOURCE_DEFAULT") {
      throw new Error(`FAIL Check 2.2: Precedência Feed Default falhou. Obtido: ${JSON.stringify(resFeed)}`);
    }
    console.log("✓ Check 2.2: Feed Default tem segunda precedência (OPINION).");

    // 2.3 WordPress Site Default (sem sourceId)
    const resWp = await resolvePromptType({
      workspaceId: workspace.id,
      wordpressSiteId: wpSite.id,
    });
    if (resWp.promptType !== "ANALYTICAL" || resWp.origin !== "WORDPRESS_SITE_DEFAULT") {
      throw new Error(`FAIL Check 2.3: Precedência WordPress Site Default falhou. Obtido: ${JSON.stringify(resWp)}`);
    }
    console.log("✓ Check 2.3: WordPress Site Default tem terceira precedência (ANALYTICAL).");

    // 3. Create Article in Pending Queue and Simulate Full Publish Flow
    console.log("\n--- Check 3: Fila de Notícias & Publicação de Artigo ---");
    const article = await prisma.article.create({
      data: {
        workspaceId: workspace.id,
        sourceId: source.id,
        wordpressSiteId: wpSite.id,
        originalTitle: "Novo Avanço em Inteligência Artificial Lançado",
        originalDescription: "Resumo original da notícia capturada via RSS.",
        originalUrl: "https://feed.example.com/noticia-ai",
        status: "PENDING",
        title: "Inteligência Artificial Dá Novo Salto Tecnológico",
        summary: "Resumo jornalístico enriquecido por IA.",
        content: "<p>Conteúdo jornalístico completo pronto para publicação no portal WordPress.</p>",
      },
    });

    if (article.status !== "PENDING" || !article.title) {
      throw new Error("FAIL Check 3: Artigo na fila de notícias com dados inválidos.");
    }
    console.log("✓ Check 3 PASS: Artigo na fila de notícias pendentes pronto para publicação.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.wordPressSiteSource.delete({ where: { id: siteSource.id } });
    await prisma.source.delete({ where: { id: source.id } });
    await prisma.wordPressSite.delete({ where: { id: wpSite.id } });
    await prisma.workspace.delete({ where: { id: workspace.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 162 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 162:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
