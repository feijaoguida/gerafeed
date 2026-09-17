# Kinetiqo — Design System

Padrões visuais da plataforma Kinetiqo. Inspirado em softwares reais (Linear, Stripe): minimalista, corporativo e humano — sem gradientes exagerados, ícones flutuantes ou estética genérica de IA.

---

## 1. Princípios

1. **Restrito e sofisticado** — paleta enxuta baseada na identidade Kinetiqo; nada de arco-íris.
2. **Hierarquia por peso, não por cor** — títulos em `font-bold`, textos em `font-medium`, rótulos em maiúsculas pequenas.
3. **Superfícies suaves** — painéis arredondados, bordas sutis, sombras extremamente leves.
4. **Espaçamento assimétrico inteligente** — grids com proporções variadas (`1.55fr / 0.65fr`), nunca fileiras de cards idênticos em excesso.
5. **Dados reais, nunca placeholder** — nomes, valores e códigos verossímeis em PT-BR (ex.: `OC-2026-0942`, `R$ 86.400`). Proibido "Lorem Ipsum" ou "Título do Card 1".

---

## 2. Cores

Todas as cores são definidas em **oklch** em `src/styles.css` (`:root`) e mapeadas em `@theme inline`, gerando utilitários Tailwind (`bg-primary`, `text-success`…). Nunca usar hex arbitrário ou `bg-[#...]` nos componentes.

### Marca

| Nome | Token CSS | Utilitário | Hex ref. | Uso |
|---|---|---|---|---|
| Kinetiqo Blue | `--primary` | `bg-primary` / `text-primary` | `#073C8C` | Cor primária, CTAs, kickers, links |
| Brand Deep | `--brand-deep` | `bg-brand-deep` | — | Títulos fortes, sombras, logo |
| Brand Mark | `--brand-mark` | `bg-brand-mark` | — | Marca/logo |
| Cyan Drive | `--brand-cyan` | `bg-brand-cyan` | `#10C6D9` | Acento secundário |
| Cyan Strong | `--cyan-strong` | `text-cyan-strong` | — | Ícones/tendências neutras-positivas |
| Clean White | `--brand-surface` | `bg-brand-surface` | `#F8FBFC` | Fundo claro de destaque |
| Ops Gray | `--ops-gray` | `bg-ops-gray` | `#7B858A` | Texto de apoio neutro |

### Superfícies e texto

| Token | Valor | Uso |
|---|---|---|
| `--background` | `oklch(0.965 0.008 230)` | Fundo geral da página |
| `--card` | `oklch(0.998 0.002 230)` | Painéis e cartões (`soft-panel`) |
| `--foreground` | `oklch(0.22 0.035 255)` | Texto principal |
| `--muted-foreground` | `oklch(0.53 0.025 245)` | Texto secundário, descrições |
| `--border` | `oklch(0.9 0.012 240)` | Bordas sutis (equivalente a `border-slate-200`) |
| `--input` | `oklch(0.88 0.014 240)` | Borda de campos |
| `--muted` | `oklch(0.956 0.009 235)` | Fundos neutros, cabeçalho de tabela |
| `--ring` | `oklch(0.55 0.16 235)` | Foco de inputs |

### Status

| Semântica | Sólida | Suave (fundo de painel) |
|---|---|---|
| Sucesso | `--success` → `text-success` | `--success-soft` → `bg-success-soft` |
| Atenção | `--warning` / `--warning-strong` | `--warning-soft` |
| Erro | `--danger` | — |
| Info | `--primary` sobre `--info-soft` | `--info-soft` |

> **Regra:** as classes de tom são sempre **estáticas** (`bg-success`, `bg-warning`, `bg-danger`) — nunca montadas dinamicamente (`bg-${tone}`), pois o Tailwind v4 não compila classes dinâmicas.

### Avatar e overlay

| Token | Valor |
|---|---|
| `--avatar` | `oklch(0.88 0.07 205)` |
| `--avatar-foreground` | `oklch(0.28 0.08 245)` |
| `--overlay` | `oklch(0.12 0.02 250 / 55%)` |
| `--google` | `oklch(0.55 0.2 255)` (botão "Continuar com Google") |

---

## 3. Tipografia

**Família única:** *Plus Jakarta Sans*, carregada via `<link>` no `src/routes/__root.tsx` e definida como `--font-sans`.

| Elemento | Classe | Peso |
|---|---|---|
| Título de página (`h1`) | `text-3xl font-bold tracking-tight` | 700 |
| Título de seção (`h2`) | `text-xl font-bold` | 700 |
| Valor destaque (KPI) | `text-2xl font-bold` | 700 |
| Número gigante | `text-4xl font-bold` | 700 |
| Texto corrido | `text-sm text-muted-foreground` | 400/500 |
| Rótulo de campo/KPI | `.label` (0.72rem, uppercase, 600) | 600 |
| Kicker de seção | `.section-kicker` (0.7rem, uppercase, 700, tracking 0.08em, cor primária) | 700 |
| Metadados/timestamps | `text-[11px]` ou `text-xs` | 400–600 |

Regras:
- **Nunca** usar serifas ou fontes decorativas.
- `font-medium` para texto, `font-bold` para títulos — contraste de peso bem definido.
- `letter-spacing: 0` no corpo; tracking positivo só em rótulos uppercase.

---

## 4. Raios, bordas e sombras

Base de raio: `--radius: 0.8rem` (escala `sm` → `4xl` derivada dela).

| Padrão | Valor |
|---|---|
| Painel (`soft-panel`) | `border-radius: 1rem`, borda 1px `color-mix(border 78%)` |
| Botões/campos | `rounded-lg` (derivado de `--radius`) |
| Ícone quadrado de KPI | `rounded-xl` |
| Tendência (pill) | `rounded-full` |
| Barras de gráfico | `rounded-t-sm` |

**Sombra padrão** (única sombra permitida, extremamente leve):

```css
box-shadow: 0 10px 30px -22px color-mix(in oklab, var(--color-brand-deep) 28%, transparent);
```

Sombras fortes ou `drop-shadow` decorativos são proibidos.

---

## 5. Espaçamento e layout

- Container central: `mx-auto max-w-[1500px] px-5 py-7 lg:px-8 lg:py-8` (dashboard) ou `max-w-6xl` (páginas de conteúdo).
- Gap padrão de grids: `gap-4` (cards) e `gap-6` (blocos).
- Padding interno de painéis: `p-5 sm:p-6`.
- Espaço entre seções: `mt-6` / `mt-7`; no design system, `ds-section` usa `mt-12 pt-8` com borda superior.
- Grids assimétricos: `xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.65fr)]` para conteúdo + lateral.
- Respiro vertical interno: `mt-4` (título→conteúdo), `mt-7` (blocos dentro do painel).

---

## 6. Componentes e utilitários

### Utilitários CSS (`@utility` em `src/styles.css`)

| Utilitário | Definição |
|---|---|
| `soft-panel` | Painel padrão: borda sutil, raio 1rem, fundo `card`, sombra leve |
| `section-kicker` | Rótulo uppercase em cor primária acima dos títulos de seção |
| `label` | Rótulo de dado (uppercase, muted) |
| `value-sm` | Valor numérico médio (1.25rem, bold) |
| `ds-section` | Seção da página de design system (borda superior + espaço) |
| `status-panel` | Painel de status: flex, gap 0.75rem, raio `--radius`, p-4, texto 0.875rem/600 |

### Padrões de composição

- **KPI card:** ícone `size-10 rounded-xl bg-muted` + pill de tendência `rounded-full bg-background/75` + rótulo uppercase + valor `text-2xl font-bold` + detalhe `text-xs`. Hover: `hover:-translate-y-0.5` com transição de 200ms.
- **Cabeçalho de seção:** `section-kicker` + `h2 text-xl font-bold` à esquerda, `Button variant="ghost" size="sm"` à direita (`items-end justify-between`).
- **Tabela simples:** cabeçalho `bg-muted/60` com texto `text-[11px] font-bold uppercase`, linhas separadas por `border-t border-border`, sem zebra.
- **Gráfico de barras:** CSS puro (`h-44 items-end gap-2`), barras `bg-chart-fill` com `group-hover:bg-primary`.
- **Atividades:** lista com `divide-y divide-border`, dot de status `size-2.5 rounded-full` com classe estática de tom.
- **Ícones:** Lucide (`lucide-react`), `size-4`, sempre funcionais — nunca decorativos/flutuantes.
- **Botões:** shadcn (`Button`) nas variantes `default`, `outline`, `ghost`, `destructive`; ícone à esquerda, sem texto uppercase.

---

## 7. Acessibilidade e conteúdo

- Contraste mínimo AA; texto secundário sempre em `text-muted-foreground`, nunca cinza muito claro sobre branco.
- Gráficos e elementos visuais com `aria-label` descritivo; botões só de ícone com `aria-label`.
- Datas e valores sempre em formato brasileiro (`R$ 842 mil`, `3h 18m`, `94,2%`).
- Títulos de página únicos via `head()` da rota (ex.: "Dashboard executivo — Kinetiqo").

---

## 8. Como adicionar uma nova cor

1. Adicione a variável em `:root` (formato oklch) em `src/styles.css`.
2. Registre em `@theme inline` como `--color-<nome>: var(--<nome>)`.
3. Use somente o utilitário gerado (`bg-<nome>` / `text-<nome>`) — nunca hex inline.
