import { CommercialArticleType } from "@prisma/client";

export type ProductSelectionMode =
  | "SINGLE"
  | "MULTIPLE"
  | "CATEGORY_AND_PRODUCTS"
  | "CATEGORY";

export interface TemplateInputRule {
  type: CommercialArticleType;
  title: string;
  description: string;
  selectionMode: ProductSelectionMode;
  minProducts: number;
  maxProducts: number;
  requiresCategory: boolean;
  allowsSuggestedTitle: boolean;
  allowsCustomTitle: boolean;
  recommendedSameCategory?: boolean;
}

export const TEMPLATE_INPUT_RULES: Record<CommercialArticleType, TemplateInputRule> = {
  PRODUCT_REVIEW: {
    type: "PRODUCT_REVIEW",
    title: "Review Aprofundado de Produto",
    description: "Análise técnica detalhada de um único produto com prós, contras, ficha técnica e veredito.",
    selectionMode: "SINGLE",
    minProducts: 1,
    maxProducts: 1,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
  },
  COMPARISON: {
    type: "COMPARISON",
    title: "Comparativo Direto de Modelos",
    description: "Tabela comparativa e confronto lado a lado entre 2 ou mais produtos concorrentes.",
    selectionMode: "MULTIPLE",
    minProducts: 2,
    maxProducts: 5,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
    recommendedSameCategory: true,
  },
  BEST_PRODUCTS: {
    type: "BEST_PRODUCTS",
    title: "Melhores Produtos da Categoria",
    description: "Seleção dos melhores produtos em destaque com prêmios, notas e links comerciais.",
    selectionMode: "CATEGORY_AND_PRODUCTS",
    minProducts: 2,
    maxProducts: 10,
    requiresCategory: true,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
  },
  BUYING_GUIDE: {
    type: "BUYING_GUIDE",
    title: "Guia de Compra Completo",
    description: "Manual explicativo sobre o que considerar antes de comprar, com recomendações qualificadas.",
    selectionMode: "CATEGORY",
    minProducts: 1,
    maxProducts: 8,
    requiresCategory: true,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
  },
  PROBLEM_SOLUTION: {
    type: "PROBLEM_SOLUTION",
    title: "Solução de Problema / Como Fazer",
    description: "Artigo prático resolvendo uma dor do leitor com produtos indicados.",
    selectionMode: "CATEGORY_AND_PRODUCTS",
    minProducts: 1,
    maxProducts: 5,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
  },
  DEALS: {
    type: "DEALS",
    title: "Ofertas e Achados",
    description: "Seleção rápida de promoções e oportunidades de compra.",
    selectionMode: "CATEGORY_AND_PRODUCTS",
    minProducts: 1,
    maxProducts: 10,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
  },
  SEASONAL: {
    type: "SEASONAL",
    title: "Guia Sazonal / Data Comemorativa",
    description: "Seleção de presentes e produtos para datas especiais.",
    selectionMode: "CATEGORY_AND_PRODUCTS",
    minProducts: 1,
    maxProducts: 10,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowsCustomTitle: true,
  },
};

export interface ValidateTemplateInputParams {
  productIds?: string[];
  categoryId?: string | null;
  categoryName?: string | null;
  title?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTemplateInputs(
  type: CommercialArticleType,
  input: ValidateTemplateInputParams
): ValidationResult {
  const rule = TEMPLATE_INPUT_RULES[type];
  if (!rule) {
    return {
      valid: false,
      errors: [`Tipo de template '${type}' desconhecido.`],
    };
  }

  const errors: string[] = [];
  const count = input.productIds?.length || 0;

  // Category requirement check
  if (rule.requiresCategory && !input.categoryId && !input.categoryName) {
    errors.push(`O template '${rule.title}' exige a seleção de uma categoria.`);
  }

  // Min products check
  if (count < rule.minProducts) {
    errors.push(
      `O template '${rule.title}' exige no mínimo ${rule.minProducts} produto(s). Fornecido(s): ${count}.`
    );
  }

  // Max products check
  if (count > rule.maxProducts) {
    errors.push(
      `O template '${rule.title}' permite no máximo ${rule.maxProducts} produto(s). Fornecido(s): ${count}.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
