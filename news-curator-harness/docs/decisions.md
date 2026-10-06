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

## ADR-085. Camada de E-mail Desacoplada com Adapter Pattern
Status: Accepted

O envio de e-mails transacionais não deve ficar acoplado a uma biblioteca ou fornecedor único.

Criar abstração `EmailAdapter` em `src/lib/mail/` com factory central `getMailAdapter()`.

Provedores suportados na primeira versão:
- `resend`: Resend API (cota free de 100/dia e 3000/mês);
- `smtp`: Nodemailer SMTP configurável por variáveis de ambiente;
- `mock`: Saída em terminal para desenvolvimento local/testes sem credenciais ativas.

Seleção configurável via variável de ambiente: `EMAIL_PROVIDER="resend" | "smtp" | "mock"`.
Extensibilidade garantida para adição futura de Mailgun ou outros serviços sem quebrar código de domínio.

Fallback Automático de Alta Disponibilidade:
- Se `EMAIL_PROVIDER="resend"` e o envio falhar (ex: cota gratuita de 100/dia esgotada ou instabilidade de rede), o sistema tenta imediatamente enviar via `SmtpAdapter` se as credenciais SMTP estiverem preenchidas no `.env`.
- Caso `RESEND_API_KEY` esteja ausente no ambiente, mas credenciais SMTP estejam disponíveis, o sistema assume o SMTP diretamente como fallback inicial.

## ADR-086. Verificação de E-mail via Código OTP (6 dígitos) na Própria Tela
Status: Accepted

Para evitar cadastros com e-mails falsos (ex: teste@teste.com.br) e garantir a entrega de comunicações sem prejudicar a taxa de conversão:
- O usuário recebe um código numérico de 6 dígitos gerado de forma criptográfica;
- O código é validado diretamente na tela de cadastro, sem que o usuário precise trocar de aba ou clicar em links externos;
- O token é armazenado no modelo existente `VerificationToken` com validade estrita de 15 minutos;
- Tentativas de reenvio são rate-limited com contador regressivo (anti-flood).

## ADR-087. Armazenamento Seguro de Senhas (bcrypt + SALT)
Status: Accepted

Contas criadas por credenciais devem possuir hash seguro de senha no banco de dados.

Adicionar campo opcional `passwordHash` no modelo `User` do Prisma.
Utilizar `bcryptjs` com fator de custo (SALT rounds) configurado em 10.
Autenticação no `src/auth.ts` (`authorize`) deve validar o hash via `bcrypt.compare` e rejeitar qualquer senha incorreta para usuários comuns.

## ADR-088. Preservação da Intenção de Compra da Home ao Cadastro
Status: Accepted

A seleção de planos no `PricingCarousel` da Home deve propagar os parâmetros `plan` e `cycle` na URL (`/register?plan=pro&cycle=monthly`).
O fluxo de cadastro deve persistir essa intenção no estado da aplicação e em armazenamento volátil (`sessionStorage`), garantindo que recarregamentos de página mantenham a seleção do usuário.

## ADR-089. Onboarding de Faturamento e Checkout Hosted Asaas para Planos Pagos
Status: Accepted

Para planos por assinatura pagos:
- O usuário conclui o cadastro básico e confirma o e-mail;
- Antes de liberar o acesso direto ao painel com plano pago, a aplicação solicita os dados de faturamento (`BillingProfile`: CPF/CNPJ, Telefone, CEP/Endereço);
- Ao enviar os dados fiscais, a API `/api/billing/checkout` registra a sessão, sincroniza o cliente e cria a assinatura no Asaas, retornando a `checkoutUrl` (fatura/checkout hospedado do Asaas);
- O usuário é redirecionado para concluir o pagamento com segurança;
- A liberação final de limites e ativação da assinatura é conduzida pelo Webhook do Asaas de forma assíncrona e auditável.


## ADR-090. Blocos comerciais editáveis e integração Shopee (proposta Phase 30)
Status: Proposed — implementação não autorizada; detalhes a decidir na task 247.

Contexto: o pedido inclui importação Shopee, imagens originais, ocorrências repetidas de
produtos e inserção na posição do cursor em RSS e artigos comerciais. Há renderers e
representações distintas de conteúdo; ArticleProduct permite um vínculo único por produto/artigo.

Direção proposta:
- Reutilizar AffiliateProvider para Shopee e ProductOffer como fonte do link comercial.
- Representar ocorrências de blocos separadamente do vínculo ArticleProduct.
- Compartilhar contratos visuais e resolução de ofertas entre preview e publicação.
- Sincronizar edição, documento canônico e vínculos atomicamente, mantendo compatibilidade.
- Distinguir produtos-base do gerador e recomendações adicionais da revisão.

Ainda não decidido: schema de ocorrência, necessidade de migration, serialização em HTML,
estratégia de sincronização dos modelos existentes e eventual componente de edição.
Não tratar comentários HTML nem nova tabela como arquitetura aprovada por este planejamento.
A task 247 deve documentar escolha, alternativas, compatibilidade e testes antes da adoção.

### ADR-090 — decisão da task 247 (2026-10-02)
Status: Accepted. Autorização do usuário: executar 247–254, sem publicar em produção.

- Sem migration: `canonicalContent` comporta novo `PRODUCT_GROUP` com data.id estável,
  layout, products ordenados e ctaText. Cada referência possui productId/offerId opcional.
- `meta.baseProductIds` guarda produtos-base/editoriais, inicializados pelo servidor a partir
  dos vínculos existentes ao primeiro save. Recomendações extras vêm das ocorrências.
- ArticleProduct projeta a união dos produtos-base e ocorrências. Remover último uso elimina
  somente vínculo que não é base. Cardinalidade do gerador continua aplicada aos produtos-base.
- Editor HTML representa blocos em comentários URI-encoded; helpers fazem round-trip e validam
  payload/IDs/duplicatas. UI visual gerencia comentários; usuário não precisa editar JSON.
- No save, servidor valida referências do tenant e atualiza texto/canônico/vínculos na mesma
  transação. Ao editar, canônico é reconstruído do texto com marcadores, mantendo meta de base.
- Compatibilidade: HTML antigo vira RICH_TEXT; blocos antigos continuam válidos e são
  preservados como marcadores no editor. Placements antigos continuam no caminho legado,
  até conversão explícita; não duplicá-los em duas representações na publicação.
- Oferta implícita: ativa, menor preço não nulo, desempate por ID; explícita nunca faz fallback.
- Contratos: GET artigo retorna capacidades + conteúdo editável; PATCH recebe content e valida
  canônico/referências; preview recebe documento e retorna HTML/pendências. Erros 400 formato,
  401 sessão, 403 plano, 404 recurso fora do tenant/ausente, 409 oferta indisponível/conflito.
- Consumidores: revisão RSS e AffiliateArticleEditor → PATCH artigo; approve → publishToWordPress
  em wordpress.ts; republish → PublicationSyncService → WordPressAffiliateRenderer → adapter.
  CanonicalDocumentService.renderToHtml e preview atual precisam compartilhar modelos com o renderer.
  Adapter recebe HTML já autorizado/renderizado, não resolve catálogo por conta própria.
- Testes iniciais: scripts/phase30/contracts.test.ts (contratos, round-trip, seleção de oferta).

## ADR-091 — Sistema de Log de Erros, Diagnóstico e Auditoria no Backoffice (Phase 31)
Status: Accepted. Autorização do usuário em 2026-10-04.

Contexto:
Erros no sistema eram tratados e mascarados para o cliente com mensagens genéricas, impossibilitando que a equipe de desenvolvimento e suporte identificasse a causa raiz exata e simulasse os problemas.
O usuário solicitou um sistema completo de log no banco com captura de Usuário, Tela, Consulta, Caminho, Mensagem original e Stack trace antes do mascaramento, mantendo o feedback visual amigável com pequenos popups nos cantos da tela, permitindo visualização e filtros exclusivos no Backoffice para SuperAdmin (por tenant, módulo, usuário e data), além de configuração de tempo de retenção (padrão 180 dias) e rotina de expurgo de logs antigos.

Decisões:
1. **Modelos no Prisma**:
   - `SystemErrorLog`: armazena `id`, `workspaceId` (opcional), `userId`, `userEmail`, `userName`, `screen`, `path`, `method`, `query` (JSON sanitizado), `module`, `errorMessage` (bruta/sem tratamento), `errorStack`, `statusCode`, `ipAddress`, `userAgent` e `createdAt`.
   - `SystemSetting`: chave/valor global para configurações do sistema (ex: `error_log_retention_days = 180`).
2. **Logging Não-Bloqueante & Higienização**:
   - O serviço de log no servidor (`src/lib/errors/service.ts`) opera com try/catch isolado e não-bloqueante: uma indisponibilidade temporária de gravação de log nunca derruba a requisição principal do usuário.
   - Higienização automática de campos sensíveis (senhas, hashes, secrets, chaves de API, tokens de cartão/auth) antes de gravar em `query`.
3. **Tratamento de Erros e Feedback Amigável**:
   - Para o usuário comum: respostas de erro na API continuam mascaradas de forma amigável (`{ error: string, errorId?: string }`), e no client pequenos popups tipo toast nos cantos da tela notificam o usuário sem travar a interface.
   - Para o desenvolvedor/suporte: os logs reais e completos ficam salvos no banco com `errorId` rastreável.
4. **Governança no Backoffice**:
   - Apenas usuários com `isSuperAdmin === true` têm acesso a `/backoffice/audit/errors` e `/backoffice/settings`.
   - Listagem com filtros por Tenant (Workspace), Módulo (AI, RSS, BILLING, WORDPRESS, AFFILIATES, AUTH, BACKOFFICE, GENERAL), Usuário (busca por e-mail ou nome) e Período de Data.
   - Modal com dados completos de reprodução e stack trace formatado.
5. **Retenção e Expurgo**:
   - Tela `/backoffice/settings` permite configurar os dias de retenção (padrão 180).
   - Rotina manual de expurgo acionável via endpoint protegido `POST /api/backoffice/settings/cleanup-logs` deletando registros com `createdAt` anterior à data de corte.

## ADR-092 — Recuperação de Senha com Código OTP de 6 Dígitos via E-mail (Phase 32)
Status: Accepted. Autorização do usuário em 2026-10-05.

Contexto:
Usuários que esquecerem sua senha de acesso ao GeraFeed precisam de um fluxo seguro e autônomo para recuperação da conta. A infraestrutura de envio de e-mails (`resend`, `smtp`, `mock`), o modelo `VerificationToken` e os utilitários de geração de OTP (`generateOtpCode`) e hash de senha (`hashPassword`) já existem e devem ser reaproveitados de maneira segura.

Decisões:
1. **Isolamento de Escopo do Token (Purpose Binding)**:
   - Para impedir que um token de cadastro seja utilizado para redefinir senha (ou vice-versa), os registros de recuperação de senha em `VerificationToken` utilizarão o identificador prefixado:  
     `identifier: "password-reset:" + cleanEmail`.
2. **Proteção contra Enumeração de Usuários (Anti-User-Enumeration)**:
   - O endpoint de solicitação do código responderá com uma mensagem de sucesso uniforme independentemente do e-mail existir ou não na base de dados (`"Se este e-mail estiver cadastrado em nossa plataforma, você receberá um código de verificação em instantes."`).
   - Se o usuário não existir, nenhum e-mail é disparado, mas o atacante não consegue enumerar quais e-mails têm conta ativa.
3. **Proteção Anti-Flood / Rate Limiting**:
   - Cooldown de 60 segundos entre solicitações para o mesmo e-mail, retornando HTTP 429 se houver tentativa antes do intervalo.
4. **Ciclo de Vida Curto & Uso Único (Single-Use)**:
   - Expiração estrita de 15 minutos (`TOKEN_LIFETIME_MS = 15 * 60 * 1000`).
   - Após a validação e redefinição com sucesso, todos os tokens com `identifier: "password-reset:" + cleanEmail` são deletados imediatamente, impedindo repetição do código.
5. **Criptografia Forte & Validação**:
   - A nova senha deve ter no mínimo 6 caracteres e ser armazenada via `hashPassword` (`bcryptjs` com SALT rounds 10) no campo `passwordHash` do usuário.
6. **Desacoplamento e Rota Pública**:
   - A página `/forgot-password` é liberada no matcher do `src/proxy.ts` como rota pública.
   - O link "Esqueceu a senha?" é posicionado no formulário de login (`/login`).
7. **Padrão Visual e UX**:
   - Visual alinhado ao design system GeraFeed (Dark Mode institucional, layout split, inputs com feedback visual, timer regressivo para reenvio e mensagens amigáveis).



## 2026-10-05 — Instruções de afiliados no contrato de geração (Task 266)
- `GenerateArticleInput.systemPrompt` é opcional e preenchido exclusivamente por
  código servidor com o template global efetivo. Não é um campo aceito do client.
- Os quatro provedores usam `buildArticlePrompts`: com template comercial,
  enviam suas instruções e o contexto renderizado; sem ele, mantêm o prompt RSS.
- Review e comparativo adotam o contrato agora. Governança global, versionamento,
  revisão humana, resolução de ofertas e renderização canônica são preservados.
