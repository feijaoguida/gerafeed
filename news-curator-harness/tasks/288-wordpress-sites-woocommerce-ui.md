# Task 288: Interface de Configuração em Destinos WordPress (`/settings/wordpress`)

## Status
DONE

## Contexto
Disponibilizar os campos de chave de API do WooCommerce na tela de Destinos WordPress (Multi-Site), habilitando-os apenas quando o Workspace possui o módulo de Afiliados ativo.

## Escopo de Implementação
1. **Estado da Página (`src/app/(app)/settings/wordpress/page.tsx`)**:
   - Adicionar estado `canConfigureWooCommerce: boolean`.
   - Adicionar estados para `woocommerceConsumerKey`, `woocommerceConsumerSecret`, `hasWooCommerceSecret` no site selecionado.
   - Adicionar estados para `newSiteWcConsumerKey` e `newSiteWcConsumerSecret` no modal de criação de novo site.
   - Estado de teste de conexão WooCommerce `isTestingWc`.
2. **Seção WooCommerce no Formulário de Edição**:
   - Card/bloco destacado "Integração WooCommerce (E-commerce / Afiliados)".
   - Se `canConfigureWooCommerce` for verdadeiro:
     - Inputs para `Consumer Key` (`ck_...`) e `Consumer Secret` (`cs_...`);
     - Indicação visual se já existe segredo salvo (`hasWooCommerceSecret`);
     - Botão "Testar Conexão WooCommerce" chamando `POST /api/wordpress/sites/[id]/test-woocommerce`.
   - Se `canConfigureWooCommerce` for falso:
     - Bloco desabilitado com badge "Recurso de Afiliados" e aviso amigável orientando upgrade de plano para publicação em lojas virtuais.
3. **Seção WooCommerce no Modal de Criação**:
   - Campos correspondentes exibidos condicionalmente conforme `canConfigureWooCommerce`.

## Critérios de Aceitação
- [x] Formulário de edição de site em `/settings/wordpress` exibe campos do WooCommerce com guardrail de plano.
- [x] Modal de criação de site inclui campos opcionais do WooCommerce.
- [x] Botão de teste de conexão WooCommerce funcional com feedback visual.
- [x] `npx tsc --noEmit` PASS e `npm run lint` PASS.

## Evidência de Conclusão
- `src/app/(app)/settings/wordpress/page.tsx` atualizado com o bloco visual destacado de integração WooCommerce.
- Guardrail `canConfigureWooCommerce` controla a renderização dos campos de edição e no modal de criação. Se não tiver plano, exibe card informativo convidando ao upgrade de plano.
- Integrado botão "Testar Conexão WooCommerce" conectado a `POST /api/wordpress/sites/[id]/test-woocommerce`.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

