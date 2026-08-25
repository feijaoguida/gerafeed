import { prisma } from "@/lib/prisma";
import { CommercialArticleType } from "@/lib/affiliate/types";

export interface DefaultPromptDefinition {
  type: CommercialArticleType;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export const DEFAULT_AFFILIATE_PROMPT_TEMPLATES: Record<CommercialArticleType, DefaultPromptDefinition> = {
  PRODUCT_REVIEW: {
    type: "PRODUCT_REVIEW",
    name: "Review Completo de Produto",
    description: "Análise aprofundada com veredito editorial, prós e contras, especificações e recomendação de compra.",
    systemPrompt: `Você é um redator e jornalista de tecnologia/produtos altamente experiente.
Sua missão é produzir um review detalhado, honesto, informativo e persuasivo em formato HTML semântico com tags <p>, <h2>, <h3>, <ul>, <li>, <strong>, <blockquote>.
Foque na experiência real de uso, pontos fortes e fracos, relação custo-benefício e recomendação sincera.
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título atraente e otimizado para SEO",
  "summary": "Resumo executivo de 2-3 frases sobre o veredito",
  "content": "<p>HTML completo do artigo...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO (máx 60 caracteres)",
  "seoDescription": "Meta description (máx 155 caracteres)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Escreva um review completo e aprofundado sobre o seguinte produto:

Nome: {{product.name}}
Marca: {{product.brand}}
Categoria: {{category.name}}
Preço Atual: {{product.price}}
Descrição Base: {{product.description}}

Especificações Técnicas:
{{product.specs}}

Pontos Fortes (Prós):
{{product.pros}}

Pontos Fracos (Contras):
{{product.cons}}

Avaliação Editorial: {{product.rating}} / 5

Amostras de Avaliações Reais de Consumidores:
{{product.reviews}}

Resumos e Referências Externas:
{{product.referenceSources}}

Instruções Adicionais:
{{customInstructions}}`,
  },

  COMPARISON: {
    type: "COMPARISON",
    name: "Comparativo Lado a Lado",
    description: "Comparação direta entre dois ou mais produtos, destacando prós/contras, tabela e veredito final por perfil.",
    systemPrompt: `Você é um especialista em análise comparativa de produtos.
Sua missão é produzir um comparativo técnico e prático entre os produtos fornecidos, destacando diferenças de desempenho, acabamento, recursos e preço.
Gere um veredito claro de qual produto vale mais a pena para cada perfil de usuário.
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título atraente do comparativo (Ex: Produto A vs Produto B: Qual é o Melhor?)",
  "summary": "Resumo conciso das principais conclusões",
  "content": "<p>HTML completo com introdução, comparativo por quesitos, tabela resumo e veredito...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO (máx 60 caracteres)",
  "seoDescription": "Meta description (máx 155 caracteres)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Escreva um artigo comparativo detalhado entre os seguintes produtos:

{{productsList}}

Instruções Adicionais:
{{customInstructions}}`,
  },

  BEST_PRODUCTS: {
    type: "BEST_PRODUCTS",
    name: "Guia dos Melhores Produtos (Roundup / Top Picks)",
    description: "Lista com curadoria dos melhores produtos em uma categoria (Melhor Geral, Melhor Custo-Benefício, etc.).",
    systemPrompt: `Você é um curador especialista em guias de compra de produtos.
Sua missão é produzir um guia 'Top Escolhas' com os melhores produtos de uma categoria, classificando-os com selos (Melhor Geral, Melhor Custo-Benefício, Escolha Premium, etc.).
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título chamativo (Ex: Os 5 Melhores X para Comprar em 2026)",
  "summary": "Resumo geral da seleção e principais destaques",
  "content": "<p>HTML completo estruturado com cada produto em destaque, prós/contras e recomendação...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO (máx 60 caracteres)",
  "seoDescription": "Meta description (máx 155 caracteres)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Crie um guia com os melhores produtos para a categoria "{{category.name}}":

Produtos Selecionados:
{{productsList}}

Instruções Adicionais:
{{customInstructions}}`,
  },

  BUYING_GUIDE: {
    type: "BUYING_GUIDE",
    name: "Guia de Compra Completo",
    description: "Manual educativo ensinando o consumidor a escolher o melhor produto conforme suas necessidades.",
    systemPrompt: `Você é um consultor de compras experiente.
Produza um guia educativo e completo explicando quais critérios analisar antes de comprar, armadilhas a evitar e como escolher o modelo ideal.
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título do guia (Ex: Como Escolher o Melhor X: Guia Completo)",
  "summary": "Resumo com as principais dicas e critérios de compra",
  "content": "<p>HTML completo educativo com seções explicativas, critérios e sugestões de produtos...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO",
  "seoDescription": "Meta description",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Escreva um guia de compra completo para a categoria "{{category.name}}":

Critérios e Recursos Importantes:
{{product.specs}}

Produtos em Destaque:
{{productsList}}

Instruções Adicionais:
{{customInstructions}}`,
  },

  PROBLEM_SOLUTION: {
    type: "PROBLEM_SOLUTION",
    name: "Solução para um Problema",
    description: "Aborda uma dor ou problema específico do leitor e demonstra como determinado produto resolve a questão.",
    systemPrompt: `Você é um redator focado em soluções práticas para o consumidor.
Identifique o problema abordado, desenvolva empatia com o leitor e apresente o produto recomendado como a solução mais eficiente.
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título focado na dor (Ex: Sofrendo com X? Veja como o Produto Y Resolve)",
  "summary": "Resumo do problema e da solução recomendada",
  "content": "<p>HTML completo com diagnóstico do problema, como resolver e análise do produto...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO",
  "seoDescription": "Meta description",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Escreva um artigo do tipo Problema & Solução:

Problema / Dor do Consumidor: {{problemDescription}}

Produto Recomendado:
Nome: {{product.name}}
Marca: {{product.brand}}
Diferencial de Solução: {{product.description}}
Preço: {{product.price}}

Instruções Adicionais:
{{customInstructions}}`,
  },

  DEALS: {
    type: "DEALS",
    name: "Alerta de Oferta e Promoção",
    description: "Destaque de desconto expressivo com análise de oportunidade, urgência legítima e histórico de preço.",
    systemPrompt: `Você é um curador de ofertas e promoções relâmpago.
Destaque a oportunidade real de desconto, compare o preço promocional com o valor histórico e explique por que a compra vale a pena agora.
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título com senso de oportunidade (Ex: Menor Preço Histórico: Produto X com Y% OFF)",
  "summary": "Resumo da oferta e do desconto",
  "content": "<p>HTML com detalhes da promoção, especificações rápidas e chamada para ação...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO",
  "seoDescription": "Meta description",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Crie um artigo de Alerta de Oferta:

Produto: {{product.name}}
Preço Original: {{product.oldPrice}}
Preço Promocional: {{product.price}}
Vendedor: {{product.seller}}
Destaques do Produto: {{product.description}}

Instruções Adicionais:
{{customInstructions}}`,
  },

  SEASONAL: {
    type: "SEASONAL",
    name: "Especial Sazonal e Datas Comemorativas",
    description: "Conteúdo temático para datas como Black Friday, Dia das Mães, Dia dos Pais, Natal, Volta às Aulas, etc.",
    systemPrompt: `Você é um especialista em curadoria comercial sazonal.
Crie um artigo temático e envolvente focado no evento ou data comemorativa indicada, trazendo as melhores opções de presentes ou compras.
Responda SEMPRE em formato JSON com as chaves:
{
  "title": "Título temático sazonal (Ex: Guia de Presentes de Natal: Melhores Opções até R$ X)",
  "summary": "Resumo temático",
  "content": "<p>HTML completo com introdução temática e produtos selecionados...</p>",
  "seoFocusKeyword": "palavra-chave principal",
  "seoTitle": "Título SEO",
  "seoDescription": "Meta description",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    userPromptTemplate: `Crie um artigo sazonal para a data/evento "{{eventTheme}}":

Produtos Selecionados:
{{productsList}}

Instruções Adicionais:
{{customInstructions}}`,
  },
};

export const SUPPORTED_TEMPLATE_VARIABLES = [
  "product.name",
  "product.brand",
  "product.description",
  "product.price",
  "product.specs",
  "product.pros",
  "product.cons",
  "product.rating",
  "product.reviews",
  "product.referenceSources",
  "productsList",
  "productsCount",
  "category.name",
  "customInstructions",
  "referenceSummaries",
  "eventTheme",
] as const;

export interface TemplateConstraint {
  selectionMode: "SINGLE" | "MULTIPLE" | "OPTIONAL" | "SINGLE_OR_MULTIPLE";
  minProducts: number;
  maxProducts: number | null;
  requiresCategory: boolean;
  allowsSuggestedTitle: boolean;
  allowedVariables: string[];
}

export const TEMPLATE_CONSTRAINTS: Record<CommercialArticleType, TemplateConstraint> = {
  PRODUCT_REVIEW: {
    selectionMode: "SINGLE",
    minProducts: 1,
    maxProducts: 1,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "product.name",
      "product.brand",
      "product.description",
      "product.price",
      "product.specs",
      "product.pros",
      "product.cons",
      "product.rating",
      "product.reviews",
      "product.referenceSources",
      "category.name",
      "customInstructions",
      "referenceSummaries",
    ],
  },
  COMPARISON: {
    selectionMode: "MULTIPLE",
    minProducts: 2,
    maxProducts: 2,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "productsList",
      "productsCount",
      "category.name",
      "customInstructions",
      "referenceSummaries",
    ],
  },
  BEST_PRODUCTS: {
    selectionMode: "MULTIPLE",
    minProducts: 2,
    maxProducts: 10,
    requiresCategory: true,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "productsList",
      "productsCount",
      "category.name",
      "customInstructions",
      "referenceSummaries",
    ],
  },
  BUYING_GUIDE: {
    selectionMode: "OPTIONAL",
    minProducts: 0,
    maxProducts: 10,
    requiresCategory: true,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "productsList",
      "productsCount",
      "category.name",
      "customInstructions",
      "referenceSummaries",
    ],
  },
  PROBLEM_SOLUTION: {
    selectionMode: "SINGLE_OR_MULTIPLE",
    minProducts: 1,
    maxProducts: 5,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "product.name",
      "product.brand",
      "product.description",
      "product.price",
      "product.specs",
      "product.pros",
      "product.cons",
      "product.rating",
      "product.reviews",
      "product.referenceSources",
      "productsList",
      "productsCount",
      "category.name",
      "customInstructions",
      "referenceSummaries",
    ],
  },
  DEALS: {
    selectionMode: "MULTIPLE",
    minProducts: 1,
    maxProducts: 10,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "productsList",
      "productsCount",
      "category.name",
      "customInstructions",
      "referenceSummaries",
    ],
  },
  SEASONAL: {
    selectionMode: "MULTIPLE",
    minProducts: 1,
    maxProducts: 10,
    requiresCategory: false,
    allowsSuggestedTitle: true,
    allowedVariables: [
      "productsList",
      "productsCount",
      "category.name",
      "customInstructions",
      "referenceSummaries",
      "eventTheme",
    ],
  },
};

export interface EffectivePromptTemplate {
  id?: string;
  type: CommercialArticleType;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  version: number;
  isCustomOverride: boolean;
  workspaceId?: string | null;
  selectionMode?: string | null;
  minProducts?: number | null;
  maxProducts?: number | null;
  requiresCategory?: boolean | null;
  allowsSuggestedTitle?: boolean | null;
  variables?: string[];
}

export class AffiliatePromptTemplateService {
  /**
   * Extracts all {{variable}} tags from template text.
   */
  static extractVariables(templateText: string): string[] {
    const matches = templateText.match(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[\{\}\s]/g, ""))));
  }

  /**
   * Validates that all variables used in templateText belong to the allowed list for the template type.
   */
  static validateTemplateVariables(
    templateText: string,
    type: CommercialArticleType
  ): { valid: boolean; errors: string[]; extractedVariables: string[]; invalidVariables: string[] } {
    const extracted = this.extractVariables(templateText);
    const constraint = TEMPLATE_CONSTRAINTS[type];
    const allowed = constraint ? constraint.allowedVariables : (SUPPORTED_TEMPLATE_VARIABLES as readonly string[]);

    const invalidVariables = extracted.filter((v) => !allowed.includes(v));
    const errors: string[] = [];

    if (invalidVariables.length > 0) {
      errors.push(
        `Variáveis não suportadas para o formato ${type}: ${invalidVariables.map((v) => `{{${v}}}`).join(", ")}. Variáveis permitidas: ${allowed.map((v) => `{{${v}}}`).join(", ")}`
      );
    }

    return {
      valid: invalidVariables.length === 0,
      errors,
      extractedVariables: extracted,
      invalidVariables,
    };
  }

  /**
   * Idempotently seeds default system prompt templates (workspaceId = null).
   */
  static async ensureDefaultTemplates(): Promise<void> {
    const types = Object.keys(DEFAULT_AFFILIATE_PROMPT_TEMPLATES) as CommercialArticleType[];

    for (const type of types) {
      const def = DEFAULT_AFFILIATE_PROMPT_TEMPLATES[type];
      const constraint = TEMPLATE_CONSTRAINTS[type];
      const extractedVars = this.extractVariables(def.userPromptTemplate);

      const existing = await prisma.promptTemplate.findFirst({
        where: {
          workspaceId: null,
          type,
        },
      });

      if (!existing) {
        await prisma.promptTemplate.create({
          data: {
            workspaceId: null,
            type: def.type,
            name: def.name,
            description: def.description,
            systemPrompt: def.systemPrompt,
            userPromptTemplate: def.userPromptTemplate,
            selectionMode: constraint?.selectionMode || null,
            minProducts: constraint?.minProducts !== undefined ? constraint.minProducts : null,
            maxProducts: constraint?.maxProducts !== undefined ? constraint.maxProducts : null,
            requiresCategory: constraint?.requiresCategory || false,
            allowsSuggestedTitle: constraint?.allowsSuggestedTitle !== undefined ? constraint.allowsSuggestedTitle : true,
            variables: extractedVars,
            version: 1,
            active: true,
          },
        });
      } else {
        await prisma.promptTemplate.update({
          where: { id: existing.id },
          data: {
            selectionMode: constraint?.selectionMode || existing.selectionMode,
            minProducts: constraint?.minProducts !== undefined ? constraint.minProducts : existing.minProducts,
            maxProducts: constraint?.maxProducts !== undefined ? constraint.maxProducts : existing.maxProducts,
            requiresCategory: constraint?.requiresCategory !== undefined ? constraint.requiresCategory : existing.requiresCategory,
            allowsSuggestedTitle: constraint?.allowsSuggestedTitle !== undefined ? constraint.allowsSuggestedTitle : existing.allowsSuggestedTitle,
            variables: extractedVars.length > 0 ? extractedVars : existing.variables,
          },
        });
      }
    }
  }

  /**
   * Resolves the effective prompt template for a commercial type.
   * In Phase 19 (Global Governance), prompt templates are strictly GLOBAL (workspaceId = null).
   * Workspace custom overrides are preserved in the DB for audit history but ignored for generation.
   */
  static async getEffectiveTemplate(
    workspaceId: string,
    type: CommercialArticleType
  ): Promise<EffectivePromptTemplate> {
    // 1. Check global active template in DB (highest version)
    const globalTemplate = await prisma.promptTemplate.findFirst({
      where: {
        workspaceId: null,
        type,
        active: true,
      },
      orderBy: { version: "desc" },
    });

    if (globalTemplate) {
      return {
        id: globalTemplate.id,
        type: globalTemplate.type,
        name: globalTemplate.name,
        description: globalTemplate.description,
        systemPrompt: globalTemplate.systemPrompt,
        userPromptTemplate: globalTemplate.userPromptTemplate,
        version: globalTemplate.version,
        isCustomOverride: false,
        workspaceId: null,
      };
    }

    // 2. Fallback to hardcoded defaults if DB has not been seeded yet
    const def = DEFAULT_AFFILIATE_PROMPT_TEMPLATES[type];
    return {
      type,
      name: def?.name || type,
      description: def?.description,
      systemPrompt: def?.systemPrompt || "",
      userPromptTemplate: def?.userPromptTemplate || "",
      version: 1,
      isCustomOverride: false,
      workspaceId: null,
    };
  }

  /**
   * Lists all 7 template types with their effective resolved template for a workspace.
   */
  static async listTemplates(workspaceId: string): Promise<EffectivePromptTemplate[]> {
    const types: CommercialArticleType[] = [
      "PRODUCT_REVIEW",
      "COMPARISON",
      "BEST_PRODUCTS",
      "BUYING_GUIDE",
      "PROBLEM_SOLUTION",
      "DEALS",
      "SEASONAL",
    ];

    const results: EffectivePromptTemplate[] = [];
    for (const type of types) {
      const effective = await this.getEffectiveTemplate(workspaceId, type);
      results.push(effective);
    }

    return results;
  }

  /**
   * Saves or updates a custom override for a workspace.
   */
  static async saveOverride(
    workspaceId: string,
    type: CommercialArticleType,
    input: {
      name?: string;
      description?: string;
      systemPrompt: string;
      userPromptTemplate: string;
    }
  ): Promise<EffectivePromptTemplate> {
    const existing = await prisma.promptTemplate.findFirst({
      where: {
        workspaceId,
        type,
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = existing ? existing.version + 1 : 1;
    const defaultDef = DEFAULT_AFFILIATE_PROMPT_TEMPLATES[type];

    const created = await prisma.promptTemplate.create({
      data: {
        workspaceId,
        type,
        name: input.name?.trim() || existing?.name || defaultDef?.name || type,
        description: input.description?.trim() || existing?.description || defaultDef?.description,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
        version: nextVersion,
        active: true,
      },
    });

    return {
      id: created.id,
      type: created.type,
      name: created.name,
      description: created.description,
      systemPrompt: created.systemPrompt,
      userPromptTemplate: created.userPromptTemplate,
      version: created.version,
      isCustomOverride: true,
      workspaceId: created.workspaceId,
    };
  }

  /**
   * Lists all global prompt templates for Backoffice SuperAdmin management.
   */
  static async listAllGlobalTemplates() {
    return prisma.promptTemplate.findMany({
      where: { workspaceId: null },
      orderBy: [{ type: "asc" }, { version: "desc" }],
    });
  }

  /**
   * Gets version history for a specific global template type.
   */
  static async getGlobalTemplateHistory(type: CommercialArticleType) {
    return prisma.promptTemplate.findMany({
      where: { workspaceId: null, type },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Creates a new version of a global prompt template (SuperAdmin only).
   */
  static async createGlobalVersion(
    type: CommercialArticleType,
    input: {
      name: string;
      description?: string | null;
      systemPrompt: string;
      userPromptTemplate: string;
      selectionMode?: string | null;
      minProducts?: number | null;
      maxProducts?: number | null;
      requiresCategory?: boolean | null;
      allowsSuggestedTitle?: boolean | null;
      variables?: string[];
      active?: boolean;
    }
  ) {
    // Validate variables
    const validation = this.validateTemplateVariables(input.userPromptTemplate, type);
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    const constraint = TEMPLATE_CONSTRAINTS[type];

    // Find highest version
    const latest = await prisma.promptTemplate.findFirst({
      where: { workspaceId: null, type },
      orderBy: { version: "desc" },
    });

    const nextVersion = latest ? latest.version + 1 : 1;
    const shouldBeActive = input.active !== false;

    // If new version is active, deactivate other versions of this type
    if (shouldBeActive) {
      await prisma.promptTemplate.updateMany({
        where: { workspaceId: null, type },
        data: { active: false },
      });
    }

    return prisma.promptTemplate.create({
      data: {
        workspaceId: null,
        type,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
        selectionMode: input.selectionMode || constraint?.selectionMode || null,
        minProducts: input.minProducts !== undefined ? input.minProducts : (constraint?.minProducts ?? null),
        maxProducts: input.maxProducts !== undefined ? input.maxProducts : (constraint?.maxProducts ?? null),
        requiresCategory: input.requiresCategory !== undefined ? input.requiresCategory : (constraint?.requiresCategory ?? false),
        allowsSuggestedTitle: input.allowsSuggestedTitle !== undefined ? input.allowsSuggestedTitle : (constraint?.allowsSuggestedTitle ?? true),
        variables: validation.extractedVariables,
        version: nextVersion,
        active: shouldBeActive,
      },
    });
  }

  /**
   * Sets active status for a specific global prompt template version.
   */
  static async setGlobalActive(id: string, active: boolean) {
    const template = await prisma.promptTemplate.findFirst({
      where: { id, workspaceId: null },
    });

    if (!template) {
      throw new Error(`Template global '${id}' não encontrado.`);
    }

    if (active) {
      // Deactivate others of same type
      await prisma.promptTemplate.updateMany({
        where: { workspaceId: null, type: template.type },
        data: { active: false },
      });
    }

    return prisma.promptTemplate.update({
      where: { id },
      data: { active },
    });
  }

  /**
   * Resets/removes a custom override for a workspace, restoring the system default.
   */
  static async resetOverride(workspaceId: string, type: CommercialArticleType): Promise<void> {
    await prisma.promptTemplate.deleteMany({
      where: {
        workspaceId,
        type,
      },
    });
  }

  /**
   * Interpolates template variables in mustache style {{key.nested}}.
   */
  static renderPrompt(templateText: string, context: Record<string, unknown>): string {
    return templateText.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, keyPath) => {
      const parts = keyPath.split(".");
      let current: unknown = context;

      for (const part of parts) {
        if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return "";
        }
      }

      if (current === null || current === undefined) {
        return "";
      }

      if (typeof current === "object") {
        return JSON.stringify(current, null, 2);
      }

      return String(current);
    });
  }
}
