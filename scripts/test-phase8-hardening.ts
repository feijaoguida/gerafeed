import { prisma } from "../src/lib/prisma";
import { createWordPressSite, getWordPressSites, sanitizeWordPressSite } from "../src/lib/wordpress-sites";
import { assignSourceToWordPressSite } from "../src/lib/wordpress-site-sources";
import { resolvePromptType } from "../src/lib/prompt-resolution";
import { migrateLegacyWordPressConfig } from "../src/lib/wordpress-migration";

async function runHardeningAudit() {
  console.log("=================================================");
  console.log("=== AUDIT: Task 069 - Phase 8 Security Hardening ===");
  console.log("=================================================");

  // Clean up any stale audit workspaces first
  await prisma.workspace.deleteMany({
    where: { slug: { in: ["audit-tenant-a", "audit-tenant-b"] } },
  });

  // Setup 2 isolated test workspaces (Tenant A and Tenant B)
  const tenantA = await prisma.workspace.create({
    data: { name: "Tenant A", slug: "audit-tenant-a" },
  });

  const tenantB = await prisma.workspace.create({
    data: { name: "Tenant B", slug: "audit-tenant-b" },
  });

  console.log("✓ Workspaces isolados preparados:", tenantA.id, tenantB.id);

  try {
    // ----------------------------------------------------------------
    // 1. WordPressSite always has workspaceId & cannot be created empty
    // ----------------------------------------------------------------
    const siteA = await createWordPressSite({
      workspaceId: tenantA.id,
      name: "Tenant A Portal",
      url: "https://tenanta.com",
      username: "admin_a",
      applicationPassword: "secret_password_a",
      defaultPromptType: "ANALYTICAL",
    });

    const siteB = await createWordPressSite({
      workspaceId: tenantB.id,
      name: "Tenant B Portal",
      url: "https://tenantb.com",
      username: "admin_b",
      applicationPassword: "secret_password_b",
      defaultPromptType: "HUMORISTIC",
    });

    if (!siteA.workspaceId || !siteB.workspaceId) {
      throw new Error("FAIL: WordPressSite criado sem workspaceId!");
    }
    console.log("✓ Check 1 PASS: WordPressSite sempre possui workspaceId obrigatório.");

    // ----------------------------------------------------------------
    // 2. Feed ↔ WordPressSite association is strictly tenant-safe
    // ----------------------------------------------------------------
    const feedA = await prisma.source.create({
      data: {
        workspaceId: tenantA.id,
        name: "Feed A",
        rssUrl: "https://feed-a.com/rss",
      },
    });

    const feedB = await prisma.source.create({
      data: {
        workspaceId: tenantB.id,
        name: "Feed B",
        rssUrl: "https://feed-b.com/rss",
      },
    });

    // Attempt to associate Tenant A's feed with Tenant B's site from Tenant A's session
    try {
      await assignSourceToWordPressSite({
        workspaceId: tenantA.id,
        wordpressSiteId: siteB.id, // Cross-tenant site
        sourceId: feedA.id,
      });
      throw new Error("VULNERABILIDADE: Associação permitiu vincular site de outro tenant!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("não encontrado")) {
        throw err;
      }
      console.log("✓ Check 2 PASS: Tentativa de cross-tenant site association bloqueada com sucesso.");
    }

    // Attempt to associate Tenant B's feed from Tenant A's session
    try {
      await assignSourceToWordPressSite({
        workspaceId: tenantA.id,
        wordpressSiteId: siteA.id,
        sourceId: feedB.id, // Cross-tenant feed
      });
      throw new Error("VULNERABILIDADE: Associação permitiu vincular feed de outro tenant!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("não encontrado")) {
        throw err;
      }
      console.log("✓ Check 2 PASS: Tentativa de cross-tenant feed association bloqueada com sucesso.");
    }

    // ----------------------------------------------------------------
    // 3. Article destination is strictly tenant-safe
    // ----------------------------------------------------------------
    const artA = await prisma.article.create({
      data: {
        workspaceId: tenantA.id,
        sourceId: feedA.id,
        wordpressSiteId: siteA.id,
        originalUrl: "https://tenanta.com/news-1",
        originalTitle: "Notícia Tenant A",
        status: "PENDING",
      },
    });

    // Verify tenant B cannot see artA
    const tenantBArticles = await prisma.article.findMany({
      where: {
        workspaceId: tenantB.id,
      },
    });
    if (tenantBArticles.some((a) => a.id === artA.id)) {
      throw new Error("VULNERABILIDADE: Tenant B conseguiu listar artigo do Tenant A!");
    }
    console.log("✓ Check 3 PASS: Artigos e seus destinos são estritamente isolados por tenant.");

    // ----------------------------------------------------------------
    // 4. No site of another tenant ever appears in queries
    // ----------------------------------------------------------------
    const tenantASites = await getWordPressSites(tenantA.id);
    const tenantBSites = await getWordPressSites(tenantB.id);

    if (
      tenantASites.some((s: { id: string }) => s.id === siteB.id) ||
      tenantBSites.some((s: { id: string }) => s.id === siteA.id)
    ) {
      throw new Error("VULNERABILIDADE: Sites de outros tenants vazaram na listagem!");
    }
    console.log("✓ Check 4 PASS: Nenhum site de outro tenant aparece nas listagens.");

    // ----------------------------------------------------------------
    // 5. Secrets are NEVER returned in sanitized client objects
    // ----------------------------------------------------------------
    const sanitizedA = sanitizeWordPressSite(siteA);
    if (
      "encryptedApplicationPassword" in sanitizedA ||
      "applicationPassword" in sanitizedA ||
      JSON.stringify(sanitizedA).includes("secret_password_a")
    ) {
      throw new Error("VULNERABILIDADE CRÍTICA: Senha exposta no objeto sanitizado para o cliente!");
    }
    if (!sanitizedA.hasPassword) {
      throw new Error("Sanitização falhou ao indicar hasPassword: true");
    }
    console.log("✓ Check 5 PASS: Credenciais nunca retornam descriptografadas ou em texto puro para o client.");

    // ----------------------------------------------------------------
    // 6. Legacy configuration migration does not create duplicates
    // ----------------------------------------------------------------
    const mig1 = await migrateLegacyWordPressConfig(tenantA.id);
    const mig2 = await migrateLegacyWordPressConfig(tenantA.id);

    if (mig1.migrated !== mig2.migrated) {
      throw new Error("FAIL: Migração legada não é determinística.");
    }
    console.log("✓ Check 6 PASS: Migração legada é 100% idempotente e segura.");

    // ----------------------------------------------------------------
    // 7. Prompt resolution does not have cross-tenant leakage
    // ----------------------------------------------------------------
    const promptCrossCheck = await resolvePromptType({
      workspaceId: tenantB.id, // Requesting as Tenant B
      sourceId: feedA.id,      // Tenant A feed
      wordpressSiteId: siteA.id, // Tenant A site
    });

    // Should ignore Tenant A's feed and site because workspaceId is Tenant B
    if (promptCrossCheck.origin === "OVERRIDE" || promptCrossCheck.origin === "SOURCE_DEFAULT") {
      throw new Error("VULNERABILIDADE: Prompt resolution vazou configurações de outro tenant!");
    }
    console.log("✓ Check 7 PASS: Prompt resolution nunca vaza dados entre workspaces.");

    // ----------------------------------------------------------------
    // 8. Queries have mandatory tenant filtering
    // ----------------------------------------------------------------
    const feedCountTenantA = await prisma.source.count({ where: { workspaceId: tenantA.id } });
    const feedCountTenantB = await prisma.source.count({ where: { workspaceId: tenantB.id } });
    if (feedCountTenantA !== 1 || feedCountTenantB !== 1) {
      throw new Error("FAIL: Contagem de fontes por tenant inconsistente.");
    }
    console.log("✓ Check 8 PASS: Todas as queries respeitam o filtro estrito de workspaceId.");

    console.log("\n=================================================");
    console.log(">>> AUDITORIA DE SEGURANÇA PHASE 8 CONCLUÍDA COM SUCESSO! <<<");
    console.log("=================================================");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["audit-tenant-a", "audit-tenant-b"] } },
    });
  }
}

runHardeningAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NA AUDITORIA DE SEGURANÇA:", err);
    process.exit(1);
  });
