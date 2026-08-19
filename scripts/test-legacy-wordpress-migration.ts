import { prisma } from "../src/lib/prisma";
import { encrypt } from "../src/lib/crypto";
import { migrateLegacyWordPressConfig } from "../src/lib/wordpress-migration";
import { getWordPressSiteConfig } from "../src/lib/wordpress-sites";

async function runTests() {
  console.log("--- TEST: Task 067 - Legacy WordPress Migration ---");

  // Setup test workspaces
  const ws1 = await prisma.workspace.upsert({
    where: { slug: "test-legacy-wp-ws1" },
    update: {},
    create: { name: "Legacy WP WS 1", slug: "test-legacy-wp-ws1" },
  });

  const ws2 = await prisma.workspace.upsert({
    where: { slug: "test-legacy-wp-ws2" },
    update: {},
    create: { name: "Legacy WP WS 2", slug: "test-legacy-wp-ws2" },
  });

  console.log("✓ Workspaces de teste preparados:", ws1.id, ws2.id);

  try {
    // 1. Create legacy Configuration for WS1
    const rawPass = "legacy-wp-secret-password";
    const encryptedPass = encrypt(rawPass);

    await prisma.configuration.upsert({
      where: {
        workspaceId_key: {
          workspaceId: ws1.id,
          key: "wordpressConnection",
        },
      },
      update: {
        value: {
          url: "https://legacy-site.example.com",
          username: "legacy_user",
          applicationPassword: encryptedPass,
        },
      },
      create: {
        workspaceId: ws1.id,
        key: "wordpressConnection",
        value: {
          url: "https://legacy-site.example.com",
          username: "legacy_user",
          applicationPassword: encryptedPass,
        },
      },
    });

    // 2. Create existing Sources and Categories in WS1
    const source1 = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Legacy Feed A",
        rssUrl: "https://legacy-feed.com/a.xml",
      },
    });

    const source2 = await prisma.source.create({
      data: {
        workspaceId: ws1.id,
        name: "Legacy Feed B",
        rssUrl: "https://legacy-feed.com/b.xml",
      },
    });

    console.log("✓ Fontes legadas criadas:", source1.id, source2.id);

    const legacyCategory = await prisma.wordPressCategory.create({
      data: {
        workspaceId: ws1.id,
        wordpressId: 501,
        name: "Geral",
        slug: "geral",
      },
    });

    console.log("✓ Dados legados preparados no Workspace 1.");

    // 3. Execute Migration for WS1
    const mig1 = await migrateLegacyWordPressConfig(ws1.id);
    console.log("✓ Resultado da migração 1:", mig1);

    if (!mig1.migrated || !mig1.siteId || mig1.associatedSourcesCount !== 2) {
      throw new Error("Migração do Workspace 1 falhou.");
    }

    // 4. Verify Server-Side Decryption on the migrated WordPressSite
    const siteConfig = await getWordPressSiteConfig(ws1.id, mig1.siteId);
    if (!siteConfig || siteConfig.applicationPassword !== rawPass) {
      throw new Error("Credenciais descriptografadas do site migrado não conferem com o original!");
    }
    console.log("✓ Credenciais do WordPressSite migrado recuperáveis e idênticas ao original.");

    // 5. Verify Associated Sources
    const siteSources = await prisma.wordPressSiteSource.findMany({
      where: { wordpressSiteId: mig1.siteId },
    });
    if (siteSources.length !== 2) {
      throw new Error(`Esperado 2 feeds associados ao site migrado, obtido: ${siteSources.length}`);
    }
    console.log("✓ Feeds legados associados com sucesso ao novo WordPressSite.");

    // 6. Verify Category updated
    const updatedCat = await prisma.wordPressCategory.findUnique({
      where: { id: legacyCategory.id },
    });
    if (updatedCat?.wordpressSiteId !== mig1.siteId) {
      throw new Error("Categoria legada não foi atualizada com o ID do WordPressSite!");
    }
    console.log("✓ Categorias legadas vinculadas ao WordPressSite migrado.");

    // 7. Verify Idempotency: Run migration a second time on WS1
    const mig2 = await migrateLegacyWordPressConfig(ws1.id);
    console.log("✓ Resultado da segunda execução (idempotência):", mig2);

    if (!mig2.migrated || mig2.siteId !== mig1.siteId) {
      throw new Error("Idempotência falhou: um novo site foi duplicado!");
    }

    const sitesCount = await prisma.wordPressSite.count({ where: { workspaceId: ws1.id } });
    if (sitesCount !== 1) {
      throw new Error(`Esperado exatamente 1 site após reexecução, obtido: ${sitesCount}`);
    }
    console.log("✓ Idempotência da migração 100% validada (sem duplicações).");

    // 8. Test WS2 with NO legacy config
    const migWs2 = await migrateLegacyWordPressConfig(ws2.id);
    console.log("✓ Resultado da migração em workspace sem legado:", migWs2);
    if (migWs2.migrated !== false || migWs2.reason !== "NO_LEGACY_CONFIG") {
      throw new Error("Workspace sem legado deveria retornar NO_LEGACY_CONFIG!");
    }
    console.log("✓ Tratamento seguro para workspace sem legado validado.");

    console.log("\n>>> TODOS OS TESTES DA TASK 067 PASSARAM COM SUCESSO! <<<");
  } finally {
    // Cleanup
    await prisma.workspace.deleteMany({
      where: { slug: { in: ["test-legacy-wp-ws1", "test-legacy-wp-ws2"] } },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
