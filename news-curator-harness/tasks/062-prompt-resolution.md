# Task 062. Prompt Resolution

## Objetivo
Centralizar a resolução do tipo de prompt para cada combinação Feed + WordPress.

## Hierarquia
```text
Feed ↔ WordPress override
→ Feed default
→ WordPress default
→ Workspace default
```

## Escopo
Criar serviço/função equivalente a:

`resolvePromptType({ workspaceId, sourceId, wordpressSiteId })`

Não duplicar regra no frontend.

## Definition of Done
- [x] Override vence Feed.
- [x] Feed vence WordPress.
- [x] WordPress vence Workspace.
- [x] ausência de override funciona.
- [x] tenant validation.
- [x] testes unitários de todas as combinações.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- `src/lib/prompt-resolution.ts` criado com o serviço centralizado `resolvePromptType({ workspaceId, sourceId, wordpressSiteId })`.
- Matriz de precedência validada via `scripts/test-prompt-resolution.ts`:
  1. Caso 1: Override vence Feed, Site e Workspace -> `origin: "OVERRIDE"`.
  2. Caso 2: Sem Override, Feed default vence Site default e Workspace -> `origin: "SOURCE_DEFAULT"`.
  3. Caso 3: Sem Override e sem Feed default, Site default vence Workspace -> `origin: "WORDPRESS_SITE_DEFAULT"`.
  4. Caso 4: Sem níveis específicos, fallback para Workspace -> `origin: "WORKSPACE_DEFAULT"`.
  5. Isolamento multi-tenant: validação estrita impede que entidades de outro Workspace afetem a resolução.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

