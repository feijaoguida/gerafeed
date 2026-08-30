# Task 238. Technical SEO Validation & Hardening

## Contexto

Esta é a task de integração da Phase 28. Não deve adicionar grandes features novas. O foco é validar tudo que foi implementado nas Tasks 230 a 237, corrigir regressões dentro do escopo e produzir Evidence auditável.

## Objetivo

Validar:

- crawl/index policy;
- metadata;
- canonicals;
- sitemap;
- robots;
- structured data;
- GTM/consent;
- analytics events;
- landing pages;
- blog;
- performance básica;
- acessibilidade básica;
- ausência de PII em analytics.

## Antes de implementar

Leia Evidence das Tasks 230 a 237.

Inspecione Discovered Work sem implementá-lo automaticamente.

## Checklist técnico

### A. Rotas

Testar 200/redirect/401/404 conforme esperado para:

```text
/
/login
/register
/como-funciona
/automacao-wordpress
/rss-para-wordpress
/curadoria-de-conteudo-com-ia
/para-agencias
/para-portais-de-noticias
/blog
/blog/[fixture ou post real]
/robots.txt
/sitemap.xml
/backoffice
/api/...
```

### B. Indexação

Confirmar:

- páginas comerciais não possuem noindex;
- login/register possuem noindex;
- app/backoffice não são indexáveis;
- sitemap não inclui privadas/drafts;
- robots não contradiz a estratégia sem justificativa.

### C. Metadata

Para cada landing:

- title único;
- description única;
- canonical;
- OG;
- H1 único;
- idioma pt-BR.

### D. Structured data

Parsear todos os JSON-LD.

Confirmar ausência de dados inventados.

### E. Links

Executar checagem interna simples para links públicos principais.

Não exigir crawler externo pesado se não houver dependência.

Garantir Termos/Privacidade sem links quebrados ou registrar bloqueio explícito.

### F. Analytics

Inspecionar código/event payloads.

Confirmar que nenhum payload inclui:

```text
email
name
cpfCnpj
userId
workspaceId
secrets
affiliateUrl
article body
```

### G. Consent

Testar estados:

```text
new visitor
accepted
rejected
changed preference
```

### H. Performance

Evitar regressões óbvias:

- GTM não duplicado;
- sem múltiplos GA loaders;
- imagens otimizadas;
- scripts não essenciais não bloqueiam render;
- Server Components preservados quando possível.

Se Lighthouse estiver disponível no projeto/CI, executar. Não adicionar dependência pesada apenas para cumprir checklist.

### I. Build

Obrigatório:

```bash
npx tsc --noEmit
npm run lint
npm test  # quando existir/for aplicável
npm run build
```

## Testes recomendados

Adicionar testes pequenos e estáveis onde trouxerem valor, por exemplo:

- sitemap excludes private routes;
- sitemap excludes drafts;
- site config canonical host;
- analytics event payload type/allowlist;
- JSON-LD objects serializam.

Não criar suite brittle baseada em snapshots enormes de HTML.

## External Validation Checklist

Esta parte é manual e deve ser marcada como `PENDING EXTERNAL` se o agente não tiver acesso às contas Google:

- [ ] Search Console domain verified
- [ ] sitemap submitted and accepted
- [ ] URL Inspection home
- [ ] Rich Results/Schema validation
- [ ] GTM Preview
- [ ] Tag Assistant
- [ ] GA4 Realtime
- [ ] Search Console linked to GA4

O agente não deve falsificar PASS para ações externas que não executou.

## Definition of Done

- [ ] todas as rotas SEO respondem corretamente.
- [ ] noindex policy validada.
- [ ] sitemap limpo.
- [ ] robots coerente.
- [ ] canonicals coerentes.
- [ ] metadata única nas landings.
- [ ] JSON-LD válido/factual.
- [ ] GTM único.
- [ ] consent funcional.
- [ ] analytics sem PII.
- [ ] links internos críticos sem quebra.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Tests PASS quando aplicável.
- [ ] Build PASS.
- [ ] itens externos marcados honestamente como PASS/PENDING.
- [ ] PROGRESS atualizado.
- [ ] MEMORY/decisions atualizados quando necessário.

## Evidence final

Criar seção em PROGRESS:

```text
## Phase 28 Final Evidence

Technical SEO:
Measurement:
Landing pages:
Blog:
Privacy/PII:
Validation commands:
External validations pending:
Discovered Work:
```

Não declarar Phase 28 DONE se houver critério técnico interno falhando.
