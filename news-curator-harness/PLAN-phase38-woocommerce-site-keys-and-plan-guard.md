# Plano de Ação — Phase 38: Chaves da API do WooCommerce nos Destinos WordPress (Multi-Site) com Guardrail de Plano de Afiliados

## 1. Contexto & Motivação
Na Phase 37, implementamos a publicação e sincronização de produtos no WooCommerce a partir do catálogo de afiliados e importador. As chamadas reutilizam as credenciais de `WordPressSite` (Application Passwords). No entanto, muitas lojas WordPress e WooCommerce requerem chaves REST dedicadas da WooCommerce API:
- **Consumer Key** (`ck_...`)
- **Consumer Secret** (`cs_...`)

O usuário solicitou:
1. Ter o local para cadastrar essas chaves na página **Destinos WordPress (Multi-Site)** (`/settings/wordpress`), permitindo chave específica por site;
2. Disponibilizar/habilitar esse campo **somente se o Workspace tiver o Afiliado habilitado no seu plano**.

---

## 2. Arquitetura e Decisões
- **Modelo de Dados**:
  - `WordPressSite`: novos campos opcionais `woocommerceConsumerKey String?` e `encryptedWooCommerceSecret String?`.
  - Criptografia com `encrypt()` e `decrypt()` de `src/lib/crypto.ts` (AES-256-GCM).
  - Sanitização via `sanitizeWordPressSite`: expõe `woocommerceConsumerKey: string | null` e `hasWooCommerceSecret: boolean` (nunca expor o segredo para o browser).
- **Billing & Plan Guardrail**:
  - `BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)`.
  - Retornado em `/api/wordpress/sites` como `canConfigureWooCommerce: boolean`.
  - Validado com `assertFeature` em `POST /api/wordpress/sites` e `PUT /api/wordpress/sites/[id]` se houver tentativa de salvar chaves WooCommerce.
- **Autenticação Híbrida no WooCommerce Publisher**:
  - Em `WooCommercePublisherService`, se o site tiver `woocommerceConsumerKey` e `woocommerceConsumerSecret`, autentica via `Basic base64(ck:cs)`.
  - Caso contrário, mantém o fallback para `username:applicationPassword` do WordPress.
- **Interface em `/settings/wordpress`**:
  - Card/bloco "Integração WooCommerce (Catálogo de Afiliados)" no formulário de edição do site selecionado e no modal de criação de novo site.
  - Habilitado com inputs de `Consumer Key` e `Consumer Secret` se `canConfigureWooCommerce === true`.
  - Bloqueado com banner/badge informativo se `canConfigureWooCommerce === false`.
  - Botão de teste de conexão com o WooCommerce (`POST /api/wordpress/sites/[id]/test-woocommerce`).

---

## 3. Divisão de Tasks

### [Task 286: Schema & Backend de Credenciais WooCommerce em WordPressSite](tasks/286-woocommerce-site-keys-schema-and-service.md)
- Atualizar `prisma/schema.prisma` adicionando `woocommerceConsumerKey String?` e `encryptedWooCommerceSecret String?` no model `WordPressSite`.
- Executar `npx prisma db push` e `npx prisma generate`.
- Atualizar `src/lib/wordpress-sites.ts`: interfaces `CreateWordPressSiteInput`, `UpdateWordPressSiteInput`, `WordPressSiteClientSafe`, `WordPressSiteDecryptedConfig`, métodos `sanitizeWordPressSite`, `createWordPressSite`, `updateWordPressSite` e `getWordPressSiteConfig`.

### [Task 287: Validação de Plano e Endpoint de Teste WooCommerce](tasks/287-woocommerce-keys-plan-validation-and-test-api.md)
- Atualizar `GET /api/wordpress/sites` e `GET /api/wordpress/sites/[id]` para retornar `canConfigureWooCommerce: boolean` baseado em `BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE)`.
- Atualizar `POST /api/wordpress/sites` e `PUT /api/wordpress/sites/[id]` para validar o plano caso chaves do WooCommerce sejam enviadas.
- Criar endpoint `POST /api/wordpress/sites/[id]/test-woocommerce` para testar as credenciais da WooCommerce REST API.

### [Task 288: Interface de Configuração em Destinos WordPress (`/settings/wordpress`)](tasks/288-wordpress-sites-woocommerce-ui.md)
- Atualizar `src/app/(app)/settings/wordpress/page.tsx`:
  - Seção WooCommerce no formulário do site selecionado;
  - Seção WooCommerce no modal de criação de novo site;
  - Habilitação condicional conforme `canConfigureWooCommerce`;
  - Exibição de status de credenciais (`hasWooCommerceSecret`), Consumer Key e botão de teste de conexão com feedback visual.

### [Task 289: Autenticação no Publicador, Testes E2E Automatizados e Build](tasks/289-woocommerce-publisher-auth-and-e2e-tests.md)
- Atualizar `WooCommercePublisherService` para priorizar autenticação via `woocommerceConsumerKey:woocommerceConsumerSecret`.
- Criar `scripts/phase38/test-woocommerce-keys-and-plan-guard-e2e.ts`.
- Validar com `npx tsc --noEmit`, `npm run lint` e `npm run build`.
- Atualizar `PROGRESS.md` e `MEMORY.md`.

