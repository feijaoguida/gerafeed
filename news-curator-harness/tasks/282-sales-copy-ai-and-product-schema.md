# Task 282: Schema Prisma de Produto (WooCommerce & Short Description) e Motor de Copywriting com IA Focado em Vendas

## Status
DONE

## Contexto
Atualmente, na importação de produtos (`/affiliates/import`), a descrição extraída do marketplace muitas vezes vem em linha única, curta ou com textos genéricos de cabeçalho ("Frete grátis no dia..."). O usuário solicitou melhorar a descrição do produto na importação e permitir que a IA crie uma descrição com **foco em vender**, além de preparar o modelo `Product` para publicação no WordPress/WooCommerce.

## Escopo de Implementação
1. **Evolução do Modelo `Product` em `prisma/schema.prisma`**:
   - Adicionar campos opcionais:
     - `shortDescription String? @db.Text` (resumo comercial curto para o topo da página no WooCommerce)
     - `wordpressSiteId String?` (site WordPress vinculado à publicação WooCommerce)
     - `woocommerceProductId Int?` (ID do produto criado/sincronizado no WooCommerce)
     - `woocommerceProductUrl String?` (URL pública do produto no WooCommerce)
     - `woocommerceProductType String? @default("external")` (`"external"` ou `"simple"`)
     - `woocommerceLastSyncedAt DateTime?`
   - Sincronizar banco com `npx prisma db push` e regenerar Prisma Client.
2. **Melhoria na Extração de Descrição (`src/lib/affiliate/metadata-extractor.ts` e `src/lib/affiliate/shopee.ts`)**:
   - Preservar quebras de parágrafo na descrição original (`sourceDescription`).
   - Filtrar frases genéricas de boilerplate do marketplace (ex: `"Frete grátis no dia Compre..."`, `"Achadinho do Mercado"`).
   - Quando a descrição textual da página for curta ou ausente, compor automaticamente um resumo estruturado combinando nome, marca, destaques (`specs["O que você precisa saber"]`) e principais características técnicas.
3. **Motor de Copywriting com IA Focado em Vendas (`src/lib/affiliate/sales-copy-service.ts`)**:
   - Criar `ProductSalesCopyService.generateSalesCopy(workspaceId, input)`:
     - Recebe `name`, `brand`, `sourceDescription`, `specs`, `price`, `oldPrice`, `seller`, `sourceRating`, `sourceReviewCount`, `reviewSamples`.
     - Utiliza `getActiveAIProvider(undefined, workspaceId)` com prompt especializado em **Copywriting de Conversão (Framework AIDA — Atenção, Interesse, Desejo, Ação)**:
       - Gera `shortDescription` (2 a 3 frases magnéticas focadas no principal benefício para o WooCommerce);
       - Gera `description` (descrição persuasiva estruturada com gancho de venda, benefícios práticos baseados nas especificações reais, destaques de aprovação/avaliações e chamada para ação);
       - Gera `pros` (3 a 5 pontos positivos objetivos extraídos dos dados do produto).
     - **Guardrails de Fidelidade**: Nunca inventar especificações técnicas, dimensões, garantias ou descontos que não existam nos metadados fornecidos.
     - **Fallback Determinístico**: Caso o Workspace não tenha provedor de IA configurado ou ocorra erro na API externa, construir deterministicamente uma copy comercial persuasiva e bem formatada a partir dos atributos do produto.
4. **Endpoint de Geração de Descrição Vendedora (`src/app/api/affiliate/import/sales-copy/route.ts`) e Integração no Preview**:
   - Criar `POST /api/affiliate/import/sales-copy` protegido por `requireAffiliateWorkspace()`.
   - Suportar parâmetro opcional `generateSalesCopy?: boolean` em `POST /api/affiliate/import/preview` (e `AffiliateService.previewImport`) para já entregar a sugestão de descrição vendedora pronta na revisão da importação.
   - Atualizar `AffiliateService.confirmImport` e `ProductCatalogService` para persistir `shortDescription` e `pros`.

## Critérios de Aceitação
- [x] `prisma/schema.prisma` atualizado com `shortDescription` e campos `woocommerce*` em `Product`, sincronizado via `npx prisma db push`.
- [x] `src/lib/affiliate/metadata-extractor.ts` aprimorado com preservação de parágrafos e remoção de boilerplate.
- [x] `src/lib/affiliate/sales-copy-service.ts` criado com geração via IA (foco em vendas AIDA) e fallback determinístico.
- [x] Rota `POST /api/affiliate/import/sales-copy` funcional e protegida por autenticação e entitlement `AFFILIATE_MODULE`.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `prisma/schema.prisma` atualizado com `shortDescription`, `wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType` e `woocommerceLastSyncedAt`. Sincronizado no PostgreSQL via `npx prisma db push` e tipos gerados via `npx prisma generate`.
- `src/lib/affiliate/metadata-extractor.ts` aprimorado com `cleanDescriptionText` e `buildFallbackDescription`.
- `src/lib/affiliate/shopee.ts` aprimorado para integrar limpeza e fallback de descrição.
- `src/lib/affiliate/sales-copy-service.ts` criado com `ProductSalesCopyService.generateSalesCopy` (framework AIDA, shortDescription, description em HTML e pros) e fallback determinístico `generateDeterministicSalesCopy`.
- `src/app/api/affiliate/import/sales-copy/route.ts` criada e protegida com validação de workspace.
- `AffiliateService.previewImport` e `AffiliateService.confirmImport` atualizados para propagar e persistir copy comercial.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
