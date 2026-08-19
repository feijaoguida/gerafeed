# Task 079. Backoffice Hardening + Audit

## Objetivo
Revisar segurança do Backoffice.

## Checklist
## Checklist
- [x] todas as páginas protegidas.
- [x] APIs protegidas.
- [x] Server Actions protegidas.
- [x] sem secrets em respostas.
- [x] sem secrets em logs.
- [x] tenant validation em operações.
- [x] inativação exige confirmação.
- [x] ações importantes possuem auditoria quando suporte existir.
- [x] não duplicar billing rules.
- [x] testes de autorização.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Build PASS.

## Evidence
- Todas as rotas `/backoffice/**` e `/api/backoffice/**` utilizam estritamente `requireSuperAdmin()` e guardas de layout no Next.js.
- Todas as respostas de WordPress e IA foram auditadas: secrets trafegam exclusivamente criptografados no banco e respostas para o client expõem somente flags booleanas (`hasPassword`, `hasApiKey`).
- Operações de CRUD de feeds, WordPress e IA possuem verificação estrita de tenant (`workspaceId === entity.workspaceId`).
- Ações críticas de exclusão e inativação exigem confirmação explícita na UI.
- `BillingService` permanece como a fonte única da verdade para regras de cotas, limites e faturamento.
- `scripts/test-backoffice-hardening-and-audit.ts` executado com 100% de sucesso.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

