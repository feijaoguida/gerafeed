# Task 025. AI Prompt Settings API

## Status
TODO

## Objetivo
Criar o endpoint backend e a função de construção dinâmica do prompt editorial.

## Contexto
Atualmente o `SYSTEM_PROMPT_EDITORIAL` é uma constante fixa em `src/lib/ai/types.ts`. O usuário precisa poder personalizar a área do portal e o estilo de escrita via interface. Esta task cria a infraestrutura backend: a API para salvar/carregar as configurações e a função que constrói o prompt dinamicamente.

## Escopo
- Criar endpoint `GET/POST /api/ai/prompt-settings` (`src/app/api/ai/prompt-settings/route.ts`).
  - **GET**: Retorna configurações salvas da chave `aiPromptSettings` na tabela `Configuration`.
  - **POST**: Valida e salva. Regras de validação:
    - `writingStyles`: array com no máximo 3 itens.
    - `customPortalArea`: string com máximo 100 caracteres.
    - `customWritingStyle`: string com máximo 100 caracteres.
- Criar interface `PromptSettings` em `src/lib/ai/types.ts`:
  ```typescript
  export interface PromptSettings {
    portalArea: string;
    customPortalArea: string;
    writingStyles: string[];
    customWritingStyle: string;
  }
  ```
- Transformar `SYSTEM_PROMPT_EDITORIAL` (constante) em função `buildSystemPrompt(settings?: PromptSettings)`:
  - Sem argumentos → retorna o prompt padrão atual (retrocompatível, "portal de notícias de tecnologia e negócios", estilo "atraente").
  - Com argumentos → injeta a área e os estilos escolhidos no texto do prompt.
- Manter o export `SYSTEM_PROMPT_EDITORIAL` como alias para `buildSystemPrompt()` (sem args) para não quebrar imports existentes.

## Definition of Done
- [ ] Endpoint `GET /api/ai/prompt-settings` retorna configurações salvas (ou defaults).
- [ ] Endpoint `POST /api/ai/prompt-settings` valida e salva na chave `aiPromptSettings`.
- [ ] Validação: máximo 3 estilos, máximo 100 chars nos campos livres.
- [ ] Interface `PromptSettings` criada.
- [ ] Função `buildSystemPrompt(settings?)` criada e exportada.
- [ ] `buildSystemPrompt()` sem args retorna prompt idêntico ao `SYSTEM_PROMPT_EDITORIAL` original.
- [ ] `buildSystemPrompt(settings)` com args injeta área e estilos no prompt.
- [ ] Export `SYSTEM_PROMPT_EDITORIAL` preservado como alias retrocompatível.
- [ ] TypeScript PASS.
- [ ] Lint PASS.

## Evidence
(A ser preenchido na conclusão)

## Discovered Work
(A ser preenchido na conclusão)
