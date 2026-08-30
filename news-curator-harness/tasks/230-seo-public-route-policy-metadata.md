# Task 230. SEO Public Route Policy & Metadata Baseline

## Contexto

A Phase 27 foi concluída. A aplicação já possui telas públicas migradas para o Design System, mas a Phase 28 precisa separar claramente páginas de aquisição das páginas de autenticação, aplicação e Backoffice.

O objetivo desta task é corrigir a base de metadata e criar uma política explícita de indexação por layout/rota, sem implementar sitemap, robots, GTM ou novas landing pages ainda.

## Objetivo

Garantir que:

1. a home tenha metadata comercial própria;
2. login/register não herdem title/description da home;
3. áreas autenticadas e Backoffice emitam `noindex` quando aplicável;
4. `metadataBase` e host canônico estejam centralizados;
5. a linguagem do documento esteja correta para pt-BR;
6. links de Termos/Privacidade usados no cadastro apontem para rotas reais ou gerem Discovered Work explícito se as páginas ainda não existirem.

## Antes de implementar

Inspecione obrigatoriamente:

- `src/app/layout.tsx`;
- `src/app/(public)/layout.tsx`;
- `src/app/(public)/page.tsx`;
- login/register atuais;
- layouts de `(app)` e `(backoffice)`;
- qualquer helper/configuração de metadata já existente;
- assets de favicon/OG/logo;
- rotas atuais de termos e privacidade.

Não presuma nomes de arquivos além dos encontrados no repositório.

## Implementação

### A. Criar configuração central do site

Preferir um módulo pequeno, por exemplo `src/lib/site-config.ts`, somente se não houver equivalente.

Deve centralizar pelo menos:

```ts
name
url
defaultTitle
defaultDescription
locale
```

URL canônica:

```text
https://www.gerafeed.com.br
```

Não duplicar constantes em múltiplos layouts.

### B. Root metadata

Configurar `metadataBase` com a URL oficial.

Definir `lang="pt-BR"` no documento se ainda não estiver correto.

O root layout pode conter defaults neutros da marca, mas não deve forçar login/register a usar o mesmo title comercial da home.

### C. Home

Metadata sugerida:

```text
Title:
GeraFeed | Automação de Conteúdo com IA para WordPress

Description:
Monitore feeds RSS, transforme pautas em artigos, revise com IA e publique em múltiplos sites WordPress. Automatize sua operação editorial com o GeraFeed.
```

Open Graph/Twitter devem usar a mesma mensagem central e asset oficial existente quando possível.

Se o H1 atual não comunicar intenção de busca, ajustar sem quebrar o design:

```text
Automatize a Curadoria e Publicação de Conteúdo no WordPress com IA
```

Preservar tagline da marca como apoio:

```text
Conteúdo que flui. Inteligência que publica.
```

### D. Login e Register

Configurar metadata específica com:

```text
robots: noindex, follow
```

Titles descritivos, por exemplo:

```text
Entrar | GeraFeed
Criar conta | GeraFeed
```

Não usar title da home.

### E. Área autenticada e Backoffice

Aplicar metadata de layout apropriada para impedir indexação das superfícies privadas.

Não alterar autorização.

SEO não substitui middleware, session checks ou regras server-side.

### F. Termos e Privacidade

Verificar links atuais.

Se as rotas existem, corrigir links incorretos.

Se não existem e a criação exigir conteúdo jurídico ainda não fornecido, NÃO inventar texto legal. Registrar:

```text
## Discovered Work
Descrição: criar páginas públicas de Termos e Privacidade com conteúdo aprovado.
Motivo: links do cadastro precisam apontar para documentos reais.
Impacto: confiança, compliance e SEO institucional.
```

Pode criar apenas shell/placeholder explícito se a task atual já possuir conteúdo real aprovado no repositório. Caso contrário, não fabricar política jurídica.

## Fora de escopo

- sitemap;
- robots.txt;
- JSON-LD;
- GTM/GA4;
- banner de cookies;
- novas landing pages;
- blog;
- reescrever toda a landing page;
- alterar regras de negócio.

## Definition of Done

- [ ] site config central reutiliza URL/brand quando necessário.
- [ ] `metadataBase` configurado.
- [ ] documento usa pt-BR.
- [ ] home possui title e description próprios.
- [ ] home possui OG/Twitter coerente se infraestrutura atual suportar.
- [ ] login possui title próprio e `noindex`.
- [ ] register possui title próprio e `noindex`.
- [ ] layout autenticado possui política `noindex`.
- [ ] Backoffice possui política `noindex`.
- [ ] links Termos/Privacidade foram inspecionados e corrigidos ou Discovered Work registrado.
- [ ] nenhuma autorização foi enfraquecida.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] testes aplicáveis PASS.
- [ ] Build PASS.

## Validation

Executar no mínimo:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Além disso, validar HTML final de:

```text
/
/login
/register
/dashboard ou equivalente protegido
/backoffice
```

Confirmar title, description e robots no `<head>`.

## Evidence

Registrar em PROGRESS.md:

- arquivos alterados;
- metadata final da home;
- evidência de noindex em login/register/app/backoffice;
- resultado de TypeScript/Lint/Build;
- Discovered Work, se houver.
