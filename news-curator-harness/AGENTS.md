# AGENTS.md. News Curator

## Fonte de verdade

O repositório é a fonte de verdade. Antes de alterar código:

1. Leia `AGENTS.md`.
2. Leia `SPEC.md`.
3. Leia `MEMORY.md`.
4. Leia `PROGRESS.md`.
5. Leia a task atual.
6. Leia `docs/decisions.md` quando houver mudança arquitetural.
7. Inspecione a implementação atual antes de criar ou alterar abstrações.

## Harness

Uma task por vez.

Fluxo obrigatório:

```text
Contexto
→ Task
→ Implementação
→ Definition of Done
→ Validation
→ Evidence
→ PROGRESS
→ MEMORY/decisions quando necessário
```

Não declarar uma task como DONE apenas porque o código compila.

## Multi-tenant

Todas as entidades de domínio pertencem a um Workspace quando aplicável.

Toda query deve validar `workspaceId`.

Nunca confiar em um ID enviado pelo client sem confirmar que o recurso pertence ao Workspace autorizado.

No Backoffice, o SuperAdmin pode selecionar outro Workspace, mas essa seleção precisa ser explícita e validada no servidor.

## WordPress

Na nova arquitetura, WordPress configurado pelo usuário é uma entidade `WordPressSite`.

Não tratar a antiga chave `wordpressConnection` como único site depois da migração.

Application Password continua criptografada.

## Feeds

`Source` é global ao Workspace.

A relação com WordPress é N:N através da entidade de associação.

Nunca copiar o mesmo Feed para tabelas diferentes apenas para criar associação.

## Prompt

A resolução de prompt deve ficar centralizada em um serviço/função.

Precedência definida pela SPEC:

```text
Feed ↔ WordPress override
→ Feed default
→ WordPress default
→ Workspace default
```

Não duplicar essa regra no frontend.

## Backoffice

A área `/backoffice` é independente da UI funcional, mas usa o mesmo domínio.

Somente `User.isSuperAdmin === true` pode acessar.

Não confiar apenas em middleware/client-side para proteger dados. APIs e Server Actions também devem verificar SuperAdmin.

## Secrets

Nunca retornar API keys, Application Passwords ou outros secrets descriptografados, mesmo para SuperAdmin.

Para trocar um secret, aceitar uma nova credencial e criptografar server-side.

## Planos e Features

Reutilizar BillingService e modelos existentes sempre que possível.

Não duplicar cálculo de limites no Backoffice.

## Definition of Done

Todos os critérios da task devem ser atendidos.

Obrigatório quando aplicável:
- TypeScript PASS
- Lint PASS
- testes PASS
- Build PASS
- validação de autorização
- evidências registradas

## Discovered Work

Se surgir algo fora da task:

```text
## Discovered Work
Descrição:
Motivo:
Impacto:
```

Não implementar automaticamente.

# Affiliate Platform. Regras adicionais a partir da Phase 10

## Fonte da verdade
O GeraFeed é a fonte da verdade para catálogo, ofertas, links afiliados, prompts, conteúdo canônico, publicações e tracking. WordPress é somente um destino/publicador.

## Pré-condições Mercado Livre
No MVP assumir que a conta de afiliado e os canais/sites já estão configurados e validados externamente pelo usuário. Não criar fluxo de aprovação do canal, não guardar login Mercado Livre e não automatizar o Portal do Afiliado.

## Fluxo de curadoria
```text
Mercado Livre → usuário escolhe produto → gera affiliateUrl → cola no GeraFeed → resolver seguro → importar dados → preview → confirmar → Product + ProductOffer
```

## Affiliate URL
`affiliateUrl` é a entrada principal. Não exigir `originalUrl` quando ela puder ser derivada.

## Importação
A importação é best-effort. Nunca inventar dados ausentes. Pode retornar `COMPLETE`, `PARTIAL` ou `FAILED`. Em PARTIAL, permitir complemento manual.

## SSRF
Qualquer URL fornecida pelo usuário e buscada pelo servidor deve passar por proteção SSRF: somente http/https, allowlist por provider, bloqueio de localhost/redes privadas/link-local, validação de DNS/IP e de todos os redirects, limite de redirects, timeout e tamanho, sem encaminhar cookies ou Authorization.

## Deduplicação
Priorizar `workspaceId + affiliateProgramId + externalProductId`. Também normalizar e comparar `affiliateUrl` e `resolvedUrl`. Nunca criar duplicata silenciosamente.

## AffiliateProvider
O provider deve encapsular `validateAffiliateUrl`, `resolveAffiliateUrl`, `fetchProductMetadata` e capabilities. Mercado Livre é o primeiro provider.

## Conteúdo Affiliate
IA recebe Product/ProductOffer estruturados. Não inventar produto, preço, seller, specs, desconto, disponibilidade ou experiência de teste físico.

## Links e publicação
`affiliateUrl` pertence a ProductOffer. Não espalhar link no conteúdo canônico. Renderer resolve a oferta no publish e marca links comerciais com `rel="sponsored"` (podendo combinar `nofollow`).

## Planos
Usar entitlement/feature, nunca nome do plano: `AFFILIATE_MODULE`, `AFFILIATE_ANALYTICS`, `AFFILIATE_MAX_PRODUCTS`, `AFFILIATE_MAX_PROGRAMS`.

## Métricas
`AffiliateClick` mede clique. Não chamar clique de venda, conversão ou comissão.

# Phase 17+. Regras adicionais

## Dados Source x Editorial
Dados importados do marketplace não podem sobrescrever silenciosamente dados editoriais.

Source/marketplace:
- sourceDescription
- sourceSpecs
- marketplaceCategoryId/name
- sourceRating/sourceReviewCount
- review samples
- seller/preço snapshot

Editorial:
- description
- specs
- pros
- cons
- rating
- ProductCategory interna

Refresh preserva dados editoriais. Ação source → editorial deve ser explícita.

## Reviews
Importar no máximo 5 amostras públicas quando suportado. Não armazenar identidade de comprador sem necessidade. Tratar como amostras qualitativas, não estatística.

## Fontes externas do produto
URLs relacionadas usam Safe Fetch com SSRF protection, extração legível e resumo por IA. Não persistir artigo integral sem necessidade.

## Central de Publicação
Dashboard é informativo. Operações ficam em `Publicar Posts`, com dois fluxos: RSS/Notícias e Afiliados.

## RSS monetizado
IA pode sugerir produtos do catálogo, mas somente IDs fornecidos, com aprovação humana. Link afiliado não fica hardcoded no conteúdo; usar placement estruturado e resolver oferta no publish.

## Regras por tipo Affiliate
PRODUCT_REVIEW = exatamente 1 produto. COMPARISON = mínimo 2. BEST_PRODUCTS e BUYING_GUIDE usam regras centrais de seleção/categoria definidas no template.

## Prompts Affiliate globais
A partir da Phase 19, PromptTemplate Affiliate é global e editável somente no Backoffice por SuperAdmin. Isso substitui override Affiliate por Workspace. Usuário comum escolhe template e inputs, não edita system/user prompt.

# Phase 20+. Billing Asaas Production Ready

## Responsabilidade

O GeraFeed é a fonte da verdade para:
- plano contratado;
- ciclo mensal/anual;
- preço contratado;
- desconto anual contratado;
- estado de acesso;
- histórico de cobranças/pagamentos;
- limites e entitlements.

O Asaas é o gateway responsável por:
- Customer;
- Subscription;
- Payment;
- Hosted Checkout quando aplicável;
- meios de pagamento;
- eventos financeiros.

Não transformar status do Asaas diretamente em regra de acesso sem passar pelo domínio/BillingService.

## Gateway Abstraction

Toda chamada ao Asaas deve passar pelo `PaymentProvider`/`AsaasProvider` ou serviços de infraestrutura do provider.

Nunca espalhar `fetch("https://api.asaas...")` em componentes, services de domínio ou Route Handlers.

O domínio trabalha com tipos internos.

## Plan Pricing

Plan deve suportar:
- monthlyPrice;
- annualDiscountPercent.

O preço anual é calculado no GeraFeed:

```text
annualBase = monthlyPrice * 12
annualAmount = annualBase * (1 - annualDiscountPercent / 100)
```

Usar Decimal/arredondamento monetário explícito.

Nunca usar `number` de ponto flutuante como fonte de verdade para cálculo financeiro.

## Snapshot contratual

Subscription deve persistir snapshot da contratação.

Mudança futura no Plan não altera silenciosamente assinatura existente.

Guardar, no mínimo:
- amount;
- billingCycle;
- annualDiscountPercentSnapshot;
- planName/planId conforme schema existente;
- providerSubscriptionId.

## Sem fidelidade

"Sem fidelidade" significa:
- usuário pode cancelar renovação;
- cancelamento impede cobranças futuras;
- acesso já pago permanece até `currentPeriodEnd`;
- mensal e anual seguem a mesma regra.

Não implementar reembolso pró-rata automático nesta fase.

## Dados financeiros

Nunca persistir:
- número completo do cartão;
- CVV;
- validade;
- token de cartão se não for estritamente necessário ao fluxo escolhido.

Preferir Hosted Checkout do Asaas para cartão.

Dados cadastrais de cobrança podem ser persistidos com minimização:
- nome;
- CPF/CNPJ;
- email;
- telefone;
- endereço necessário;
- asaasCustomerId.

## Formas de pagamento

Domínio pode representar:
- CREDIT_CARD;
- BOLETO;
- PIX.

A implementação do Asaas deve consultar capabilities/contratos validados em sandbox.

Não habilitar comportamento não validado só porque um enum existe.

Para Pix recorrente tradicional, registrar a divergência atual da documentação e validar no sandbox antes de habilitar diretamente.

Pix Automático é outro produto/fluxo e fica fora desta fase, salvo decisão explícita posterior.

## Checkout

Callback/redirect de Checkout nunca confirma pagamento.

Somente Webhook/reconciliação do provider altera estado financeiro para pago/confirmado.

## Webhooks

Obrigatório:
- validar `asaas-access-token`;
- token de webhook diferente da API Key;
- idempotência por `event.id`;
- payload tolerante a campos novos;
- não depender da ordem de eventos;
- retornar 2xx para evento já processado;
- não logar payload sensível integralmente.

Como o MVP roda sem fila, o handler deve ser curto, transacional e idempotente.

## Payment versus Subscription

Asaas Subscription agenda cobranças.

Quem é pago é o Payment/Invoice.

Não marcar uma Subscription como "paga".

Acesso deve considerar:
- Subscription local;
- período contratado;
- estado do pagamento relevante;
- grace period.

## PAYMENT_CONFIRMED e PAYMENT_RECEIVED

`PAYMENT_CONFIRMED` significa pagamento confirmado, mesmo que o saldo ainda não esteja disponível.

`PAYMENT_RECEIVED` representa recebimento/liquidação.

O GeraFeed pode liberar acesso a partir da confirmação conforme a política interna.

Não esperar liquidação financeira para liberar um cliente que já teve pagamento confirmado.

## Inadimplência

Não bloquear de forma instantânea apenas porque um pagamento venceu.

Usar grace period configurável.

Default inicial sugerido:
`BILLING_GRACE_PERIOD_DAYS=3`.

Após grace period:
- Subscription local pode ir para SUSPENDED;
- BillingService bloqueia features pagas.

## Reconciliation

Webhook é primário.

Também deve existir sincronização/reconciliação manual no Backoffice para recuperar divergências.

Não criar Cron nesta fase.

## PII

Dados cadastrais de cobrança são PII.

- não logar CPF/CNPJ completo;
- não expor em telas sem necessidade;
- Backoffice somente SuperAdmin;
- cliente vê apenas dados do próprio Workspace.

## Definition of Done

Toda task Billing exige, quando aplicável:
- tenant isolation;
- authorization;
- idempotência;
- gateway abstraction;
- TypeScript PASS;
- Lint PASS;
- Tests PASS;
- Build PASS;
- Evidence.


# Phase 28+. Regras adicionais de SEO e Measurement

## Fonte de verdade SEO

O código e a configuração pública do GeraFeed são a fonte de verdade para:

- metadata;
- canonicals;
- sitemap;
- robots;
- structured data;
- instrumentação GTM/dataLayer.

Search Console e GA4 são ferramentas externas de observação. Não codificar suposições de status de indexação ou métricas dentro do domínio.

## Indexação

Rotas autenticadas, administrativas e de conta não são páginas de aquisição.

Não inserir rotas privadas no sitemap.

`robots.txt` não é segurança.

Quando uma página HTML pública precisa sair do índice, usar diretiva `noindex` apropriada. Não bloquear a leitura dessa diretiva por acidente antes de validar o estado.

## Metadata

Toda landing page indexável deve possuir title, description e canonical próprios.

Não herdar title comercial da home em login/register.

Não duplicar a mesma intenção de busca em várias páginas quase iguais.

## Structured Data

Nunca fabricar:

- review;
- aggregateRating;
- número de clientes;
- preço;
- desconto;
- estatística;
- autor;

Structured data deve representar o conteúdo visível e fatos reais.

## Analytics

GTM é a camada de deployment de tags desta fase.

GA4 deve ser configurado dentro do GTM. Não instalar GA4 novamente via gtag direto se GTM já o entrega.

Nunca enviar PII para dataLayer/GA4:

- email;
- nome;
- CPF/CNPJ;
- userId;
- workspaceId;
- secrets;
- corpo de artigos;
- URLs privadas.

Callback de checkout não é pagamento confirmado.

## Consentimento

Preferências devem ser acessíveis, reversíveis e sem dark pattern.

Não declarar conformidade jurídica absoluta no código ou UI.

## Conteúdo e posicionamento

Preferir "curadoria editorial assistida por IA" a promessas de "anti-plágio".

Não afirmar que transformação de imagem elimina direito autoral.

Não publicar conteúdo SEO superficial só para preencher calendário.

## Design System

Toda nova página pública reutiliza os tokens, primitivas e padrões oficiais do GeraFeed.

Não criar uma segunda biblioteca de UI para o blog ou landing pages.

## Harness

Uma task por vez. Discovered Work fora do escopo deve ser registrado e não implementado automaticamente.
