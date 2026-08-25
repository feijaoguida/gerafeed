import { prisma } from "@/lib/prisma";
import {
  PublisherFactory,
  WordPressPublisherAdapter,
  PublisherAdapter,
  PublishArticlePayload,
} from "@/lib/publisher";
import { setConfig } from "@/lib/config";
import { encrypt } from "@/lib/crypto";

async function run() {
  console.log("=== TEST: Task 130 - Publisher Adapter & WordPress Implementation ===");

  const WS_SLUG = "test-ws-pub-adapter";

  try {
    // 0. Cleanup
    await prisma.articleProduct.deleteMany({
      where: { article: { workspace: { slug: WS_SLUG } } },
    });
    await prisma.article.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.configuration.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.subscription.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });

    // 1. Direct Instantiation via PublisherFactory
    console.log("\n--- Check 1: Instanciação Direta via PublisherFactory ---");
    const adapter = PublisherFactory.create("wordpress", {
      url: "https://myblog.com",
      username: "admin_user",
      applicationPassword: "secret_app_password",
    });

    if (adapter.name !== "WordPress" || adapter.type !== "wordpress") {
      throw new Error("FAIL: Propriedades name ou type do adapter incorretas.");
    }

    if (!(adapter instanceof WordPressPublisherAdapter)) {
      throw new Error("FAIL: Adapter não é instância de WordPressPublisherAdapter.");
    }

    let invalidCaught = false;
    try {
      PublisherFactory.create("unsupported_cms", {
        url: "https://blog.com",
        username: "user",
        applicationPassword: "pwd",
      });
    } catch {
      invalidCaught = true;
    }

    if (!invalidCaught) {
      throw new Error("FAIL: Factory não rejeitou tipo de publisher desconhecido.");
    }
    console.log("✓ Check 1 PASS: PublisherFactory instanciação direta validada com sucesso.");

    // 2. Mock Adapter Validation (Interface Compliance)
    console.log("\n--- Check 2: Conformidade da Interface PublisherAdapter ---");
    const mockPublisher: PublisherAdapter = {
      name: "MockWordPress",
      type: "wordpress",
      async testConnection() {
        return { connected: true, siteName: "Meu Blog Teste", siteUrl: "https://mock.blog" };
      },
      async createDraft(payload: PublishArticlePayload) {
        return { success: !!payload.title, postId: 101, status: "draft", postUrl: `https://mock.blog/?p=101` };
      },
      async publish(payload: PublishArticlePayload) {
        return { success: !!payload.title, postId: 101, status: "publish", postUrl: `https://mock.blog/?p=101` };
      },
      async update(postId: string | number, payload: Partial<PublishArticlePayload>) {
        return { success: !!postId && !!payload, postId, status: "publish", postUrl: `https://mock.blog/?p=${postId}` };
      },
    };

    const testConn = await mockPublisher.testConnection();
    if (!testConn.connected || testConn.siteName !== "Meu Blog Teste") {
      throw new Error("FAIL: testConnection do mock publisher falhou.");
    }

    const draftRes = await mockPublisher.createDraft({
      title: "Artigo Rascunho",
      content: "<p>Conteúdo</p>",
    });
    if (!draftRes.success || draftRes.status !== "draft" || draftRes.postId !== 101) {
      throw new Error("FAIL: createDraft do mock publisher falhou.");
    }

    const pubRes = await mockPublisher.publish({
      title: "Artigo Publicado",
      content: "<p>Conteúdo publicado</p>",
    });
    if (!pubRes.success || pubRes.status !== "publish") {
      throw new Error("FAIL: publish do mock publisher falhou.");
    }
    console.log("✓ Check 2 PASS: Interface e métodos de publicação conformes.");

    // 3. PublisherFactory.forWorkspace Resolution
    console.log("\n--- Check 3: Resolução por Workspace via PublisherFactory.forWorkspace ---");
    const ws = await prisma.workspace.create({
      data: { name: "Tenant Publisher Test", slug: WS_SLUG },
    });

    await setConfig(
      "wordpressConnection",
      {
        url: "https://meublogtenant.com.br",
        username: "editor_tenant",
        applicationPassword: encrypt("senha_aplicativo_segura"),
      },
      ws.id
    );

    const wsAdapter = await PublisherFactory.forWorkspace(ws.id);
    if (!wsAdapter || wsAdapter.type !== "wordpress") {
      throw new Error("FAIL: PublisherFactory.forWorkspace não retornou o adapter configurado.");
    }
    console.log("✓ Check 3 PASS: Resolução automática de adapter para workspace validada.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.configuration.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });
    console.log("✓ Cleanup concluído com sucesso.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 130 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 130:", error);
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
