import { prisma } from "../src/lib/prisma";
import {
  AffiliatePromptTemplateService,
  DEFAULT_AFFILIATE_PROMPT_TEMPLATES,
  TEMPLATE_CONSTRAINTS,
} from "../src/lib/affiliate/prompt-template-service";

async function main() {
  const apply = process.argv.includes("--apply");
  if (apply && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname)) {
    throw new Error("Este script aplica alterações somente no banco local. Use o Backoffice para outros ambientes.");
  }
  for (const type of ["PRODUCT_REVIEW", "COMPARISON"] as const) {
    const definition = DEFAULT_AFFILIATE_PROMPT_TEMPLATES[type];
    const validation = AffiliatePromptTemplateService.validateTemplateVariables(definition.userPromptTemplate, type);
    if (!validation.valid) throw new Error(validation.errors.join("; "));
    const result = await prisma.$transaction(async (tx) => {
      const active = await tx.promptTemplate.findFirst({
        where: { workspaceId: null, type, active: true }, orderBy: { version: "desc" },
      });
      if (active?.systemPrompt === definition.systemPrompt && active.userPromptTemplate === definition.userPromptTemplate) {
        return `já atualizado (v${active.version})`;
      }
      const latest = await tx.promptTemplate.findFirst({
        where: { workspaceId: null, type }, orderBy: { version: "desc" },
      });
      const version = (latest?.version || 0) + 1;
      if (!apply) return `nova versão prevista: v${version} (use --apply)`;
      const constraint = TEMPLATE_CONSTRAINTS[type];
      await tx.promptTemplate.updateMany({ where: { workspaceId: null, type, active: true }, data: { active: false } });
      await tx.promptTemplate.create({ data: {
        ...definition,
        workspaceId: null,
        version,
        active: true,
        selectionMode: active?.selectionMode ?? constraint.selectionMode,
        minProducts: active?.minProducts ?? constraint.minProducts,
        maxProducts: active ? active.maxProducts : constraint.maxProducts,
        requiresCategory: active?.requiresCategory ?? constraint.requiresCategory,
        allowsSuggestedTitle: active?.allowsSuggestedTitle ?? constraint.allowsSuggestedTitle,
        variables: validation.extractedVariables,
      } });
      return `atualizado (v${version}); versões anteriores preservadas`;
    });
    console.log(`${type}: ${result}`);
  }
}

main().catch(() => {
  console.error("Falha ao versionar os prompts. Verifique a conexão com o banco local e as variáveis do template.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
