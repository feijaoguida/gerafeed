# Task 231. Sitemap, Robots & Canonicals

## Contexto

A Task 230 estabeleceu política de metadata. Agora a aplicação precisa publicar sinais técnicos de crawling e canonicalização compatíveis com Next.js App Router.

## Objetivo

Implementar:

- `/sitemap.xml`;
- `/robots.txt`;
- canonicals para páginas públicas indexáveis existentes;
- política central de URLs indexáveis reutilizável sem overengineering.

## Antes de implementar

Inspecione:

- versão do Next.js;
- metadata API já usada;
- rotas públicas reais após Task 230;
- redirects/rewrites de host;
- configuração Vercel;
- existência de `sitemap.ts`, `robots.ts`, arquivos estáticos ou biblioteca SEO anterior.

Se já existir solução funcional, evolua em vez de duplicar.

## Implementação

### A. Sitemap

Preferir convenção App Router, normalmente `src/app/sitemap.ts`, se suportada pela versão atual.

Neste momento listar apenas rotas públicas realmente existentes e indexáveis.

Não incluir rotas futuras que ainda retornem 404.

Nunca incluir:

```text
/login
/register
/dashboard
/articles/*
/publishing/*
/settings/*
/affiliates/*
/backoffice/*
/api/*
```

Quando futuras landing pages/blog forem implementados, o sitemap será estendido nas Tasks 236/237.

Usar host:

```text
https://www.gerafeed.com.br
```

Não atribuir `lastModified: new Date()` indiscriminadamente em todo request se a página não mudou. Para páginas estáticas sem fonte real de data, omitir ou usar uma constante derivada de release apenas se houver mecanismo confiável.

### B. Robots

Preferir `src/app/robots.ts` se suportado.

Deve:

- permitir crawling público;
- declarar sitemap absoluto;
- reduzir crawling inútil de `/api/` e `/backoffice/`;
- não ser tratado como proteção de dados.

Cuidado com `Disallow` em páginas HTML que usam `noindex`. Se login/register já foram descobertos, mantenha crawleáveis para o crawler poder ler `noindex`.

Para áreas privadas protegidas por auth, documentar a escolha e garantir que nada sensível dependa de robots.

### C. Canonicals

Adicionar canonical explícito em páginas públicas indexáveis existentes.

Regras:

- host `www`;
- HTTPS;
- sem UTM/query string;
- a home canonicaliza para `/`;
- cada página canonicaliza para si mesma;
- não canonicalizar login/register para home. Essas páginas usam noindex.

### D. Host consistency

Inspecionar se produção aceita `gerafeed.com.br` e `www.gerafeed.com.br`.

Se houver redirect canônico já configurado fora do repo, documentar.

Não alterar DNS nesta task.

Se o código precisar de redirect e não houver informação suficiente, registrar Discovered Work em vez de improvisar infraestrutura.

## Fora de escopo

- criar landing pages futuras;
- blog;
- Search Console externo;
- DNS;
- GTM;
- JSON-LD.

## Definition of Done

- [ ] `/sitemap.xml` responde 200 em build/runtime aplicável.
- [ ] sitemap contém somente URLs públicas existentes e indexáveis.
- [ ] sitemap não contém áreas privadas.
- [ ] `/robots.txt` responde 200.
- [ ] robots referencia o sitemap oficial.
- [ ] canonicals corretos nas páginas públicas existentes.
- [ ] host canônico consistente.
- [ ] sem datas falsas no sitemap.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Build PASS.

## Validation

Executar:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Se possível após build/start local:

```bash
curl -I http://localhost:3000/robots.txt
curl http://localhost:3000/robots.txt
curl -I http://localhost:3000/sitemap.xml
curl http://localhost:3000/sitemap.xml
```

Validar que nenhum path privado aparece no XML.

## Evidence

Registrar URLs presentes no sitemap, conteúdo essencial do robots, política de canonical e validações.
