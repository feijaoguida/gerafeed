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
- [ ] Override vence Feed.
- [ ] Feed vence WordPress.
- [ ] WordPress vence Workspace.
- [ ] ausência de override funciona.
- [ ] tenant validation.
- [ ] testes unitários de todas as combinações.
- [ ] TypeScript PASS.
- [ ] Lint PASS.

## Evidence
Registrar matriz de precedência.
