# Task: 021-image-strategy-settings

## Status
DONE

## Objetivo
Criar a configuração central de estratégia de imagens.

## Contexto
O usuário deve poder escolher se o sistema usará imagens originais ou versões modificadas/processadas por padrão.

## Escopo
- Criar a interface de UI `Configurações > Imagens` (`app/settings/images`).
- Opções: "Usar imagem original" ou "Processar/Alterar imagem".
- Salvar a escolha na tabela `Configuration` com a key `imageSettings`.

## Definition of Done
- [x] Tela de configuração de imagens criada.
- [x] Leitura e gravação na tabela `Configuration` funcionando.
- [x] Nenhuma quebra no layout do menu lateral.

## Evidence
- Interface visual desenvolvida em `src/app/settings/images/page.tsx` com opção de alternar entre `ORIGINAL` ("Usar Imagem Original") e `MODIFIED` ("Processar / Alterar Imagem").
- Rotas REST `GET /api/images/config` e `POST /api/images/config` integradas à tabela `Configuration` (chave `imageSettings`).
- Menu lateral `Sidebar` (`src/components/sidebar.tsx`) atualizado com o atalho "Estratégia de Imagens" (`/settings/images`).
- Script de teste `scripts/test-image-strategy-settings.ts` executado com sucesso validando persistência e atualização da chave no banco.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 1328ms)

## Status
DONE
