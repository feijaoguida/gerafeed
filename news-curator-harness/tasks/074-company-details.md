# Task 074. Company Details

## Objetivo
Criar área interna operacional do Workspace.

Rota:
`/backoffice/companies/[workspaceId]`

## Seções
- Visão geral
- Plano/cobrança
- Créditos/uso
- Feeds
- WordPress
- IA
- Prompts
- Configurações

## Regras
SuperAdmin pode alterar dados operacionais, mas não visualizar secrets atuais.

## Definition of Done
- [x] rota.
- [x] contexto da empresa.
- [x] navegação interna.
- [x] alteração segura.
- [x] tenant validation.
- [x] secrets protegidos.
- [x] testes.

## Evidence
- Rota operacional `/backoffice/companies/[id]` criada em `src/app/(backoffice)/backoffice/companies/[id]/page.tsx` protegida por SuperAdmin via layout guard e API.
- Interface de contexto operacional criada em `src/components/backoffice/company-details.tsx` com navegação interna por abas (Visão Geral, Plano & Cobrança, Feeds RSS, Destinos WordPress, IA & Prompts, Configurações do Workspace).
- Sanitização estrita de secrets implementada (`hasPassword: true`, `hasApiKey: true`), impedindo vazamento de senhas de aplicação do WordPress ou chaves de API nos payloads da interface do Backoffice.
- Alteração segura de dados da empresa (nome, slug, status ativo) e troca de planos implementada via `PATCH /api/backoffice/companies/[id]`.
- `scripts/test-company-details.ts` executado com 100% de sucesso validando carregamento do contexto da empresa, proteção de secrets, atualização operacional e integração de cotas com `BillingService`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

