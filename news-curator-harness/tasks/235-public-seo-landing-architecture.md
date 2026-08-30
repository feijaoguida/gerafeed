# Task 235. Public SEO Landing Architecture

## Contexto

A aplicação já possui Design System. Antes de criar seis landing pages, é necessário estabelecer composição reutilizável para conteúdo SEO sem transformar a home em um monólito ou copiar JSX entre páginas.

## Objetivo

Criar componentes/blocos de landing reutilizáveis e uma configuração editorial simples para páginas públicas, sem implementar ainda todas as páginas finais.

## Antes de implementar

Inspecione:

- home atual;
- componentes públicos reutilizáveis;
- Design System;
- header/footer/nav público;
- padrões de CTA;
- assets de logo/screenshots;
- responsividade e dark mode.

Reutilize antes de criar.

## Implementação

Criar apenas os blocos necessários e agnósticos ao conteúdo, por exemplo:

```text
SeoHero
ProblemSection
WorkflowSteps
FeatureGrid
UseCaseSection
TrustSection
FaqSection
RelatedLinks
SeoCta
PublicFooter
```

Os nomes podem mudar conforme arquitetura atual.

### Regras

- componentes recebem conteúdo via props;
- nada de regras de billing/domain dentro das primitivas;
- semantic HTML;
- um H1 por página;
- heading hierarchy previsível;
- links internos via `next/link`;
- CTA reutiliza rota real de cadastro;
- imagens usam solução atual do Next.js;
- Design System e tokens existentes;
- Light/Dark onde a experiência pública já suporta;
- sem dependência de page builder.

### FAQ

FAQ visual é permitido quando útil.

Não adicionar automaticamente `FAQPage` JSON-LD. Esse rich result não deve ser perseguido como truque.

### Conteúdo

Nesta task usar uma página sandbox/dev já existente apenas se houver rota apropriada, ou criar stories/test harness local conforme convenção. Não publicar páginas SEO vazias.

## Fora de escopo

- escrever as seis landings completas;
- blog;
- CMS;
- A/B testing;
- banco de dados para conteúdo institucional.

## Definition of Done

- [ ] arquitetura de blocos pública definida.
- [ ] componentes reutilizam Design System.
- [ ] semantic HTML.
- [ ] tipagem forte das props.
- [ ] nenhuma duplicação grosseira com home existente.
- [ ] responsivo.
- [ ] acessível.
- [ ] CTA usa rota real.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Build PASS.

## Validation

Renderizar composição de exemplo sem expor página inútil indexável.

Validar heading hierarchy, keyboard navigation e responsive layout.

## Evidence

Registrar componentes criados/reutilizados e rationale de composição.
