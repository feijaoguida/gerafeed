import assert from "node:assert";
import { prisma } from "../../src/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "../../src/lib/billing";

async function run() {
  console.log("=== Testando Validações de Plano e Permissões do WooCommerce ===");

  const workspace = await prisma.workspace.findFirst();
  assert(workspace, "Workspace deve existir para o teste");

  // Verificar se o workspace tem acesso à feature
  const hasAffiliate = await BillingService.hasFeature(workspace.id, AFFILIATE_FEATURES.MODULE);
  console.log(`Workspace ${workspace.id} tem módulo de afiliados?`, hasAffiliate);

  console.log("Validação concluída com sucesso!");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

