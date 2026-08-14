# Task 027. AI Settings Tabs and Prompt Editorial UI

## Status
TODO

## Objetivo
Refatorar a página de configurações de IA (`/settings/ai`) para ter 2 abas e criar a interface visual da aba "Prompt Editorial" com seleção de área do portal, estilos de escrita e preview do prompt.

## Contexto
As tasks 025 e 026 criaram o backend (API, função `buildSystemPrompt`, integração com providers). Esta task cria a interface visual para o usuário configurar os parâmetros do prompt editorial.

## Escopo
- Refatorar `src/app/settings/ai/page.tsx` para ter **sistema de 2 abas** com `useState` (sem bibliotecas externas):
  - **Aba 1 — Conexão**: Todo o conteúdo atual da página, sem alteração funcional.
  - **Aba 2 — Prompt Editorial**: Nova interface.

### Aba "Prompt Editorial"
- **Área do Portal**: Radio buttons com as opções pré-definidas:
  - Tecnologia, Negócios, Política, Ciência, Saúde, Entretenimento, Esportes, Educação, Humor, Meio Ambiente.
  - Opção "Outro" com campo de texto livre (máximo 100 caracteres).
- **Estilo de Escrita**: Checkboxes com as opções pré-definidas:
  - Informativo, Atraente, Sério, Alegre, Humorístico, Analítico, Provocativo, Casual, Técnico, Persuasivo.
  - Opção "Outro" com campo de texto livre (máximo 100 caracteres).
  - Limite de **3 seleções** — UI deve bloquear novas seleções quando o limite for atingido.
- **Preview do Prompt**: Área read-only mostrando como ficará o trecho do prompt com as configurações atuais.
- **Botão "Salvar Configurações do Prompt"**: Chama `POST /api/ai/prompt-settings`.
- **Carregamento**: Ao entrar na aba, chama `GET /api/ai/prompt-settings` para popular os campos.

### Design
- Seguir o padrão visual existente (zinc/emerald, cards escuros, fontes pequenas).
- Feedback de sucesso/erro com os mesmos padrões de alert da aba Conexão.

## Definition of Done
- [ ] Página `/settings/ai` exibe 2 abas (Conexão e Prompt Editorial).
- [ ] Aba "Conexão" preservada e funcional (sem regressão).
- [ ] Aba "Prompt Editorial" exibe radio buttons para área do portal.
- [ ] Opção "Outro" para área com campo de texto (max 100 chars).
- [ ] Aba exibe checkboxes para estilos de escrita.
- [ ] Limite de 3 estilos de escrita validado na UI (bloqueio visual).
- [ ] Opção "Outro" para estilo com campo de texto (max 100 chars).
- [ ] Preview read-only do prompt gerado é exibido.
- [ ] Botão "Salvar" persiste configurações via API.
- [ ] Carregamento inicial popula campos com dados salvos.
- [ ] Feedback visual de sucesso/erro.
- [ ] TypeScript PASS.
- [ ] Lint PASS.

## Evidence
(A ser preenchido na conclusão)

## Discovered Work
(A ser preenchido na conclusão)
