# 143 Hide System Prompt Preview

## Objetivo
Remover o bloco de preview do system prompt gerado da tela de configurações de prompt editorial.

## Escopo
- Remover o bloco JSX "Preview do System Prompt Gerado" (seção 3 do formulário em `/settings/ai`, linhas referentes ao `promptPreview`).
- Remover o `useMemo` que calcula `promptPreview` se ele não for utilizado em nenhum outro ponto do componente.
- Remover a importação do `Eye` do `lucide-react` se não for mais utilizada.
- Remover a importação de `buildSystemPrompt` e de `useMemo` de `react` caso não sejam mais necessárias.
- Garantir que o formulário de Prompt Editorial continue salvando e carregando corretamente sem o preview.

## Definition of Done
- [x] Seção de preview removida do JSX em `/settings/ai`.
- [x] Nenhuma importação morta remanescente (`useMemo`, `Eye`, `buildSystemPrompt`).
- [x] Formulário de Prompt Editorial salva e carrega dados corretamente após a remoção.
- [x] TypeScript/Lint/Build PASS.

## Validation
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros).
- Verificação do JSX em `/settings/ai`: bloco "Preview do System Prompt Gerado" removido integralmente sem afetar a funcionalidade de salvamento/carregamento.

## Evidence
- Arquivos alterados:
  - `src/app/(app)/settings/ai/page.tsx`: remoção do bloco JSX de preview, cálculo `promptPreview` e limpeza das importações `useMemo`, `buildSystemPrompt` e `Eye`.
- Comandos executados:
  - `npx tsc --noEmit`: PASS.
  - `npm run lint`: PASS (0 erros).
