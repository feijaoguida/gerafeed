# Task 025. AI Prompt Settings API

## Status
DONE

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
- [x] Endpoint `GET /api/ai/prompt-settings` retorna configurações salvas (ou defaults).
- [x] Endpoint `POST /api/ai/prompt-settings` valida e salva na chave `aiPromptSettings`.
- [x] Validação: máximo 3 estilos, máximo 100 chars nos campos livres.
- [x] Interface `PromptSettings` criada.
- [x] Função `buildSystemPrompt(settings?)` criada e exportada.
- [x] `buildSystemPrompt()` sem args retorna prompt idêntico ao `SYSTEM_PROMPT_EDITORIAL` original.
- [x] `buildSystemPrompt(settings)` com args injeta área e estilos no prompt.
- [x] Export `SYSTEM_PROMPT_EDITORIAL` preservado como alias retrocompatível.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- `src/lib/ai/types.ts` atualizado com interface `PromptSettings`, `DEFAULT_PROMPT_SETTINGS`, função `buildSystemPrompt` e alias `SYSTEM_PROMPT_EDITORIAL`.
- `src/app/api/ai/prompt-settings/route.ts` criado implementando `GET` e `POST` com validação de payload (max 3 estilos, max 100 caracteres para campos de texto).
- Script de teste automatizado `scripts/test-ai-prompt-settings.ts` criado e executado com sucesso:
  - `buildSystemPrompt()` sem args produz saída idêntica ao `SYSTEM_PROMPT_EDITORIAL` canônico.
  - `buildSystemPrompt(customSettings)` injeta área do portal e lista de estilos corretamente.
  - Opções `Outro` com texto livre personalizam área e estilo conforme especificado.
  - `GET /api/ai/prompt-settings` retorna defaults quando banco está limpo e dados salvos quando configurado.
  - `POST /api/ai/prompt-settings` rejeita > 3 estilos com status 400.
  - `POST /api/ai/prompt-settings` rejeita `customPortalArea` > 100 caracteres com status 400.
  - `POST /api/ai/prompt-settings` rejeita `customWritingStyle` > 100 caracteres com status 400.
  - `POST` e persistência no banco validados com persistência e recuperação via Prisma / `Configuration`.
- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS

## Discovered Work
Nenhum.
