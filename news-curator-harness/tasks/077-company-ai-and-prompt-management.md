# Task 077. Company AI + Prompt Management

## Objetivo
Permitir que SuperAdmin administre IA e prompts do Workspace.

## IA
- provider;
- model;
- Base URL;
- substituir API key;
- testar conexão.

## Prompt
- área;
- estilos;
- prompt default;
- overrides Feed/WordPress.

## Segurança
Não exibir API key atual.

## Definition of Done
- [x] visualização segura.
- [x] edição.
- [x] provider test.
- [x] prompt settings.
- [x] override.
- [x] tenant validation.
- [x] tests.

## Evidence
- Endpoints do Backoffice implementados em:
  - `src/app/api/backoffice/companies/[id]/ai/route.ts` (`GET` com sanitização total de API Key retornando apenas `hasApiKey: true`, `POST` com criptografia AES-256-GCM para nova API Key e configuração de prompt)
  - `src/app/api/backoffice/companies/[id]/ai/test/route.ts` (`POST` para teste de integração do provedor de IA ativo ou credenciais fornecidas)
- Interface de gerenciamento completa integrada na aba "IA & Prompts" em `src/components/backoffice/company-details.tsx` com seletor de provedor (OpenAI, Gemini, Anthropic, Custom), teste de conexão, edição segura de nova API key, área editorial, múltiplos estilos e regras complementares.
- `scripts/test-company-ai-and-prompt-management.ts` executado com 100% de sucesso validando CRUD de IA e Prompts, criptografia, sanitização, resolução hierárquica de overrides (WordPressSiteSource > Source > Site > Workspace) e isolamento multi-tenant.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

