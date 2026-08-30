# Task 237. Blog Foundation

## Contexto

O GeraFeed precisa de uma base de conteúdo indexável para atacar dúvidas do público. Esta task cria infraestrutura de blog. Não é uma autorização para gerar dezenas de artigos automaticamente.

## Objetivo

Implementar:

```text
/blog
/blog/[slug]
```

com conteúdo versionado, SEO técnico e integração ao sitemap.

## Antes de implementar

Inspecione:

- package.json;
- configuração Next.js;
- qualquer dependência MD/MDX já instalada;
- padrão de rendering de conteúdo rico;
- Sanitization utilities existentes;
- Design System;
- estratégia de imagens.

### Decisão de implementação

Se já houver uma content engine no repo, reutilize.

Se não houver, preferir a solução filesystem Markdown/MDX mais simples compatível com a versão atual do Next.js e Vercel.

Não instalar CMS externo.

Se uma nova dependência for realmente necessária, justificar antes no plano da task e escolher a menor solução estável.

## Modelo de conteúdo

Frontmatter mínimo:

```yaml
title:
description:
slug:
publishedAt:
updatedAt:
author:
category:
tags: []
image:
draft: true|false
```

`updatedAt` é opcional e só deve existir quando realmente atualizado.

### Drafts

- não aparecem em `/blog` em produção;
- não entram no sitemap;
- não geram static params públicos quando a arquitetura permitir filtragem.

## /blog

Deve possuir:

- title/description próprios;
- H1;
- cards dos posts publicados;
- data, categoria e descrição;
- links semânticos;
- EmptyState adequado enquanto não houver posts publicados;
- canonical;
- paginação só se necessária. Não construir antes da necessidade.

## /blog/[slug]

Deve possuir:

- title do artigo;
- meta description;
- canonical;
- Open Graph;
- Article/BlogPosting JSON-LD factual;
- author factual;
- publishedAt factual;
- updatedAt opcional factual;
- heading hierarchy;
- conteúdo legível;
- links internos;
- CTA contextual para GeraFeed;
- breadcrumb visual ou navegação simples quando útil.

## Segurança

Não renderizar HTML arbitrário inseguro sem sanitização/compilação confiável.

Conteúdo fica controlado pelo repositório nesta fase.

## Sitemap

Adicionar posts publicados dinamicamente.

`lastModified` pode usar `updatedAt ?? publishedAt`.

## Conteúdos iniciais

Preparar a estrutura para estes briefs:

1. Como automatizar um blog WordPress com RSS + IA sem prejudicar o SEO
2. Conteúdo com IA é penalizado pelo Google? Guia para WordPress
3. RSS para WordPress: como transformar feeds em posts completos
4. Como criar um portal de notícias no WordPress com automação editorial
5. Autoblogging WordPress: plugin, n8n ou plataforma SaaS?

Não inventar artigos completos nesta task se o operador não forneceu/aprovou conteúdo.

Pode adicionar um arquivo de exemplo com `draft: true` apenas para testar a pipeline, claramente marcado e excluído de produção/sitemap.

## Fora de escopo

- editor WYSIWYG;
- CMS administrativo;
- comentários;
- newsletter;
- busca full-text;
- categorias dinâmicas no banco;
- IA gerando conteúdo em produção automaticamente.

## Definition of Done

- [ ] `/blog` implementado.
- [ ] `/blog/[slug]` implementado.
- [ ] source de conteúdo versionado definido.
- [ ] drafts excluídos de produção/sitemap.
- [ ] metadata por post.
- [ ] canonical por post.
- [ ] Article/BlogPosting JSON-LD factual.
- [ ] posts publicados entram no sitemap.
- [ ] Design System reutilizado.
- [ ] semantic HTML/acessibilidade.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] testes aplicáveis PASS.
- [ ] Build PASS.

## Validation

Testar pelo menos:

- blog vazio ou com draft only;
- um post published fixture em teste/dev;
- slug inexistente retorna comportamento 404 correto;
- draft não aparece;
- sitemap filtra drafts.

## Evidence

Registrar arquitetura escolhida, dependências adicionadas se houver, rotas, sitemap e validações.
