# Task 284: Interface de Descrição com IA (Foco em Vendas) e Publicação WooCommerce em `/affiliates/import` e `/affiliates/products/[id]`

## Status
DONE

## Evidências de Conclusão
- `src/components/affiliate/affiliate-importer.tsx`:
  - Adicionado toggle "Criar descrição focada em vendas com IA (AIDA)";
  - Integração com `generateSalesCopy` na busca prévia do preview;
  - Botão de reescrita sob demanda com IA vendedora (`POST /api/affiliate/import/sales-copy`);
  - Botão de restauração do texto original do marketplace (`sourceDescription`);
  - Campo de Descrição Curta de vendas (`shortDescription`);
  - Exibição de destaques e benefícios de conversão (`pros`);
  - Bloco de publicação no WordPress / WooCommerce com seleção de site, tipo (`external` / `simple`), texto do botão de compra e status (`publish` / `draft`);
  - Link direto de visualização na loja WooCommerce no feedback de sucesso.
- `src/components/affiliate/product-detail.tsx`:
  - Interface `ProductData` atualizada com os campos de sincronização WooCommerce (`shortDescription`, `wordpressSiteId`, `woocommerceProductId`, `woocommerceProductUrl`, `woocommerceProductType`, `woocommerceLastSyncedAt`);
  - Campo de `shortDescription` adicionado na aba "Produto & Editorial";
  - Botão "Gerar Copy de Vendas com IA" integrado com feedback de carregamento;
  - Card lateral "WordPress / WooCommerce" com badge de sincronização ID `#woocommerceProductId`, link externo para o produto na loja, seleção de site WP, tipo de produto, texto do botão de compra, status de publicação e botão de ação ("Publicar no WooCommerce" / "Atualizar no WooCommerce").
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros).
  - `npm run lint`: PASS (0 erros).

## Contexto
Disponibilizar na interface de **Importar Produto (`/affiliates/import`)** e na tela de **Detalhes do Produto (`/affiliates/products/[id]`)** os controles visuais para:
1. Gerar/melhorar a descrição do produto com IA focada em vender;
2. Publicar (ou atualizar) o produto diretamente no WordPress para leitura pelo WooCommerce.

## Escopo de Implementação
1. **Evolução do Importador de Produtos (`src/components/affiliate/affiliate-importer.tsx`)**:
   - Adicionar toggle **"✨ Criar descrição com foco em vendas (IA)"** (marcado por padrão ao buscar os dados do link).
   - Na revisão do produto importado:
     - Exibir botão **"✨ Gerar / Melhorar Descrição para Vender (IA)"** que chama `POST /api/affiliate/import/sales-copy` e preenche automaticamente:
       - **Descrição Curta (Resumo para WooCommerce)** (`shortDescription`);
       - **Descrição Completa Focada em Vendas** (`description`);
       - **Pontos Positivos Sugeridos (`pros`)**.
     - Permitir alternar ou restaurar a descrição original do marketplace (`sourceDescription`) a qualquer momento.
   - Adicionar seção **"Publicar Produto no WordPress (WooCommerce)"**:
     - Checkbox **"Publicar no WordPress / WooCommerce ao salvar"**;
     - Seletor de **Site WordPress** (carregado de `/api/wordpress/sites`);
     - Seletor de **Tipo de Produto no WooCommerce**:
       - `Produto Externo / Afiliado (Botão redireciona para o Link de Afiliado)` — padrão;
       - `Produto Simples (Catálogo WooCommerce)`;
     - Campo **Texto do Botão de Compra** (ex: `"Comprar no Mercado Livre"`, `"Comprar na Shopee"`, `"Ver Oferta Especial"`);
     - Seletor de **Status no WooCommerce**: `Publicado (Visível na Loja)` ou `Rascunho`.
   - Exibir no feedback de sucesso o link direto para visualizar o produto publicado no WooCommerce (`woocommerceProductUrl`) quando a opção estiver ativa.
2. **Evolução da Tela de Detalhes do Produto (`src/components/affiliate/product-detail.tsx`)**:
   - Na aba **"Produto & Editorial"**:
     - Adicionar campo **Descrição Curta (WooCommerce / Resumo de Venda)** (`shortDescription`);
     - Adicionar botão **"✨ Reescrever Descrição com Foco em Vendas (IA)"** ao lado do campo de descrição.
   - Na barra lateral / topo do produto:
     - Adicionar card **"WordPress / WooCommerce"**:
       - Exibe o status atual (Não publicado ou Publicado com ID `#woocommerceProductId`, data da última sincronização e link externo para abrir na loja);
       - Permite selecionar o Site WordPress, Tipo (`Externo/Afiliado` ou `Simples`), Texto do Botão e clicar em **"Publicar no WooCommerce"** (ou **"Atualizar no WooCommerce"**).

## Critérios de Aceitação
- [x] `src/components/affiliate/affiliate-importer.tsx` atualizado com geração de descrição vendedora por IA, campo `shortDescription` e opções de publicação direta no WooCommerce.
- [x] `src/components/affiliate/product-detail.tsx` atualizado com botão de descrição vendedora por IA e card de publicação/atualização no WooCommerce.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.
