# Task 307 — Debounce em Buscas, Deduplicação no Frontend, Optimistic UI e Otimizações no `next.config.ts` (Pilares 6, 7 e 8)

## Objetivo
Implementar *debounce* de 400ms nos campos de busca e filtros que disparam requisições à API, corrigir o loop de re-fetch a cada tecla digitada no `AffiliateBlockManager`, aplicar *Optimistic UI* em ações frequentes de listagem e adicionar otimizações de compressão, bundle e cache de imagens estáticas em `next.config.ts`.

## Escopo Técnico

### 1. Hook `useDebounce` e Aplicação em Campos de Busca (Pilar 7)
- Criar `src/hooks/use-debounce.ts` exportando `useDebounce<T>(value: T, delay = 400): T`.
- Aplicar `useDebounce` nos componentes que fazem `fetch` reativo à digitação:
  - **`src/components/affiliate/product-list.tsx`**: usar `debouncedSearch = useDebounce(search, 400)` como dependência do `loadProducts` em vez de `search` direto.
  - **`src/components/backoffice/company-list.tsx`**: usar `debouncedSearch = useDebounce(search, 400)` para disparar `fetchCompanies`, mantendo o `input` controlado sem travar a digitação.
  - **`src/components/backoffice/error-logs-viewer.tsx`**: usar `debouncedSearch = useDebounce(search, 400)` no efeito de carregamento de logs.
  - **`src/components/publishing/rss-publishing-queue.tsx`**: usar `debouncedDateFrom` e `debouncedDateTo` (400ms) para evitar disparos intermediários de `fetchData` enquanto o usuário digita/altera datas.

### 2. Deduplicação de Fetch no Editor de Artigos e Optimistic UI (Pilar 6)
- **`src/components/affiliate/affiliate-block-manager.tsx`**:
  - Adicionar `attemptedProductIdsRef = useRef<Set<string>>(new Set())` para rastrear IDs já consultados e evitar que um ID de produto inexistente em `contentHtml` dispare `fetch("/api/affiliate/products?limit=100")` a cada tecla digitada no editor de artigos.
- **`src/components/affiliate/offer-list.tsx`**:
  - Em `handleDelete`: aplicar *Optimistic UI* removendo a oferta visualmente da lista imediatamente e restaurando-a caso a chamada `DELETE` falhe, sem recarregar toda a tabela.
- **`src/components/affiliate/product-list.tsx`**:
  - Em `handleRefreshProduct`: atualizar os dados do produto diretamente no estado local quando a resposta retornar (ou manter atualização localizada sem bloquear toda a tabela com spinner global).

### 3. Otimizações de Rede, Compressão e Cache no `next.config.ts` (Pilar 8)
- Em `next.config.ts`:
  - Configurar `compress: true` e `poweredByHeader: false`.
  - Configurar `experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] }`.
  - Adicionar regra de cache imutável em `headers()` para `/modified-images/:path*` com `Cache-Control: public, max-age=31536000, immutable`.

## Critérios de Aceite (Definition of Done)
- [ ] `src/hooks/use-debounce.ts` criado e integrado em `product-list.tsx`, `company-list.tsx`, `error-logs-viewer.tsx` e `rss-publishing-queue.tsx`.
- [ ] `affiliate-block-manager.tsx` protegido com `useRef<Set<string>>` contra chamadas repetidas para o mesmo produto.
- [ ] `offer-list.tsx` aplicando *Optimistic UI* na exclusão de ofertas.
- [ ] `next.config.ts` configurado com `compress: true`, `poweredByHeader: false`, `optimizePackageImports` e `Cache-Control` para `/modified-images/:path*`.
- [ ] `npx tsc --noEmit` e `npm run lint` passando sem erros.

