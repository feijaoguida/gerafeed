import { prisma } from "@/lib/prisma";
import {
  AffiliatePromptTemplateService,
  TEMPLATE_CONSTRAINTS,
} from "@/lib/affiliate/prompt-template-service";
import { ensureDefaultAffiliatePrograms } from "@/lib/affiliate/seed";

async function run() {
  console.log("=== TEST: Task 172 - Affiliate Template Constraints & Variables ===");

  try {
    await ensureDefaultAffiliatePrograms();
    await AffiliatePromptTemplateService.ensureDefaultTemplates();

    // 1. Check Schema & Config Definitions for all 7 commercial types
    console.log("\n--- Check 1: Formal Schema & Config Definitions ---");
    const types = [
      "PRODUCT_REVIEW",
      "COMPARISON",
      "BEST_PRODUCTS",
      "BUYING_GUIDE",
      "PROBLEM_SOLUTION",
      "DEALS",
      "SEASONAL",
    ] as const;

    for (const t of types) {
      const constraint = TEMPLATE_CONSTRAINTS[t];
      if (!constraint) {
        throw new Error(`FAIL Check 1: Restrições ausentes para o tipo ${t}`);
      }
      if (!constraint.selectionMode) {
        throw new Error(`FAIL Check 1: selectionMode ausente para ${t}`);
      }
      if (constraint.minProducts === undefined) {
        throw new Error(`FAIL Check 1: minProducts indefinido para ${t}`);
      }
      if (!Array.isArray(constraint.allowedVariables) || constraint.allowedVariables.length === 0) {
        throw new Error(`FAIL Check 1: allowedVariables vazias para ${t}`);
      }
    }
    console.log("✓ Check 1 PASS: Configurações e restrições formalizadas para os 7 tipos comerciais.");

    // 2. Test Variable Extractor
    console.log("\n--- Check 2: Extrator de Variáveis Mustache ---");
    const sampleTemplate = `Analise {{product.name}} com foco em {{product.specs}} e notas: {{product.rating}}.`;
    const vars = AffiliatePromptTemplateService.extractVariables(sampleTemplate);
    if (vars.length !== 3 || !vars.includes("product.name") || !vars.includes("product.specs") || !vars.includes("product.rating")) {
      throw new Error(`FAIL Check 2: Variáveis extraídas incorretamente: ${JSON.stringify(vars)}`);
    }
    console.log("✓ Check 2 PASS: Extrator de variáveis identificou corretamente os placeholders.");

    // 3. Test Validator Success with Supported Variables
    console.log("\n--- Check 3: Validação de Variáveis Válidas ---");
    const validValidation = AffiliatePromptTemplateService.validateTemplateVariables(
      `Escreva sobre {{product.name}} da marca {{product.brand}}. Preço: {{product.price}}. Avaliações: {{product.reviews}}. Categoria: {{category.name}}.`,
      "PRODUCT_REVIEW"
    );

    if (!validValidation.valid || validValidation.errors.length > 0) {
      throw new Error(`FAIL Check 3: Validação falhou indevidamente para variáveis válidas: ${validValidation.errors.join("; ")}`);
    }
    console.log("✓ Check 3 PASS: Template com variáveis suportadas aprovado.");

    // 4. Test Validator Rejection with Unknown / Unauthorized Variables
    console.log("\n--- Check 4: Rejeição Explícita de Variáveis Desconhecidas ---");
    const invalidValidation = AffiliatePromptTemplateService.validateTemplateVariables(
      `Escreva sobre {{product.name}} e mostre {{invalid_placeholder_xyz}} e {{product.unsupportedField}}.`,
      "PRODUCT_REVIEW"
    );

    if (invalidValidation.valid) {
      throw new Error("FAIL Check 4: Validador deveria ter REJEITADO variáveis desconhecidas!");
    }

    if (!invalidValidation.invalidVariables.includes("invalid_placeholder_xyz") || !invalidValidation.invalidVariables.includes("product.unsupportedField")) {
      throw new Error(`FAIL Check 4: Lista de variáveis inválidas incompleta: ${JSON.stringify(invalidValidation.invalidVariables)}`);
    }

    if (!invalidValidation.errors[0]?.includes("Variáveis não suportadas")) {
      throw new Error(`FAIL Check 4: Mensagem de erro não informativa: ${invalidValidation.errors[0]}`);
    }
    console.log("✓ Check 4 PASS: Rejeição explícita de variáveis desconhecidas com mensagem detalhada.");

    // 5. Test createGlobalVersion enforcing variable validation
    console.log("\n--- Check 5: Criação de Versão Global com Bloqueio de Variáveis Inválidas ---");
    let threw = false;
    try {
      await AffiliatePromptTemplateService.createGlobalVersion("COMPARISON", {
        name: "Comparativo com Variável Inválida",
        systemPrompt: "System",
        userPromptTemplate: "Comparativo: {{productsList}} com {{fake_variable_123}}",
      });
    } catch (err) {
      threw = true;
      if (!(err instanceof Error) || !err.message.includes("fake_variable_123")) {
        throw new Error(`FAIL Check 5: Erro inesperado: ${err}`);
      }
    }

    if (!threw) {
      throw new Error("FAIL Check 5: createGlobalVersion permitiu criar template com variável inválida!");
    }

    // Now test valid creation
    const validCreated = await AffiliatePromptTemplateService.createGlobalVersion("COMPARISON", {
      name: "Comparativo Válido Teste 172",
      systemPrompt: "System",
      userPromptTemplate: "Comparativo entre produtos:\n{{productsList}}\nQuantidade: {{productsCount}}",
    });

    if (!validCreated.variables.includes("productsList") || !validCreated.variables.includes("productsCount")) {
      throw new Error("FAIL Check 5: Array de variáveis salvas no banco incompleto!");
    }

    // Cleanup
    await prisma.promptTemplate.delete({ where: { id: validCreated.id } });
    console.log("✓ Check 5 PASS: createGlobalVersion bloqueia variáveis inválidas e persiste metadados de variáveis no banco.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 172 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 172:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
