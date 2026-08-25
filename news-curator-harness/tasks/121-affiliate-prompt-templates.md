# 121 Affiliate Prompt Templates

## Objetivo
Criar prompts por tipo Affiliate.

## Escopo
PromptTemplate com scope/type/name/systemPrompt/userPromptTemplate/version/active e override Workspace. Seeds para Review, Comparison, Best Products, Buying Guide e Problem Solution.

## Definition of Done
- [x] Defaults/override.
- [x] API/UI/preview.
- [x] Version/validation.
- [x] TypeScript/Lint/Tests PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-prompt-templates.ts`, tsc, lint e build.

## Evidence
- `prisma/schema.prisma`:
  - Criado modelo `PromptTemplate` com campos `workspaceId`, `type`, `name`, `description`, `systemPrompt`, `userPromptTemplate`, `version`, `active`, timestamps e índices.
- `src/lib/affiliate/prompt-template-service.ts`:
  - Implementado `AffiliatePromptTemplateService` com seeds completas (`ensureDefaultTemplates`), hierarquia de resolução (Workspace Override -> System Default -> Hardcoded Constants), versionamento incremental automático, interpolação segura de variáveis (`renderPrompt`) e reset de override.
- APIs criadas:
  - `GET /api/affiliate/prompt-templates`: Listagem de templates com status de override do workspace.
  - `GET /api/affiliate/prompt-templates/[type]`: Busca do template efetivo por tipo.
  - `PUT /api/affiliate/prompt-templates/[type]`: Salva/atualiza override com versionamento.
  - `DELETE /api/affiliate/prompt-templates/[type]`: Restaura para o padrão original do sistema.
  - `POST /api/affiliate/prompt-templates/preview`: Renderização do prompt com dados de mock contextual.
- UI criada:
  - `src/components/affiliate/prompt-template-manager.tsx`: Interface completa com alternância entre os 7 tipos, badges de versão, editor de System e User Prompt, botão de teste de preview em tempo real e restauração de padrão.
  - `src/app/(app)/affiliates/prompts/page.tsx`: Página dedicada para configuração de prompts de afiliados.
- Validações:
  - `npx tsx scripts/test-affiliate-prompt-templates.ts`: PASS (7/7 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

