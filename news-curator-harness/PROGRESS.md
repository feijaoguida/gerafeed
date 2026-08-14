# PROGRESS.md

## Current Phase
Phase 4 — Prompt Customization

## Current Task
Nenhuma

## Status
TODO

## Phase 1
Core MVP (Concluído)

## Phase 2
Configurable System (Concluído)

## Phase 3
Media & Attribution 100% Concluído.

## Phase 4
Prompt Customization — 100% Concluído.

Tasks:
- 025-ai-prompt-settings-api — DONE
- 026-migrate-providers-dynamic-prompt — DONE
- 027-ai-settings-tabs-prompt-ui — DONE

## Pending
- Nenhuma

## Completed
- Phase 1
- Phase 2
- Phase 3:
  - 020-rss-source-credit
  - 021-image-strategy-settings
  - 022-image-processing-pipeline
  - 023-article-editor-images
  - 024-article-generation-attribution
- Phase 4:
  - 025-ai-prompt-settings-api
  - 026-migrate-providers-dynamic-prompt
  - 027-ai-settings-tabs-prompt-ui

## In Progress
- Nenhuma

## Blocked
- Nenhuma

## Last Evidence
Phase 4 (Prompt Customization) finalizada com sucesso!
- Task 025: Endpoint `GET/POST /api/ai/prompt-settings` e `buildSystemPrompt` dinâmico implementados.
- Task 026: Todos os 4 provedores de IA e `processArticleWithAi` migrados para consumir configurações dinâmicas de prompt editorial.
- Task 027: Interface de configurações `/settings/ai` com 2 abas ("Conexão" e "Prompt Editorial"), seleção de área com opção livre, seleção de até 3 estilos com opção livre, preview dinâmico e persistência via API.
- Testes automatizados executados e validados:
  - `scripts/test-ai-prompt-settings.ts`: PASS
  - `scripts/test-dynamic-prompt-migration.ts`: PASS
  - `scripts/test-settings-ai-ui.ts`: PASS
- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS



