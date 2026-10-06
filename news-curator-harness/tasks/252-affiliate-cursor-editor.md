# Task 252. Inserção e edição de cards no cursor

## Status
DONE — implementada, validada em testes unitários e de navegador; evidências registradas.

## Dependências
249 e 251.

## Objetivo
Oferecer inserção no ponto escolhido do corpo em revisões RSS e comerciais, com
busca de produtos, seleção múltipla e preview visual dos modelos.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `src/app/(app)/articles/[id]/page.tsx`
- `src/components/affiliate/affiliate-article-editor.tsx`
- Contratos 247, modelos 249 e catálogo paginado

## Escopo e critérios de aceitação
- [x] Exibir “Inserir produto afiliado” somente com entitlement confirmado; estado inicial falha fechado.
- [x] Capturar cursor/seleção antes de abrir seletor acessível; busca paginada, seleção múltipla, modelo e CTA.
- [x] Preservar posição durante interação, inserir no início da seleção sem apagar texto e restaurar foco.
- [x] Inserir em início/meio/fim; dividir parágrafo validamente quando necessário; rejeitar cursor dentro de tag/atributo/marcador.
- [x] Tratar alteração do corpo com seletor aberto sem aplicar índice antigo silenciosamente.
- [x] Mostrar preview real dos blocos, permitir editar configuração, duplicar e remover cada ocorrência.
- [x] Cancelar não altera conteúdo; múltiplas ocorrências do mesmo produto são permitidas.
- [x] Integrar contratos de save mantendo texto, ordem e identidade estável; UI não exige manipular JSON.

## Validação obrigatória
- Teste de navegador: selecionar posição → abrir seletor → buscar → inserir → conferir posição/foco/texto.
- Testar início/meio/fim, seleção de texto, conteúdo vazio, tag inválida, cancelamento e corpo alterado.
- Testar cinco modelos, um/vários produtos, editar/duplicar/remover e recarregar após salvar.
- Conferir teclado, rótulos, responsividade e ausência de ferramenta para plano sem módulo.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS (0 erros, 5 avisos preexistentes).
- [x] Testes aplicáveis: PASS (`cursor-editor.test.ts`: 5/5, `cursor-browser.mjs`: PASS em Chromium).
- [x] `npm run build`: PASS (compilação de produção aprovada).
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- `src/components/affiliate/affiliate-block-manager.tsx` criado com controle fail-closed de entitlement, botão de inserção no cursor, modal acessível com busca paginada no catálogo, seleção de 1 a 20 produtos, cinco layouts visuais (IMAGE_CARD, TEXT_CARD, GRID, CAROUSEL, BUTTON), CTA personalizável, pré-visualização em tempo real e listagem de ocorrências com preview, edição, duplicação e remoção.
- `src/lib/affiliate/editor-document.ts` expandido com funções utilitárias `parseBlockOccurrences`, `removeBlockOccurrence`, `duplicateBlockOccurrence` e `updateBlockOccurrence`.
- Integração em `src/app/(app)/articles/[id]/page.tsx` (revisão editorial RSS) e `src/components/affiliate/affiliate-article-editor.tsx` (revisão comercial), sincronizando `content` e `canonicalContent` no carregamento e no salvamento de rascunho sem manipulação manual de JSON pelo usuário.
- `node --import tsx --test scripts/phase30/cursor-editor.test.ts`: PASS (5 testes unitários cobrindo início, meio, fim, seleção de texto, conteúdo vazio, rejeição de tags/entidades/marcadores inválidos e manipulação de ocorrências).
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/phase30-browsers node --import tsx scripts/phase30/cursor-browser.mjs`: PASS em Chromium headless com banco local temporário e usuário/workspace limpos ao término.
- Cenários validados no navegador:
  - Omissão da ferramenta quando o plano não possui a feature `AFFILIATE_MODULE`.
  - Exibição de alerta inline e recusa de abertura de modal com cursor posicionado dentro de tag HTML.
  - Inserção no meio de parágrafo preservando HTML válido para os dois fragmentos.
  - Busca paginada no catálogo e seleção múltipla.
  - Alternância entre os 5 modelos e visualização do preview real com botão patrocinado.
  - Cancelamento sem alteração no conteúdo.
  - Detecção de alteração externa no textarea com o modal aberto, impedindo inserção silenciosa em índice obsoleto.
  - Inserção válida no início e no fim do conteúdo.
  - Painel de blocos inseridos exibindo visual preview real, duplicação de ocorrência com novo ID e remoção.
  - Edição de bloco existente e sincronização imediata do marcador no textarea.
  - Salvamento de rascunho e recarregamento da página comprovando persistência de blocos e canônico.
  - Validação no editor comercial com persistência de `canonicalContent` no banco de dados.
  - Layout responsivo verificado em 390px e 1280px.
- Capturas visuais geradas: `/tmp/phase30-editor-390.png` e `/tmp/phase30-editor-1280.png`.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS (0 erros, 5 avisos preexistentes em outros arquivos).
- `npm run build`: PASS (compilação completa de produção com sucesso).
- Nenhuma publicação em produção ou modificação de dados reais.
