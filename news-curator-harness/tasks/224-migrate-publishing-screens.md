# Task 224. Migrate Publishing Screens (Hub, RSS Queue, Affiliate Queue)

## Objetivo
Migrar as telas da Central de Publicação unificada para os padrões visuais e componentes do GeraFeed.

## Telas Afetadas
1. `src/app/(app)/publishing/page.tsx`:
   - Hub de publicação com cards de seleção de fila (RSS vs Afiliados), estatísticas e orientações.
2. `src/app/(app)/publishing/rss/page.tsx`:
   - Fila de publicação editorial RSS: tabela/cards, validação de WordPress e ações em lote.
3. `src/app/(app)/publishing/affiliate/page.tsx`:
   - Fila de publicação de artigos de produtos afiliados.

## Critérios de Aceite
- [ ] Formulários, tabelas e cards padronizados.
- [ ] Modo Claro e Escuro consistentes.
- [ ] TypeScript PASS e Lint PASS.
