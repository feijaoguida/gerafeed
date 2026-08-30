# Architectural Decisions

## Histórico

As decisões anteriores (ADR-010 em diante) permanecem válidas, salvo quando explicitamente substituídas por uma decisão posterior.

## ADR-022. WordPressSite como entidade própria
Status: Accepted

Um Workspace pode possuir múltiplos sites WordPress. Não representar isso somente por JSON em `Configuration`.

`WordPressSite` será entidade de domínio com credenciais criptografadas.

Motivo:
- múltiplos destinos;
- estado independente;
- categorias por destino;
- associação de feeds;
- histórico e auditoria.

## ADR-023. Source global no Workspace
Status: Accepted

Feed/RSS continua sendo uma entidade do Workspace e não uma propriedade exclusiva de um WordPressSite.

Um mesmo Feed pode alimentar vários sites.

## ADR-024. Relação N:N Feed ↔ WordPress
Status: Accepted

Criar uma entidade de associação, como `WordPressSiteSource`.

Ela armazena o vínculo e permite override de prompt específico do destino.

Motivo: o mesmo feed pode ser adaptado para diferentes portais.

## ADR-025. Hierarquia de Prompt
Status: Accepted

A resolução final usa:

```text
Feed ↔ WordPress override
→ Feed default
→ WordPress default
→ Workspace default
```

A resolução fica em serviço/função central.

## ADR-026. Article pertence a um destino editorial
Status: Accepted

Quando um artigo tem destino definido, `Article.wordpressSiteId` registra o WordPress para o qual foi preparado.

Motivos:
- filtro;
- prompt correto;
- publicação;
- auditoria.

## ADR-027. Backoffice como segunda área da mesma aplicação
Status: Accepted

Backoffice utiliza o mesmo Next.js e banco, mas possui layout, rotas e autorização próprios.

Não criar segundo aplicativo para o MVP.

## ADR-028. SuperAdmin global
Status: Accepted

`User.isSuperAdmin` autoriza Backoffice.

`WorkspaceUser.role` não concede acesso ao Backoffice.

## ADR-029. Empresa é Workspace
Status: Accepted

No Backoffice, o conceito apresentado ao operador é “Empresa”, mas o registro de domínio continua sendo `Workspace`.

Não criar `Company` duplicada sem necessidade.

## ADR-030. Feature e PlanFeature
Status: Accepted

Planos são configurados através de Features associadas por `PlanFeature`, permitindo `enabled` e `limit` quando aplicável.

O cálculo real de uso/limite deve permanecer no BillingService.

## ADR-031. Seed SuperAdmin por environment
Status: Accepted

Seed utiliza `SUPERADMIN_EMAIL` e `SUPERADMIN_PASSWORD`.

Não hardcodar credenciais.

## ADR-032. Secrets nunca são expostos ao SuperAdmin
Status: Accepted

Mesmo SuperAdmin não recebe Application Password/API Keys descriptografadas. O Backoffice permite substituir secrets, não visualizá-los.

# Affiliate Platform Decisions

## ADR-033. Mercado Livre e canal são pré-condições externas
Status: Accepted
O MVP assume que conta afiliada e canal/site já estão configurados/validados externamente. GeraFeed não gerencia essa aprovação.

## ADR-034. affiliateUrl é a entrada principal
Status: Accepted
Usuário faz curadoria no Mercado Livre, gera o link e cola no GeraFeed. URL original é derivada quando possível.

## ADR-035. Import Preview antes de persistir
Status: Accepted
Importação gera preview. Product/ProductOffer são persistidos apenas após confirmação.

## ADR-036. Safe Affiliate Link Resolver
Status: Accepted
Toda resolução usa proteção SSRF, allowlist, validação de redirects, timeout e limites.

## ADR-037. Best-effort metadata import
Status: Accepted
Importador retorna COMPLETE/PARTIAL/FAILED e nunca inventa dados ausentes.

## ADR-038. externalProductId como identidade externa preferencial
Status: Accepted
Deduplicação prioriza workspace + programa + externalProductId.

## ADR-039. Product separado de ProductOffer
Status: Accepted
Product é item conceitual. ProductOffer é oferta concreta e contém affiliateUrl.

## ADR-040. AffiliateProvider
Status: Accepted
Mercado Livre é o primeiro provider; provider encapsula validação, resolução e metadados.

## ADR-041. Affiliate por entitlement
Status: Accepted
Acesso usa Feature/PlanFeature, não nome do plano.

## ADR-042. Conteúdo canônico Affiliate
Status: Accepted
Conteúdo comercial novo é estruturado e independente do WordPress.

## ADR-043. PublisherAdapter
Status: Accepted
WordPress é primeiro destino; arquitetura permite Blogger/Custom.

## ADR-044. Link não pertence ao HTML canônico
Status: Accepted
Renderer resolve ProductOffer na publicação.

## ADR-045. Clique não é venda
Status: Accepted
AffiliateClick mede clique; venda/comissão dependem de fonte externa confiável.

# Phase 17+. Product Intelligence & Publishing Decisions

## ADR-046. Source data separado de editorial
Status: Accepted
Marketplace metadata não sobrescreve silenciosamente campos editoriais.

## ADR-047. Marketplace Category não é ProductCategory
Status: Accepted
Categoria externa é metadata/sugestão; taxonomia interna continua decisão do Workspace.

## ADR-048. ProductReviewSample
Status: Accepted
Até 5 amostras públicas, sem PII desnecessária, usadas como grounding qualitativo.

## ADR-049. ProductReferenceSource
Status: Accepted
URLs externas podem ser resumidas por IA via Safe Fetch; não copiar artigo integral.

## ADR-050. Dashboard informativo
Status: Accepted
Operação de publicação migra para Central de Publicação.

## ADR-051. Central de Publicação com dois fluxos
Status: Accepted
RSS/Notícias e Conteúdo Affiliate.

## ADR-052. RSS pode usar Affiliate Placements
Status: Accepted
IA pode sugerir catálogo real, usuário aprova, renderer resolve link no publish.

## ADR-053. Regras de seleção pertencem ao Template
Status: Accepted
selectionMode/min/max/category são source of truth compartilhada por UI/backend.

## ADR-054. Prompts Affiliate globais
Status: Accepted
Substitui override Affiliate por Workspace. Apenas SuperAdmin administra no Backoffice.

## ADR-055. Usuário seleciona template, não edita prompt
Status: Accepted
Área funcional fornece inputs e seleciona tipo/template.

## ADR-056. Prompt Affiliate versionado
Status: Accepted
Artigo guarda template ID/versão para auditoria.

# Phase 20. Billing Asaas Decisions

## ADR-057. GeraFeed controla regra comercial, Asaas executa cobrança
Status: Accepted

Plan, preço contratado, entitlements, acesso e histórico local pertencem ao GeraFeed.

Asaas é Payment Provider.

## ADR-058. Preço anual derivado
Status: Accepted

Plan armazena `monthlyPrice` e `annualDiscountPercent`.

Preço anual é calculado.

Não manter dois preços editáveis independentes nesta fase.

## ADR-059. Subscription guarda snapshot
Status: Accepted

Subscription persiste `amount`, `billingCycle` e desconto contratado.

Alterar Plan não altera automaticamente assinatura existente.

## ADR-060. Sem fidelidade = cancelamento de renovação
Status: Accepted

Cancelar impede renovação futura.

Acesso permanece até `currentPeriodEnd`.

Sem pró-rata/reembolso automático nesta fase.

## ADR-061. Hosted Checkout para cartão
Status: Accepted

Preferir checkout hospedado pelo Asaas para impedir que dados brutos de cartão trafeguem pelo backend GeraFeed.

## ADR-062. BillingProfile por Workspace
Status: Accepted

Dados cadastrais de faturamento e `providerCustomerId` pertencem ao Workspace.

Evitar Customer Asaas duplicado.

## ADR-063. externalReference
Status: Accepted

Usar identificador interno estável como `externalReference` quando suportado, especialmente para Customer/Checkout/Subscription.

## ADR-064. Asaas Subscription não é pagamento
Status: Accepted

Subscription agenda cobranças.

Invoice/Payment representa eventos financeiros de cada período.

## ADR-065. PAYMENT_CONFIRMED pode liberar acesso
Status: Accepted

Não esperar `PAYMENT_RECEIVED` quando o pagamento já foi confirmado.

`PAYMENT_RECEIVED` continua sendo persistido para conciliação/liquidação.

## ADR-066. Webhook é fonte financeira primária
Status: Accepted

Callback de checkout não confirma pagamento.

Estado é atualizado por Webhook e reconciliação.

## ADR-067. Idempotência por provider event ID
Status: Accepted

Eventos Asaas podem ser reenviados.

Persistir `providerEventId` único por provider.

## ADR-068. Webhook token diferente da API Key
Status: Accepted

Validar `asaas-access-token` usando `ASAAS_WEBHOOK_TOKEN`.

Não reutilizar API Key.

## ADR-069. Grace period
Status: Accepted

Pagamento overdue leva a PAST_DUE.

Bloqueio ocorre somente após grace period configurável.

Default inicial recomendado: 3 dias.

## ADR-070. Pix recorrente possui capability gate
Status: Accepted

A documentação pública do Asaas apresenta informações divergentes entre páginas sobre Pix em assinaturas tradicionais.

A integração só habilita Pix recorrente direto após teste de sandbox.

Pix Automático é fora de escopo desta fase.

## ADR-071. Sem Cron para billing reconciliation
Status: Accepted

Webhook é o fluxo primário.

Backoffice oferece reconciliação manual.

Automação periódica pode ser fase futura.

## ADR-072. PaymentProvider v2
Status: Accepted

Evoluir abstração existente com Customer, Checkout, Subscription, Payment, Webhook e capabilities.

Código de domínio não chama API Asaas diretamente.

## ADR-073. Sem dados de cartão
Status: Accepted

Não persistir número de cartão, CVV ou validade.

Fluxos devem preferir superfícies hospedadas pelo provider.

## ADR-074. Mudança de plano sem pró-rata complexo
Status: Accepted

Phase 20 prefere troca no próximo ciclo.

Pró-rata/immediate upgrade sofisticado fica fora de escopo até regra comercial explícita.

## ADR-075. Design System Próprio com Tokens Semânticos e Tailwind CSS 4
Status: Accepted

O GeraFeed adotará um Design System próprio e modular, sem incorporar bibliotecas de componentes externas pesadas (como MUI, Chakra ou Ant Design).
A base técnica utilizará:
- Variáveis CSS nativas para tokens semânticos (`:root` e `.dark`).
- Mapeamento no Tailwind CSS 4 via `@theme inline`.
- Fontes oficiais via `next/font/google`: Sora (Títulos/Destaques) e Inter (Textos/Interface).
- Utilitário unificado `cn` (`clsx` + `tailwind-merge`).
- `class-variance-authority` (CVA) para variantes previsíveis e tipadas de componentes primitivos.
- Suporte a Light Mode e Dark Mode sem duplicar componentes JSX.

## ADR-076. Separação Estrita entre Fundação do Design System e Migração de Telas
Status: Accepted

Para garantir estabilidade, prevenir regressões e assegurar controle de qualidade:
1. A Phase 22 cria exclusivamente a fundação de tokens, utilitários, componentes primitivos/compostos e a página de demonstração visual `/backoffice/design-system` (e `/design-system`).
2. Nenhuma tela existente em produção será refatorada ou migrada até a conclusão e validação da fundação do Design System e autorização explícita do operador.
3. Cada tela do sistema possui task dedicada de migração com garantia de paridade visual em Modo Claro e Modo Escuro.

# Architectural Decisions. Phase 28 SEO & Measurement

## ADR-077. Next.js Metadata API como fonte SEO técnica
Status: Proposed

Metadata, sitemap e robots devem usar recursos nativos do App Router sempre que compatíveis com o projeto atual.

Motivo:
- reduzir dependências;
- manter geração integrada à árvore de rotas;
- facilitar manutenção;
- compatibilidade com Vercel.

## ADR-078. Propriedade Search Console de domínio validada por DNS
Status: Proposed

A validação primária do GeraFeed no Google Search Console deve usar propriedade de domínio.

O código não depende de meta tag de verificação quando DNS estiver validado.

## ADR-079. GTM como camada única de deployment de analytics
Status: Proposed

O container Google Tag Manager é carregado pela aplicação.

GA4 é configurado no GTM.

Não instalar simultaneamente GA4 direto no código e via GTM.

## ADR-080. Analytics sem PII
Status: Accepted

Eventos de analytics usam somente dados comportamentais/categóricos necessários para medir aquisição e ativação.

Email, nome, CPF/CNPJ, IDs internos e secrets não podem ser enviados.

## ADR-081. Consentimento separado de autenticação
Status: Accepted

Consentimento de analytics é preferência de privacidade do visitante e não deve ser inferido de login, cadastro ou aceite de termos.

## ADR-082. Structured Data factual
Status: Accepted

JSON-LD representa somente fatos visíveis/reais.

Ratings, reviews, número de clientes, preços e resultados só entram se houver fonte real, atual e coerente.

## ADR-083. Blog filesystem no MVP de SEO
Status: Accepted

Se não existir CMS/content engine no repositório, usar solução filesystem Markdown/MDX estática/SSG compatível com Vercel.

Motivo:
- baixa complexidade;
- sem novo serviço externo;
- versionamento no Git;
- performance;
- boa integração com sitemap.

A implementação deve primeiro verificar dependências e arquitetura atuais. Se houver solução equivalente já existente, reutilizar.

## ADR-084. Curadoria editorial como posicionamento principal
Status: Accepted

Comunicação pública deve priorizar automação e curadoria editorial assistida por IA.

Evitar promessas de que simples reescrita ou modificação de imagem elimina plágio/direitos autorais.
