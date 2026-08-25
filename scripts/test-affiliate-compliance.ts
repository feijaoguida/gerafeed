import { prisma } from "@/lib/prisma";
import {
  AffiliateComplianceService,
  DEFAULT_AFFILIATE_DISCLOSURE,
  WordPressAffiliateRenderer,
} from "@/lib/publisher";
import { CanonicalDocumentService } from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 132 - Affiliate Disclosure & Link Compliance ===");

  const WS_SLUG = "test-ws-compliance";

  try {
    // 0. Cleanup
    await prisma.configuration.deleteMany({
      where: { workspace: { slug: WS_SLUG } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: WS_SLUG },
    });

    // 1. Setup Workspace
    console.log("\n--- Check 1: Hierarquia de Disclosure (Default vs Workspace Override) ---");
    const ws = await prisma.workspace.create({
      data: { name: "Tenant Compliance Test", slug: WS_SLUG },
    });

    const initialDisclosure = await AffiliateComplianceService.getWorkspaceDisclosure(ws.id);
    if (initialDisclosure !== DEFAULT_AFFILIATE_DISCLOSURE) {
      throw new Error("FAIL: Disclosure inicial não retornou o default global.");
    }

    const customText = "Aviso Especial de Compliance: Todos os produtos recomendados são testados e geram comissão.";
    await AffiliateComplianceService.setWorkspaceDisclosure(ws.id, customText);

    const updatedDisclosure = await AffiliateComplianceService.getWorkspaceDisclosure(ws.id);
    if (updatedDisclosure !== customText) {
      throw new Error("FAIL: Disclosure customizado do workspace não foi retornado.");
    }
    console.log("✓ Check 1 PASS: Hierarquia e customização de disclosure por workspace validadas.");

    // 2. Enforcement de Atributos de Links (sponsored nofollow noopener target="_blank")
    console.log("\n--- Check 2: Enforcement de Atributos de Link de Afiliados ---");
    const rawHtml1 = '<p>Confira o <a href="https://produto.mercadolivre.com.br/item-1">Produto A</a> na loja.</p>';
    const enforced1 = AffiliateComplianceService.enforceLinkCompliance(rawHtml1);

    if (!enforced1.includes('rel="sponsored nofollow noopener"') || !enforced1.includes('target="_blank"')) {
      throw new Error(`FAIL: enforceLinkCompliance não injetou atributos no link simples: ${enforced1}`);
    }

    const rawHtml2 = '<p>Veja <a href="https://loja.com" rel="ugc" target="_self">Link UGC</a></p>';
    const enforced2 = AffiliateComplianceService.enforceLinkCompliance(rawHtml2);

    if (!enforced2.includes("sponsored") || !enforced2.includes("nofollow") || !enforced2.includes("noopener") || !enforced2.includes('target="_blank"')) {
      throw new Error(`FAIL: enforceLinkCompliance não normalizou link com rel pré-existente: ${enforced2}`);
    }
    console.log("✓ Check 2 PASS: Injeção e normalização de atributos rel e target validadas.");

    // 3. Integração com WordPressAffiliateRenderer
    console.log("\n--- Check 3: Integração do Disclosure Customizado no Renderer ---");
    const docWithDefaultDisclosure = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: { position: "top" },
      },
      {
        type: "HEADING",
        data: { level: 2, text: "Teste de Renderização" },
      },
    ]);

    const renderedDefault = await WordPressAffiliateRenderer.renderToHtml(ws.id, docWithDefaultDisclosure);
    if (!renderedDefault.includes(customText)) {
      throw new Error("FAIL: Renderer não utilizou o disclosure customizado do workspace.");
    }
    console.log("✓ Check 3 PASS: Renderer utilizou com sucesso o disclosure do workspace.");

    // 4. Precedência de Override Explícito no Bloco
    console.log("\n--- Check 4: Precedência de Override Explícito no Bloco Canônico ---");
    const explicitBlockText = "Aviso ultra-específico deste artigo pontual.";
    const docWithExplicit = CanonicalDocumentService.createDocument([
      {
        type: "AFFILIATE_DISCLOSURE",
        data: { text: explicitBlockText, position: "top" },
      },
      {
        type: "HEADING",
        data: { level: 2, text: "Outro Artigo" },
      },
    ]);

    const renderedExplicit = await WordPressAffiliateRenderer.renderToHtml(ws.id, docWithExplicit);
    if (!renderedExplicit.includes(explicitBlockText) || renderedExplicit.includes(customText)) {
      throw new Error("FAIL: Override explícito do bloco não teve precedência sobre o workspace.");
    }
    console.log("✓ Check 4 PASS: Precedência de override explícito no bloco canônico confirmada.");

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
    console.log("TODOS OS TESTES DA TASK 132 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 132:", error);
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
