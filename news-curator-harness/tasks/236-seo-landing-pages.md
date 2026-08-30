# Task 236. SEO Landing Pages

## Contexto

A Task 235 criou blocos reutilizáveis. Agora serão publicadas as primeiras páginas destinadas a intenções de busca específicas.

## Objetivo

Implementar seis landing pages públicas:

```text
/como-funciona
/automacao-wordpress
/rss-para-wordpress
/curadoria-de-conteudo-com-ia
/para-agencias
/para-portais-de-noticias
```

## Regra central

Cada página precisa responder a uma intenção própria. Não criar doorway pages trocando palavras-chave em texto quase idêntico.

## Antes de implementar

Inspecione o produto atual para confirmar capacidades reais.

Não afirmar feature apenas porque aparece em copy antiga.

Quando houver dúvida, usar linguagem factual mais conservadora ou registrar Discovered Work.

## Conteúdo por página

### 1. /como-funciona

Intenção: entender o fluxo do GeraFeed.

Title sugerido:

```text
Como funciona o GeraFeed | Curadoria e Publicação no WordPress
```

H1:

```text
Da fonte RSS à publicação no WordPress em um fluxo editorial controlado
```

Explicar:

```text
Fontes → captura → seleção → IA → revisão → WordPress
```

Enfatizar aprovação/revisão quando compatível com produto.

### 2. /automacao-wordpress

Keyword/intenção principal:

```text
automatizar blog wordpress
```

Title:

```text
Automação de Conteúdo para WordPress com IA | GeraFeed
```

Foco:
- operação editorial;
- múltiplos sites;
- produtividade;
- controle humano;
- feeds e publicação.

### 3. /rss-para-wordpress

Intenção:

```text
RSS para WordPress
importar RSS WordPress
RSS para post WordPress
```

Explicar diferença entre:

```text
agregação
importação
curadoria editorial
```

### 4. /curadoria-de-conteudo-com-ia

Foco:
- IA como assistente;
- seleção/contextualização/revisão;
- evitar promessa de geração automática "sem plágio";
- people-first e controle editorial.

### 5. /para-agencias

Foco B2B:
- múltiplos clientes/sites;
- padronização operacional;
- produtividade da equipe;
- governança por Workspace/site quando aplicável;
- CTA comercial/cadastro coerente com produto.

Não afirmar white-label se não existir.

### 6. /para-portais-de-noticias

Foco:
- monitoramento de feeds;
- fila editorial;
- velocidade de operação;
- múltiplos destinos;
- revisão;
- publicação WordPress.

Não vender "copiar notícias" como valor.

## Posicionamento obrigatório

Preferir termos:

```text
curadoria editorial
assistência de IA
operação editorial
monitoramento de fontes
transformação de pauta
revisão
publicação WordPress
```

Evitar como headline/benefício central:

```text
anti-plágio
copiar notícia
reescrever qualquer site
enganar detector
garantia de ranking
```

## SEO técnico

Cada página:

- metadata própria;
- canonical própria;
- OG/Twitter;
- H1 único;
- links internos para 2+ páginas relevantes quando natural;
- CTA para cadastro;
- adicionada ao sitemap;
- não depende de query string;
- 200 status.

## Visual

Usar Design System oficial:

- Sora headings;
- Inter body;
- Blue/Purple brand gradient com moderação;
- Accent Teal pontual;
- componentes existentes.

Não recriar identidade paralela.

## Fora de escopo

- blog posts;
- páginas para dezenas de keywords;
- testimonials falsos;
- benchmark sem dados;
- tradução EN/ES;
- schema Review.

## Definition of Done

- [ ] seis rotas implementadas.
- [ ] seis intents claramente diferentes.
- [ ] metadata/canonical por rota.
- [ ] sitemap atualizado.
- [ ] links internos funcionais.
- [ ] CTA funcional.
- [ ] conteúdo não promete capabilities inexistentes.
- [ ] nenhuma promessa anti-plágio como eixo principal.
- [ ] responsivo e acessível.
- [ ] Design System preservado.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Build PASS.

## Validation

Validar cada URL após build e inspecionar metadata/headings.

Criar uma matriz simples:

```text
URL | intent | title | H1 | canonical | in sitemap | CTA
```

## Evidence

Registrar matriz e arquivos criados.
