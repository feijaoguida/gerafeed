# Design System GeraFeed — Documentação Técnica & Identidade Visual

## 1. Identidade e Filosofia
- **Posicionamento**: "Conteúdo que flui. Inteligência que publica."
- **Atributos visuais**: Tecnologia, Inteligência Artificial, Publicação & Curadoria, Produtividade, SaaS Premium.
- **Princípio fundamental**: Componentes agnósticos a regras de negócio no nível de primitivas (`components/ui`), compostos em blocos de design system (`components/design-system`) e layouts padronizados (`components/layout`).

---

## 2. Paleta de Cores e Tokens Semânticos

### 2.1 Paleta Principal da Marca
- **Primary Blue**: `#2563EB` (Ação primária, tecnologia)
- **Primary Purple**: `#7C3AED` (Inteligência artificial, fluxo criativo)
- **Accent Teal**: `#00C2A8` (Originalidade, destaque pontual, sucesso verificado)
- **Dark / Ink**: `#0F172A` (Textos e superfícies escuras sólidas)
- **Muted**: `#64748B` (Textos secundários e bordas neutras)
- **Light Surface**: `#F1F5F9` (Superfície secundária clara)

### 2.2 Gradiente da Marca (Brand Gradient)
```css
--gradient-brand: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
--gradient-brand-teal: linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #00C2A8 100%);
```
*Uso restrito*: CTA principal ("Publicar agora"), item ativo importante de navegação, destaque de marca/ícone principal.

### 2.3 Mapeamento de Tokens Semânticos (Light & Dark)

| Token Semântico | Light Mode | Dark Mode | Descrição / Uso |
|---|---|---|---|
| `--background` | `#F8FAFC` | `#07111F` / `#081221` | Fundo principal da página |
| `--foreground` | `#0F172A` | `#F8FAFC` | Texto principal de leitura |
| `--surface` | `#FFFFFF` | `#0D1B2D` | Superfície padrão de cards e painéis |
| `--surface-elevated` | `#FFFFFF` (c/ shadow) | `#112239` | Modais, popovers e cards destacados |
| `--surface-muted` | `#F1F5F9` | `#091626` | Fundo de inputs, tabelas e headers secundários |
| `--border` | `rgba(226, 232, 240, 0.8)` | `rgba(148, 163, 184, 0.12)` | Borda padrão e divisores |
| `--border-strong` | `#CBD5E1` | `rgba(148, 163, 184, 0.25)` | Bordas com foco ou destaque |
| `--primary` | `#2563EB` | `#3B82F6` | Cor primária interativa |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Texto sobre cor primária |
| `--secondary` | `#F1F5F9` | `#1E293B` | Ações e elementos secundários |
| `--secondary-foreground` | `#0F172A` | `#F8FAFC` | Texto sobre secundário |
| `--accent` | `#00C2A8` | `#00C2A8` | Cor de destaque / originalidade |
| `--accent-foreground` | `#FFFFFF` | `#0F172A` | Texto sobre destaque |
| `--muted` | `#F1F5F9` | `#1E293B` | Elementos de apoio |
| `--muted-foreground` | `#64748B` | `#94A3B8` | Textos secundários, legendas |
| `--success` | `#10B981` | `#10B981` | Sucesso / Conectado / Publicado |
| `--success-foreground`| `#FFFFFF` | `#FFFFFF` | Texto sobre sucesso |
| `--warning` | `#F59E0B` | `#F59E0B` | Atenção / Pendente |
| `--warning-foreground`| `#FFFFFF` | `#FFFFFF` | Texto sobre atenção |
| `--danger` | `#EF4444` | `#EF4444` | Erros / Rejeitado / Falha |
| `--danger-foreground` | `#FFFFFF` | `#FFFFFF` | Texto sobre erro |
| `--ring` | `#2563EB` | `#3B82F6` | Anel de acessibilidade `focus-visible` |

---

## 3. Tipografia

- **Títulos e Destaques (Display & Headings)**: **Sora** (pesos: 500, 600, 700) carregada via `next/font/google`.
- **Textos e Interface (Body & UI)**: **Inter** (pesos: 400, 500, 600, 700) carregada via `next/font/google`.

### 3.1 Tokens de Tipografia
- `display`: `font-heading text-4xl sm:text-5xl font-bold tracking-tight`
- `heading-1`: `font-heading text-3xl font-bold tracking-tight`
- `heading-2`: `font-heading text-2xl font-semibold tracking-tight`
- `heading-3`: `font-heading text-xl font-semibold`
- `heading-4`: `font-heading text-lg font-semibold`
- `body`: `font-sans text-base text-foreground`
- `body-small`: `font-sans text-sm text-foreground`
- `label`: `font-sans text-xs sm:text-sm font-medium text-foreground`
- `caption`: `font-sans text-xs text-muted-foreground`
- `overline`: `font-heading text-[11px] font-bold uppercase tracking-wider text-muted-foreground`

---

## 4. Status Semânticos do Sistema
Centralizados no `StatusIndicator` e `Badge`:
- `ACTIVE` / `CONNECTED` / `PUBLISHED`: Verde (`success`)
- `PENDING`: Âmbar (`warning`)
- `PROCESSING`: Azul Claro (`info` ou `processando`)
- `REWRITTEN` (Reescrito): Roxo (`purple` / `brand`)
- `REJECTED` / `FAILED` / `DISCONNECTED` / `SUSPENDED`: Vermelho (`danger`)
- `PAST_DUE`: Laranja escuro / Âmbar

---

## 5. Visualizador no Backoffice
- Rota acessível para SuperAdmin: `/backoffice/design-system`
- Rota alias de desenvolvimento: `/design-system`
- Apresenta:
  - Paleta de cores interativa com amostras hexadecimais nos modos Claro e Escuro.
  - Demonstração tipográfica de Sora e Inter em todas as escalas.
  - Mostruário de botões (variantes, tamanhos, ícones, estados de loading).
  - Badges e status indicadores.
  - Cartões interativos (StatCard, FeatureCard, DataCard).
  - Controles de formulário (Inputs, Select, Switch, Textarea, FormField com validação).
  - Barras de progresso e empty states.
  - Alternador dinâmico de tema (Light / Dark) diretamente na página.
