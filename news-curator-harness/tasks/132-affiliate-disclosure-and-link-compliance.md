# 132 Affiliate Disclosure And Link Compliance

## Objetivo
Padronizar disclosure e atributos de link.

## Escopo
Links usam rel=sponsored nofollow. Disclosure default configurável no Workspace. Canal Mercado Livre é assumido validado externamente.

## Definition of Done
- [x] sponsored/nofollow.
- [x] disclosure/default/override.
- [x] Tests.
- [x] TypeScript/Lint PASS.

## Validation
Executar testes automatizados em `scripts/test-affiliate-compliance.ts`, tsc, lint e build.

## Evidence
- `src/lib/publisher/compliance.ts`:
  - Implementado `AffiliateComplianceService` com `getWorkspaceDisclosure`, `setWorkspaceDisclosure` e `enforceLinkCompliance`.
  - Gestão de hierarquia de disclosure editorial: Override Explícito do Bloco > Configuração Customizada do Workspace > Default Global.
  - Função de higienização de links para injeção e normalização de `rel="sponsored nofollow noopener"` e `target="_blank"`.
- `src/lib/publisher/wordpress-renderer.ts`:
  - Integrada resolução automática do disclosure do workspace no `WordPressAffiliateRenderer`.
- Validações:
  - `npx tsx scripts/test-affiliate-compliance.ts`: PASS (4/4 checks).
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros, 0 avisos).

