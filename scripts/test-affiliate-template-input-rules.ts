import {
  TEMPLATE_INPUT_RULES,
  validateTemplateInputs,
} from "@/lib/affiliate/template-rules";

async function run() {
  console.log("=== TEST: Task 166 - Affiliate Template Input Rules ===");

  // 1. Check Central Rules Definitions
  console.log("\n--- Check 1: Definição Central de Regras (Source of Truth) ---");
  const reviewRule = TEMPLATE_INPUT_RULES.PRODUCT_REVIEW;
  if (!reviewRule || reviewRule.minProducts !== 1 || reviewRule.maxProducts !== 1) {
    throw new Error("FAIL Check 1: Regra do PRODUCT_REVIEW deve exigir 1 produto (min 1, max 1).");
  }

  const comparisonRule = TEMPLATE_INPUT_RULES.COMPARISON;
  if (!comparisonRule || comparisonRule.minProducts !== 2 || comparisonRule.maxProducts !== 5) {
    throw new Error("FAIL Check 1: Regra do COMPARISON deve exigir min 2 e max 5 produtos.");
  }

  const bestProductsRule = TEMPLATE_INPUT_RULES.BEST_PRODUCTS;
  if (!bestProductsRule || !bestProductsRule.requiresCategory || bestProductsRule.minProducts !== 2) {
    throw new Error("FAIL Check 1: Regra do BEST_PRODUCTS deve exigir categoria e min 2 produtos.");
  }

  const buyingGuideRule = TEMPLATE_INPUT_RULES.BUYING_GUIDE;
  if (!buyingGuideRule || !buyingGuideRule.requiresCategory || buyingGuideRule.minProducts !== 1) {
    throw new Error("FAIL Check 1: Regra do BUYING_GUIDE deve exigir categoria e min 1 produto.");
  }

  console.log("✓ Check 1 PASS: Todas as 4 regras centrais definidas com conformidade à SPEC.");

  // 2. Validate PRODUCT_REVIEW boundaries
  console.log("\n--- Check 2: Validação de Limites - PRODUCT_REVIEW ---");
  const reviewZero = validateTemplateInputs("PRODUCT_REVIEW", { productIds: [] });
  if (reviewZero.valid || !reviewZero.errors[0].includes("no mínimo 1 produto")) {
    throw new Error("FAIL Check 2: PRODUCT_REVIEW sem produtos deveria falhar na validação.");
  }

  const reviewValid = validateTemplateInputs("PRODUCT_REVIEW", { productIds: ["prod-1"] });
  if (!reviewValid.valid) {
    throw new Error("FAIL Check 2: PRODUCT_REVIEW com 1 produto deveria ser válido.");
  }

  const reviewExcess = validateTemplateInputs("PRODUCT_REVIEW", { productIds: ["prod-1", "prod-2"] });
  if (reviewExcess.valid || !reviewExcess.errors[0].includes("no máximo 1 produto")) {
    throw new Error("FAIL Check 2: PRODUCT_REVIEW com 2 produtos deveria falhar.");
  }
  console.log("✓ Check 2 PASS: PRODUCT_REVIEW validado com limites estritos (1/1).");

  // 3. Validate COMPARISON boundaries
  console.log("\n--- Check 3: Validação de Limites - COMPARISON ---");
  const compOne = validateTemplateInputs("COMPARISON", { productIds: ["prod-1"] });
  if (compOne.valid || !compOne.errors[0].includes("no mínimo 2 produto")) {
    throw new Error("FAIL Check 3: COMPARISON com 1 produto deveria falhar.");
  }

  const compValid = validateTemplateInputs("COMPARISON", { productIds: ["prod-1", "prod-2", "prod-3"] });
  if (!compValid.valid) {
    throw new Error("FAIL Check 3: COMPARISON com 3 produtos deveria ser válido.");
  }

  const compExcess = validateTemplateInputs("COMPARISON", {
    productIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
  });
  if (compExcess.valid || !compExcess.errors[0].includes("no máximo 5 produto")) {
    throw new Error("FAIL Check 3: COMPARISON com 6 produtos deveria falhar.");
  }
  console.log("✓ Check 3 PASS: COMPARISON validado com limites estritos (2 a 5).");

  // 4. Validate BEST_PRODUCTS & BUYING_GUIDE Category requirement
  console.log("\n--- Check 4: Validação de Categoria - BEST_PRODUCTS e BUYING_GUIDE ---");
  const bestNoCat = validateTemplateInputs("BEST_PRODUCTS", { productIds: ["p1", "p2"] });
  if (bestNoCat.valid || !bestNoCat.errors[0].includes("exige a seleção de uma categoria")) {
    throw new Error("FAIL Check 4: BEST_PRODUCTS sem categoria deveria falhar.");
  }

  const bestWithCat = validateTemplateInputs("BEST_PRODUCTS", {
    categoryId: "cat-1",
    productIds: ["p1", "p2", "p3"],
  });
  if (!bestWithCat.valid) {
    throw new Error("FAIL Check 4: BEST_PRODUCTS com categoria e 3 produtos deveria ser válido.");
  }

  const guideNoCat = validateTemplateInputs("BUYING_GUIDE", { productIds: ["p1"] });
  if (guideNoCat.valid || !guideNoCat.errors[0].includes("exige a seleção de uma categoria")) {
    throw new Error("FAIL Check 4: BUYING_GUIDE sem categoria deveria falhar.");
  }

  const guideWithCat = validateTemplateInputs("BUYING_GUIDE", {
    categoryName: "Eletrônicos",
    productIds: ["p1", "p2"],
  });
  if (!guideWithCat.valid) {
    throw new Error("FAIL Check 4: BUYING_GUIDE com categoryName e produtos deveria ser válido.");
  }
  console.log("✓ Check 4 PASS: Requisito de categoria e regras de contagem validados.");

  console.log("\n=======================================================");
  console.log("TODOS OS TESTES DA TASK 166 PASSARAM COM SUCESSO!");
  console.log("=======================================================");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
