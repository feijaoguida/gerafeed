# Task 287: Validação de Plano e Endpoint de Teste WooCommerce

## Status
DONE

## Contexto
Garantir que a configuração das chaves de API do WooCommerce esteja acessível apenas para workspaces cujo plano inclui o módulo de Afiliados, e fornecer um endpoint para testar a conectividade da WooCommerce REST API.

## Escopo de Implementação
1. **API de Listagem de Sites (`GET /api/wordpress/sites` e `GET /api/wordpress/sites/[id]`)**:
   - Consultar `BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)`.
   - Retornar a propriedade `canConfigureWooCommerce: boolean` junto com os sites/detalhes.
2. **API de Criação e Atualização (`POST /api/wordpress/sites` e `PUT /api/wordpress/sites/[id]`)**:
   - Se o payload contiver `woocommerceConsumerKey` ou `woocommerceConsumerSecret`:
     - Executar `BillingService.assertFeature(workspaceId, AFFILIATE_FEATURES.MODULE, "Configuração do WooCommerce disponível apenas para planos com módulo de Afiliados.")`.
     - Caso não tenha o plano, retornar HTTP 403 Forbidden com mensagem clara.
   - Permitir salvar/atualizar `woocommerceConsumerKey` e `woocommerceConsumerSecret`.
3. **Endpoint de Teste WooCommerce (`POST /api/wordpress/sites/[id]/test-woocommerce`)**:
   - Decriptar as credenciais do site;
   - Fazer requisição leve `GET /wp-json/wc/v3/system_status` ou `GET /wp-json/wc/v3/products?per_page=1` autenticando com as chaves;
   - Retornar sucesso com versão do WooCommerce / contagem de produtos ou mensagem de erro explicativa.

## Critérios de Aceitação
- [x] `GET /api/wordpress/sites` e `GET /api/wordpress/sites/[id]` retornam `canConfigureWooCommerce`.
- [x] `POST /api/wordpress/sites` e `PATCH /api/wordpress/sites/[id]` validam plano de afiliados antes de salvar chaves WooCommerce.
- [x] Endpoint `POST /api/wordpress/sites/[id]/test-woocommerce` implementado.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Evidência de Conclusão
- `GET /api/wordpress/sites` e `GET /api/wordpress/sites/[id]` consultam `BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)` e retornam `canConfigureWooCommerce`.
- `POST /api/wordpress/sites` e `PATCH /api/wordpress/sites/[id]` verificam e rejeitam com HTTP 403 requisições que enviam chaves do WooCommerce caso o plano não contenha o módulo de Afiliados.
- Criado endpoint `POST /api/wordpress/sites/[id]/test-woocommerce` com suporte a autenticação por Consumer Keys ou Application Password, com fallbacks adequados e mensagens amigáveis de diagnóstico.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
