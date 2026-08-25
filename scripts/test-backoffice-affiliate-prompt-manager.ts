import { prisma } from "@/lib/prisma";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 171 - Backoffice Affiliate Prompt Manager ===");

  const timestamp = Date.now();
  const superAdminEmail = `superadmin-171-${timestamp}@example.com`;
  const regularUserEmail = `regular-171-${timestamp}@example.com`;

  try {
    await ensureDefaultAffiliatePrograms();
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. Setup SuperAdmin and Regular User
    console.log("\n--- Check 1: SuperAdmin vs Regular User Setup ---");
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: "SuperAdmin Test 171",
        isSuperAdmin: true,
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        email: regularUserEmail,
        name: "Regular User Test 171",
        isSuperAdmin: false,
      },
    });

    console.log("✓ Check 1 PASS: Usuários SuperAdmin e Regular criados.");

    // 2. Global Template List via Service
    console.log("\n--- Check 2: Listagem Global de Templates ---");
    const allGlobals = await AffiliatePromptTemplateService.listAllGlobalTemplates();
    if (allGlobals.length < 7) {
      throw new Error(`FAIL Check 2: Esperado pelo menos 7 templates globais, obtido ${allGlobals.length}`);
    }
    console.log(`✓ Check 2 PASS: ${allGlobals.length} templates globais listados com sucesso.`);

    // 3. SuperAdmin Version Creation Flow
    console.log("\n--- Check 3: Criação de Nova Versão Global com Desativação da Anterior ---");
    const initialReview = await AffiliatePromptTemplateService.getEffectiveTemplate(
      "any-workspace-id",
      "PRODUCT_REVIEW"
    );

    const createdV2 = await AffiliatePromptTemplateService.createGlobalVersion(
      "PRODUCT_REVIEW",
      {
        name: "Review Editorial Premium v2",
        description: "Template de review com ênfase em testes de bancada",
        systemPrompt: "Você é um especialista em benchmarks e reviews de alta autoridade.",
        userPromptTemplate: "Analise o produto: {{product.name}} da marca {{product.brand}}. Preço: {{product.price}}.",
        active: true,
      }
    );

    if (createdV2.version !== initialReview.version + 1) {
      throw new Error(`FAIL Check 3: Versão incorreta! Esperado: ${initialReview.version + 1}, Obtido: ${createdV2.version}`);
    }

    if (!createdV2.active) {
      throw new Error("FAIL Check 3: Nova versão deveria ser ativada por padrão!");
    }

    // Verify effective template now resolves the new version v2
    const currentEffective = await AffiliatePromptTemplateService.getEffectiveTemplate(
      "any-workspace-id",
      "PRODUCT_REVIEW"
    );
    if (currentEffective.id !== createdV2.id || currentEffective.version !== createdV2.version) {
      throw new Error("FAIL Check 3: getEffectiveTemplate não resolveu a nova versão ativa!");
    }

    // Verify history contains both versions
    const history = await AffiliatePromptTemplateService.getGlobalTemplateHistory("PRODUCT_REVIEW");
    if (history.length < 2) {
      throw new Error(`FAIL Check 3: Histórico de versões incompleto! Tamanho: ${history.length}`);
    }
    console.log("✓ Check 3 PASS: Versionamento global, histórico e ativação automática validados.");

    // 4. Test Template Activation Toggle
    console.log("\n--- Check 4: Ativação e Restauração de Versão ---");
    const previousVersion = history.find((h) => h.id !== createdV2.id)!;
    await AffiliatePromptTemplateService.setGlobalActive(previousVersion.id, true);

    const restoredEffective = await AffiliatePromptTemplateService.getEffectiveTemplate(
      "any-workspace-id",
      "PRODUCT_REVIEW"
    );
    if (restoredEffective.id !== previousVersion.id) {
      throw new Error("FAIL Check 4: Restauração de versão anterior falhou!");
    }
    console.log("✓ Check 4 PASS: Alternância e restauração de versões globais concluídas.");

    // 5. Test Live Preview Interpolation
    console.log("\n--- Check 5: Renderização de Prévia de Prompt ---");
    const templateToTest = "Produto: {{product.name}} | Marca: {{product.brand}} | Nota: {{product.rating}}";
    const sampleContext = {
      product: {
        name: "PlayStation 5 Slim",
        brand: "Sony",
        rating: "4.9",
      },
    };

    const rendered = AffiliatePromptTemplateService.renderPrompt(templateToTest, sampleContext);
    if (rendered !== "Produto: PlayStation 5 Slim | Marca: Sony | Nota: 4.9") {
      throw new Error(`FAIL Check 5: Interpolação de prévia incorreta! Obtido: "${rendered}"`);
    }
    console.log("✓ Check 5 PASS: Prévia de interpolação de variáveis testada com sucesso.");

    // Cleanup
    console.log("\n--- Cleanup ---");
    await prisma.promptTemplate.deleteMany({ where: { id: createdV2.id } });
    await prisma.user.delete({ where: { id: superAdmin.id } });
    await prisma.user.delete({ where: { id: regularUser.id } });
    console.log("✓ Cleanup concluído.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 171 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 171:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
