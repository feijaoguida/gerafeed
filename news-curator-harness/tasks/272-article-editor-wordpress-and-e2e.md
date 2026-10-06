# Task 272: Editor de Artigos, Publicação WordPress e Testes E2E da Phase 33

## Status
DONE

## Contexto
Consolidar e validar a entrega completa da Phase 33:
1. **Editor de Artigos (`/articles/[id]`)**:
   - No card **Mídia Destacada**, exibir até 3 opções de imagens com rádio e preview:
     - `ORIGINAL`: Imagem do RSS original.
     - `MODIFIED`: Imagem invertida/filtrada com Sharp.
     - `AI_GENERATED`: Nova imagem gerada por IA com badge do estilo (ex: Realista, Cartoon, Charge) e botão/modal para visualizar o prompt utilizado.
   - Botão avulso "Gerar Imagem com IA" / "Regenerar Imagem" com spinner de carregamento e atualização reativa do card sem recarregar a tela.
2. **Publicação no WordPress (`src/lib/wordpress.ts`)**:
   - Na função `publishArticleToWordPress`, se `article.selectedImage === "AI_GENERATED"`, utilizar `article.generatedImageUrl` como a mídia destacada enviada para o WordPress (`uploadMediaToWordPress`).
   - Garantir suporte a Data URI e URLs remotas para o upload da imagem na biblioteca de mídia do WordPress.
3. **Validação e Testes Automatizados E2E**:
   - Criar script `scripts/phase33/test-phase33-e2e.ts` cobrindo:
     - Cenário 1: Processamento com estratégia `ORIGINAL` (sem chamada de imagem por IA).
     - Cenário 2: Processamento com estratégia `MODIFIED` (apenas inversão Sharp, sem IA).
     - Cenário 3: Processamento com estratégia `AI_GENERATED` e estilo Realista.
     - Cenário 4: Geração sob demanda via endpoint `/api/articles/[id]/generate-image`.
     - Cenário 5: Herança de credenciais da LLM e comportamento Anthropic (alerta).
     - Cenário 6: Upload e publicação de imagem gerada para WordPress.
   - `npx tsc --noEmit` PASS (0 erros).
   - `npm run lint` PASS (0 erros).
   - `npm run build` PASS (100% das rotas Next.js).
   - Registro de evidências no `PROGRESS.md`.

## Critérios de Aceitação
- [x] Card de Mídia Destacada atualizado em `src/app/(app)/articles/[id]/page.tsx` suportando as 3 imagens e botão de geração avulsa.
- [x] Upload da imagem de IA para WordPress validado em `src/lib/wordpress.ts`.
- [x] Script de teste E2E criado em `scripts/phase33/test-phase33-e2e.ts` e executado com sucesso.
- [x] `npx tsc --noEmit` PASS.
- [x] `npm run lint` PASS.
- [x] `npm run build` PASS.
- [x] Evidências registradas no `news-curator-harness/PROGRESS.md`.

## Evidências
- `src/app/(app)/articles/[id]/page.tsx`: Card de Mídia Destacada reestruturado em grid de 3 colunas com Original (RSS), Invertida (Sharp) e Gerada por IA, exibição de badge ATIVA, pré-visualização de imagem, botão de visualização do prompt de IA utilizado e botão avulso no topo do card com spinner para gerar/regenerar sob demanda.
- `src/lib/wordpress.ts`: Suporte nativo completo a Data URIs (`data:image/...;base64,...`) em `uploadMediaToWordPress` e priorização de `generatedImageUrl` quando `selectedImage === "AI_GENERATED"` em `publishArticleToWordPress`.
- `src/app/api/articles/[id]/approve/route.ts` & `src/lib/affiliate/article-persistence-service.ts`: Suporte a `AI_GENERATED` liberado nos endpoints de salvamento e aprovação.
- `scripts/phase33/test-phase33-e2e.ts`: 100% PASS em todos os 6 cenários (ORIGINAL zero token waste, MODIFIED zero token waste, AI_GENERATED com extração semântica e estilo visual, endpoint sob demanda, barreira Anthropic e resolução de mídia WordPress).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (95/95 rotas Next.js geradas com sucesso).

## Definition of Done
- Todos os critérios atendidos.
- Fluxo de ponta a ponta validado.
- Build Next.js sem erros.
- Evidências completas registradas.
