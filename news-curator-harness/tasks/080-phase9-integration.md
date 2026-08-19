# Task 080. Phase 9 Integration

## Objetivo
Validar Backoffice completo.

## Cenários
1. Login como superAdmin.
2. Login como usuário comum.
3. SuperAdmin vê dashboard.
4. Usuário comum recebe forbidden.
5. Criar/editar plano.
6. Alterar Features e limites.
7. Pesquisar empresa.
8. Inativar empresa.
9. Abrir empresa.
10. Alterar Feed.
11. Alterar WordPress.
12. Alterar IA.
13. Alterar prompt.
14. Ver plano/créditos.
15. Verificar que secrets não aparecem.

## Definition of Done
- [x] todos os cenários PASS.
- [x] nenhuma regressão da área funcional.
- [x] tenant isolation PASS.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Build PASS.
- [x] Testes PASS.

## Evidence
- `scripts/test-phase9-integration.ts` executou com sucesso todos os 15 cenários de integração da Fase 9:
  1. Autenticação de SuperAdmin com acesso total.
  2. Rejeição com 403 Forbidden para usuários comuns.
  3. Acesso e visualização do dashboard do Backoffice.
  4. Bloqueio em layout e rotas de API.
  5. Criação e edição de planos (Plano Enterprise P9).
  6. Gestão de features e cotas de limites.
  7. Pesquisa e paginação de empresas.
  8. Inativação e reativação segura de empresas.
  9. Visualização de detalhes completos da empresa.
  10. Criação e edição de feeds com prompt default.
  11. Conexão e vinculação de sites WordPress.
  12. Configuração de IA com criptografia AES-256-GCM.
  13. Diretrizes editoriais e resolução hierárquica de prompt overrides.
  14. Visualização de consumo e créditos via `BillingService`.
  15. Auditoria de segredos (Application Password e AI API Key nunca expostos ao client).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

