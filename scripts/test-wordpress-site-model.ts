import { prisma } from "../src/lib/prisma";
import {
  createWordPressSite,
  getWordPressSites,
  getWordPressSiteById,
  getWordPressSiteConfig,
  updateWordPressSite,
  deleteWordPressSite,
  sanitizeWordPressSite,
} from "../src/lib/wordpress-sites";

async function runTests() {
  console.log("--- TEST: Task 060 - WordPressSite Model & Tenant Isolation ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-wp-site-ws1" },
    update: {},
    create: { name: "Test WS 1", slug: "test-wp-site-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-wp-site-ws2" },
    update: {},
    create: { name: "Test WS 2", slug: "test-wp-site-ws2" },
  });

  console.log("✓ Workspaces de teste preparados:", ws1.id, ws2.id);

  try {
    // 1. Create WordPressSite in WS1
    const rawPassword = "abcd-efgh-ijkl-mnop";
    const site1 = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Humor",
      url: "https://humor.example.com",
      username: "admin_humor",
      applicationPassword: rawPassword,
      defaultPromptType: "HUMORISTIC",
    });

    console.log("✓ Site 1 criado com sucesso:", site1.id, site1.name);

    // 2. Verify encrypted password in database
    if (!site1.encryptedApplicationPassword.startsWith("v1:")) {
      throw new Error("A senha não foi salva no formato criptografado v1:!");
    }
    if (site1.encryptedApplicationPassword === rawPassword) {
      throw new Error("CRÍTICO: Senha salva em texto claro no banco!");
    }
    console.log("✓ Criptografia AES-256-GCM confirmada no banco.");

    // 3. Create second WordPressSite in WS1 (Multi-WordPress per Workspace)
    const site2 = await createWordPressSite({
      workspaceId: ws1.id,
      name: "Portal Política",
      url: "https://politica.example.com",
      username: "admin_politica",
      applicationPassword: "wxyz-1234-5678-90ab",
      defaultPromptType: "INFORMATIVE",
    });
    console.log("✓ Site 2 criado no mesmo Workspace (Multi-WP):", site2.id, site2.name);

    // 4. Test listing sites for WS1
    const ws1Sites = await getWordPressSites(ws1.id);
    if (ws1Sites.length < 2) {
      throw new Error(`Esperado pelo menos 2 sites para WS1, obtido: ${ws1Sites.length}`);
    }
    console.log("✓ Listagem de múltiplos sites por Workspace funcionando:", ws1Sites.length);

    // 5. Test Decrypted Config
    const decryptedConfig = await getWordPressSiteConfig(ws1.id, site1.id);
    if (!decryptedConfig || decryptedConfig.applicationPassword !== rawPassword) {
      throw new Error("Descriptografia de credencial falhou ou não corresponde à senha original.");
    }
    console.log("✓ getWordPressSiteConfig descriptografa corretamente a senha.");

    // 6. Test Client Safe Sanitization
    const sanitized = sanitizeWordPressSite(site1);
    if ("encryptedApplicationPassword" in sanitized && (sanitized as unknown as { encryptedApplicationPassword?: string }).encryptedApplicationPassword) {
      throw new Error("Sanitize não deveria expor encryptedApplicationPassword");
    }
    if (!sanitized.hasPassword) {
      throw new Error("Sanitize deveria indicar hasPassword: true");
    }
    console.log("✓ sanitizeWordPressSite protege credenciais para o client.");

    // 7. Test Tenant Isolation: WS2 cannot access WS1's site
    const leakCheck = await getWordPressSiteById(ws2.id, site1.id);
    if (leakCheck !== null) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu acessar WordPressSite de WS1!");
    }

    const ws2Sites = await getWordPressSites(ws2.id);
    if (ws2Sites.some((s: { id: string }) => s.id === site1.id || s.id === site2.id)) {
      throw new Error("VULNERABILIDADE: Listagem de WS2 vazou sites de WS1!");
    }

    let errorThrown = false;
    try {
      await updateWordPressSite(ws2.id, site1.id, { name: "Hacked" });
    } catch {
      errorThrown = true;
    }
    if (!errorThrown) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu atualizar WordPressSite de WS1!");
    }

    errorThrown = false;
    try {
      await deleteWordPressSite(ws2.id, site1.id);
    } catch {
      errorThrown = true;
    }
    if (!errorThrown) {
      throw new Error("VULNERABILIDADE: WS2 conseguiu deletar WordPressSite de WS1!");
    }
    console.log("✓ Isolamento Multi-tenant (leitura, escrita, exclusão) validado com sucesso.");

    // 8. Test uniqueness per workspace (same name in same workspace fails)
    let duplicateFailed = false;
    try {
      await createWordPressSite({
        workspaceId: ws1.id,
        name: "Portal Humor",
        url: "https://humor2.example.com",
        username: "admin_humor2",
        applicationPassword: "another-password",
      });
    } catch {
      duplicateFailed = true;
    }
    if (!duplicateFailed) {
      throw new Error("Constraint de unicidade (workspaceId, name) não funcionou!");
    }
    console.log("✓ Unicidade de nome por Workspace validada.");

    // 9. Same name in DIFFERENT workspace succeeds
    const siteWs2 = await createWordPressSite({
      workspaceId: ws2.id,
      name: "Portal Humor",
      url: "https://ws2-humor.example.com",
      username: "admin_ws2",
      applicationPassword: "ws2-password",
    });
    console.log("✓ Mesma denominação em Workspace diferente permitida:", siteWs2.id);

    // 10. Update & Delete
    await updateWordPressSite(ws1.id, site1.id, { name: "Portal Humor Atualizado", active: false });
    const updated = await getWordPressSiteById(ws1.id, site1.id);
    if (updated?.name !== "Portal Humor Atualizado" || updated?.active !== false) {
      throw new Error("Atualização de WordPressSite falhou.");
    }
    console.log("✓ Atualização de WordPressSite validada.");

    await deleteWordPressSite(ws1.id, site1.id);
    await deleteWordPressSite(ws1.id, site2.id);
    await deleteWordPressSite(ws2.id, siteWs2.id);
    console.log("✓ Remoção de WordPressSite validada.");

    console.log("\n>>> TODOS OS TESTES DA TASK 060 PASSARAM COM SUCESSO! <<<");
  } finally {
    // Cleanup workspaces
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-wp-site-ws1", "test-wp-site-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
