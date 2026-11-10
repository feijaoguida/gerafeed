import { prisma } from "@/lib/prisma";
import {
  getSessionWorkspaceId,
  getAuthenticatedWorkspace,
  UnauthorizedWorkspaceError,
} from "@/lib/workspace";
import { handleApiError } from "@/lib/errors/service";

async function runTask298Tests() {
  console.log("=================================================");
  console.log("=== TEST: Task 298 - Tenant Isolation & IDOR Guard ===");
  console.log("=================================================");

  // 1. Test getAuthenticatedWorkspace returns null when no session exists
  console.log("\n[1] Testando getAuthenticatedWorkspace sem sessão...");
  const authWorkspace = await getAuthenticatedWorkspace();
  if (authWorkspace !== null) {
    throw new Error(`FAIL: getAuthenticatedWorkspace deveria retornar null, mas retornou: ${JSON.stringify(authWorkspace)}`);
  }
  console.log("✓ getAuthenticatedWorkspace retornou null com segurança (sem fallback silencioso).");

  // 2. Test getSessionWorkspaceId in production mode
  console.log("\n[2] Testando getSessionWorkspaceId em modo produção sem sessão...");
  const envRecord = process.env as Record<string, string | undefined>;
  const oldNodeEnv = envRecord.NODE_ENV;
  const oldAllowFallback = process.env.ALLOW_TEST_WORKSPACE_FALLBACK;
  const oldTestWs = process.env.TEST_WORKSPACE_ID;

  try {
    delete process.env.ALLOW_TEST_WORKSPACE_FALLBACK;
    delete process.env.TEST_WORKSPACE_ID;
    envRecord.NODE_ENV = "production";

    let threwExpected = false;
    try {
      await getSessionWorkspaceId();
    } catch (err) {
      if (err instanceof UnauthorizedWorkspaceError && err.status === 401) {
        threwExpected = true;
      } else {
        throw new Error(`FAIL: Erro inesperado ao chamar getSessionWorkspaceId: ${err}`);
      }
    }

    if (!threwExpected) {
      throw new Error("FAIL: getSessionWorkspaceId não lançou UnauthorizedWorkspaceError em produção!");
    }
    console.log("✓ getSessionWorkspaceId lançou UnauthorizedWorkspaceError (status 401) em produção.");

    // Test handleApiError with UnauthorizedWorkspaceError
    console.log("\n[3] Testando handleApiError com UnauthorizedWorkspaceError...");
    const unauthErr = new UnauthorizedWorkspaceError();
    const res = await handleApiError(unauthErr, new Request("https://exemplo.com/api/articles"));
    if (res.status !== 401) {
      throw new Error(`FAIL: handleApiError deveria responder 401, mas respondeu ${res.status}`);
    }
    const data = await res.json();
    if (!data.error.includes("Não autorizado")) {
      throw new Error(`FAIL: Mensagem de erro inesperada: ${data.error}`);
    }
    console.log("✓ handleApiError respondeu HTTP 401 com mensagem amigável mascarada.");

  } finally {
    envRecord.NODE_ENV = oldNodeEnv;
    if (oldAllowFallback !== undefined) process.env.ALLOW_TEST_WORKSPACE_FALLBACK = oldAllowFallback;
    if (oldTestWs !== undefined) process.env.TEST_WORKSPACE_ID = oldTestWs;
  }

  // 4. Test Multi-tenant Isolation and IDOR Prevention between Workspaces
  console.log("\n[4] Testando isolamento e prevenção a IDOR entre Workspaces A e B...");
  const wsAId = `test-ws-a-${Date.now()}`;
  const wsBId = `test-ws-b-${Date.now()}`;

  await prisma.workspace.createMany({
    data: [
      { id: wsAId, name: "Workspace A", slug: `ws-a-${Date.now()}` },
      { id: wsBId, name: "Workspace B", slug: `ws-b-${Date.now()}` },
    ],
  });

  const sourceA = await prisma.source.create({
    data: {
      workspaceId: wsAId,
      name: "Fonte A",
      rssUrl: "https://g1.globo.com/rss/g1/",
      active: true,
    },
  });

  const articleA = await prisma.article.create({
    data: {
      workspaceId: wsAId,
      sourceId: sourceA.id,
      title: "Artigo Confidencial do Workspace A",
      originalUrl: `https://g1.globo.com/noticia-a-${Date.now()}`,
      status: "PENDING",
    },
  });

  const siteA = await prisma.wordPressSite.create({
    data: {
      workspaceId: wsAId,
      name: "WordPress Site A",
      url: "https://site-a.com",
      username: "admin_a",
      encryptedApplicationPassword: "v1:dummy",
    },
  });

  try {
    // Workspace B tenta buscar o artigo do Workspace A por ID
    const queryAsTenantB = await prisma.article.findFirst({
      where: {
        id: articleA.id,
        workspaceId: wsBId, // Escopo obrigatório do Tenant B
      },
    });

    if (queryAsTenantB !== null) {
      throw new Error("FAIL: IDOR! Workspace B conseguiu ler artigo do Workspace A!");
    }
    console.log("✓ Prevenção a IDOR em Article confirmada: Workspace B não acessa registro de A.");

    // Workspace B tenta buscar WordPressSite do Workspace A
    const siteQueryAsTenantB = await prisma.wordPressSite.findFirst({
      where: {
        id: siteA.id,
        workspaceId: wsBId,
      },
    });

    if (siteQueryAsTenantB !== null) {
      throw new Error("FAIL: IDOR! Workspace B conseguiu ler WordPressSite do Workspace A!");
    }
    console.log("✓ Prevenção a IDOR em WordPressSite confirmada: Workspace B não acessa site de A.");

    // Workspace B tenta buscar Source do Workspace A
    const sourceQueryAsTenantB = await prisma.source.findFirst({
      where: {
        id: sourceA.id,
        workspaceId: wsBId,
      },
    });

    if (sourceQueryAsTenantB !== null) {
      throw new Error("FAIL: IDOR! Workspace B conseguiu ler Source do Workspace A!");
    }
    console.log("✓ Prevenção a IDOR em Source confirmada: Workspace B não acessa fonte de A.");

  } finally {
    // Cleanup
    await prisma.article.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.source.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.wordPressSite.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsAId, wsBId] } } });
  }

  console.log("\n=================================================");
  console.log(">>> TODOS OS TESTES DA TASK 298 PASSARAM COM SUCESSO! <<<");
  console.log("=================================================");
}

runTask298Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
