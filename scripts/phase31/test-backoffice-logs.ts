import "dotenv/config";
import { prisma } from "../../src/lib/prisma";

async function main() {
  console.log("🧪 Testando API e Filtros de Error Logs no Backoffice (Task 258)...");

  // 1. Garantir um workspace de teste
  const testWorkspace = await prisma.workspace.findFirst();
  if (!testWorkspace) {
    throw new Error("Nenhum workspace encontrado no banco para teste.");
  }

  // 2. Criar logs de teste com diferentes módulos e tenants
  const logTenant = await prisma.systemErrorLog.create({
    data: {
      workspaceId: testWorkspace.id,
      userEmail: "editor@tenant-teste.com",
      userName: "Editor Tenant",
      screen: "Publicação de Artigos",
      path: "/api/articles/123/publish",
      method: "POST",
      query: { articleId: "123", mode: "instant" },
      module: "WORDPRESS",
      errorMessage: "WordPress REST API 401 Unauthorized: Invalid application password",
      errorStack: "Error: WordPress REST API 401\n    at publishToWordPress (wordpress.ts:150)",
      statusCode: 401,
    },
  });

  const logGlobal = await prisma.systemErrorLog.create({
    data: {
      workspaceId: null,
      userEmail: "superadmin@teste.local",
      userName: "Super Admin",
      screen: "Configurações Globais",
      path: "/api/backoffice/plans",
      method: "PATCH",
      query: { planId: "pro", price: 99 },
      module: "BACKOFFICE",
      errorMessage: "Falha de validação cadastral de plano",
      errorStack: "Error: Falha de validação\n    at PlanManager (plan-manager.ts:40)",
      statusCode: 400,
    },
  });

  console.log("✓ Logs de teste criados no banco. IDs:", logTenant.id, logGlobal.id);

  // 3. Testar filtro por Tenant
  const logsFilteredTenant = await prisma.systemErrorLog.findMany({
    where: { workspaceId: testWorkspace.id },
  });
  const hasTenantLog = logsFilteredTenant.some((l) => l.id === logTenant.id);
  const hasGlobalLog = logsFilteredTenant.some((l) => l.id === logGlobal.id);
  if (!hasTenantLog || hasGlobalLog) {
    throw new Error("Filtro por Tenant falhou: retornou registros incorretos.");
  }
  console.log("✓ Filtro por Tenant aprovado.");

  // 4. Testar filtro por Módulo
  const logsFilteredModule = await prisma.systemErrorLog.findMany({
    where: { module: "WORDPRESS" },
  });
  if (!logsFilteredModule.some((l) => l.id === logTenant.id)) {
    throw new Error("Filtro por Módulo falhou.");
  }
  console.log("✓ Filtro por Módulo aprovado.");

  // 5. Testar busca textual por mensagem ou e-mail
  const logsSearch = await prisma.systemErrorLog.findMany({
    where: {
      OR: [
        { errorMessage: { contains: "application password", mode: "insensitive" } },
        { userEmail: { contains: "editor@tenant-teste.com", mode: "insensitive" } },
      ],
    },
  });
  if (logsSearch.length === 0 || !logsSearch.some((l) => l.id === logTenant.id)) {
    throw new Error("Busca textual falhou.");
  }
  console.log("✓ Busca textual aprovada.");

  // 6. Limpeza
  await prisma.systemErrorLog.deleteMany({
    where: { id: { in: [logTenant.id, logGlobal.id] } },
  });
  console.log("✓ Logs de teste removidos do banco.");

  console.log("🎉 Teste Task 258 PASSOU com 100% de sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Falha no teste Task 258:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
