# Task 234. Organic Conversion Event Tracking

## Contexto

A Task 233 instalou GTM e consentimento. Agora o GeraFeed precisa medir se tráfego orgânico vira ativação real.

Pageviews sozinhos não bastam.

## Objetivo

Criar uma camada central de eventos `dataLayer` e instrumentar os principais passos do funil sem PII.

## Métrica norteadora

A métrica de ativação recomendada é:

```text
novo usuário → primeira publicação concluída
```

A implementação deve medir marcos do funil, sem transformar analytics em regra de domínio.

## Antes de implementar

Inspecione os fluxos reais de:

- CTA home → cadastro;
- registro;
- conexão WordPress;
- criação de Source/RSS;
- geração/rewrite de artigo;
- publicação;
- checkout.

Instrumentar somente pontos de sucesso reais. Não disparar evento apenas porque um botão foi clicado quando o evento significa conclusão.

## Implementação

### A. Helper central

Criar módulo client-safe, por exemplo:

```text
src/lib/analytics.ts
```

Nome exato pode seguir convenções atuais.

Interface deve encapsular `window.dataLayer`.

Se GTM não estiver configurado ou `window` não existir, não quebrar aplicação.

### B. Allowlist de eventos

Preferir tipos TypeScript para nomes/propriedades.

Eventos mínimos:

```text
cta_click
sign_up_completed
wordpress_connected
rss_source_added
first_article_generated
first_article_published
begin_checkout
```

Pode reutilizar nomes recomendados GA4 quando fizer sentido, mas não sacrificar semântica do produto.

### C. Sem PII

Bloquear por design o envio de:

```text
email
name
cpfCnpj
userId
workspaceId
fullUrlWithSensitiveQuery
articleContent
affiliateUrl
secrets
```

Propriedades aceitáveis:

```text
cta_location
page_path
content_type
plan_code_public
source_channel
is_first
```

Se qualquer propriedade adicional for necessária, justificar na Evidence.

### D. CTA

Instrumentar CTA principal da home e landings quando existirem.

`cta_click` é clique. Não chamar de lead/conversion automaticamente.

### E. Cadastro

`sign_up_completed` somente após cadastro confirmado como sucesso pelo fluxo real.

### F. WordPress

`wordpress_connected` somente após teste/conexão persistida com sucesso conforme implementação existente.

### G. RSS

`rss_source_added` somente após Source criada com sucesso.

### H. Artigo

Definir corretamente `first_article_generated` e `first_article_published`.

Se determinar "first" exigir query extra/performance significativa ou alteração de domínio, registrar Discovered Work e inicialmente emitir `article_generated`/`article_published` com semântica correta. Não inventar primeiro evento client-side baseado apenas em localStorage se o produto precisa verdade cross-device.

### I. Billing

`begin_checkout` no início real do fluxo de contratação.

Não emitir `purchase` no redirect/callback visual.

Confirmação financeira pertence a webhook/reconciliação. Qualquer futura integração server-side analytics deve ser outra task/decisão.

## Fora de escopo

- BigQuery;
- server-side GTM;
- purchase via Measurement Protocol;
- cohort dashboard interno;
- persistir analytics raw no Postgres.

## Definition of Done

- [ ] helper dataLayer central criado/reutilizado.
- [ ] event names tipados ou centralizados.
- [ ] CTA instrumentado.
- [ ] cadastro concluído instrumentado.
- [ ] WordPress conectado instrumentado.
- [ ] RSS adicionado instrumentado.
- [ ] geração/publicação instrumentadas de forma semanticamente correta.
- [ ] begin_checkout instrumentado.
- [ ] nenhum evento contém PII.
- [ ] nenhuma falha de analytics quebra ação de produto.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] testes aplicáveis PASS.
- [ ] Build PASS.

## Validation

Testar `dataLayer` no browser com consentimento aceito e recusado conforme estratégia.

Usar GTM Preview externamente para confirmar os eventos.

## Evidence

Criar tabela em PROGRESS:

```text
Evento | ponto de disparo | propriedades | sem PII? | validado
```
