# GeraFeed — Design System

> Guia de referência visual e técnico para manter o sistema consistente, moderno, clean e acessível.
>
> **Stack considerada:** Next.js 16, React 19, Tailwind CSS 4, `lucide-react`, `framer-motion` e `next-themes`.

## 1. Princípios

- **Clareza primeiro:** cada tela deve ter uma ação principal evidente.
- **Densidade controlada:** use cards e agrupamentos para organizar informação, sem excesso de decoração.
- **Contraste funcional:** cor deve comunicar estado, não apenas ornamentar.
- **Consistência:** reutilize tokens, espaçamentos, raios e componentes.
- **Responsividade:** desenhe primeiro para telas menores e expanda progressivamente.
- **Acessibilidade:** mantenha foco visível, labels associados e contraste mínimo WCAG AA.

## 2. Identidade visual

### 2.1 Paleta principal

| Token | Hex | Uso |
|---|---:|---|
| `brand-blue` | `#2563EB` | Ações primárias, links, foco e destaque de navegação |
| `brand-purple` | `#7C3AED` | IA, ações especiais, gradientes de marca e conteúdo gerado |
| `brand-teal` | `#00C2AB` | Sucesso, conectado, publicação concluída e IA ativa |
| `ink-navy` | `#0F172A` | Texto forte, superfícies escuras e elementos de alta ênfase |
| `slate` | `#64748B` | Texto secundário, ícones neutros e metadados |
| `cloud` | `#F1F5F9` | Fundo claro, bordas suaves e superfícies claras |

### 2.2 Tokens semânticos

Use tokens semânticos em vez de espalhar hexadecimais pelo código:

```css
:root {
  --background: #f1f5f9;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --muted: #e8eef6;
  --muted-foreground: #64748b;
  --border: #d9e2ef;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #7c3aed;
  --success: #00c2ab;
  --warning: #f59e0b;
  --destructive: #f43f5e;
}

.dark {
  --background: #07090d;
  --foreground: #f8fafc;
  --card: #111827;
  --card-foreground: #f8fafc;
  --muted: #172338;
  --muted-foreground: #94a3b8;
  --border: #26364e;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #7c3aed;
  --success: #00c2ab;
  --warning: #f59e0b;
  --destructive: #fb385d;
}
```

### 2.3 Modo claro e escuro

- **Light:** fundo `#F1F5F9`, cards brancos, bordas `#D9E2EF` e texto `#0F172A`.
- **Dark:** fundo quase preto `#07090D`, sidebar `#111318`, cards `#1B293E`, bordas azul-marinho `#26364E`.
- Não use `text-white`, `bg-black` ou cores soltas em componentes. Prefira `text-foreground`, `bg-background`, `bg-card` e `border-border`.
- Preserve o significado das cores nos dois temas: azul continua sendo ação, teal continua sendo sucesso e âmbar continua sendo atenção.

Exemplo com `next-themes`:

```tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

## 3. Tipografia

### 3.1 Famílias

- **Títulos e destaques:** Sora, peso semibold/bold.
- **Interface e parágrafos:** Inter, peso regular/medium/semibold.
- **Dados técnicos e valores compactos:** Inter ou fonte mono do projeto.

```tsx
import { Inter, Sora } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })
```

Configure no tema:

```css
@theme inline {
  --font-sans: var(--font-inter);
  --font-heading: var(--font-sora);
}
```

### 3.2 Escala tipográfica

| Estilo | Tamanho | Peso | Line-height | Aplicação |
|---|---:|---:|---:|---|
| Display | 40–48px | 700 | 1.1 | Hero e entrada de produto |
| H1 | 28–32px | 700 | 1.2 | Título principal da tela |
| H2 | 20–24px | 700 | 1.25 | Títulos de seção e cards grandes |
| H3 | 16–18px | 600 | 1.35 | Subtítulos e títulos de componentes |
| Body | 14–16px | 400 | 1.5 | Parágrafos e descrições |
| Label | 12–14px | 600 | 1.4 | Labels, filtros e navegação |
| Caption | 11–12px | 500 | 1.4 | Metadados e status |

Exemplo:

```tsx
<h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
  Visão Geral & Indicadores
</h1>
<p className="font-sans text-sm leading-6 text-muted-foreground">
  Acompanhe o desempenho editorial do seu workspace.
</p>
```

## 4. Espaçamento e layout

Use a escala de 4px do Tailwind:

| Token | Valor | Uso típico |
|---|---:|---|
| `space-1` | 4px | Distância entre ícone e texto |
| `space-2` | 8px | Gaps internos pequenos |
| `space-3` | 12px | Labels e controles compactos |
| `space-4` | 16px | Padding padrão de componentes |
| `space-6` | 24px | Separação entre blocos |
| `space-8` | 32px | Seções da página |
| `space-12` | 48px | Respiro de cabeçalho |
| `space-16` | 64px | Hero e grandes divisões |

Padrões recomendados:

- Padding de página: `p-4 md:p-6 lg:p-8`.
- Gap entre cards: `gap-4` ou `gap-6`.
- Conteúdo principal: `max-w-7xl mx-auto`.
- Sidebar desktop: 260–280px.
- Header de tela: 64–88px.
- Grid de métricas: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
- Evite `space-*`; prefira `gap-*` em flex e grid.

## 5. Raios, bordas e elevação

| Elemento | Classe sugerida |
|---|---|
| Input e botão | `rounded-md` — 6px |
| Badge | `rounded-full` |
| Card | `rounded-xl` — 12px |
| Modal ou painel grande | `rounded-2xl` — 16px |
| Borda padrão | `border border-border` |
| Card elevado | `shadow-sm` no claro; borda mais forte no escuro |

A interface deve priorizar bordas sutis em vez de sombras pesadas. No dark mode, use superfícies em camadas para criar hierarquia:

```tsx
<section className="rounded-xl border border-border bg-card p-6">
  {/* conteúdo */}
</section>
```

## 6. Botões

### 6.1 Variantes

| Variante | Aparência | Uso |
|---|---|---|
| Primary | Azul sólido | Ação principal: salvar, publicar, entrar |
| Secondary | Fundo slate/neutral | Ação alternativa ou de suporte |
| Outline | Transparente com borda | Ações secundárias de baixo peso |
| Ghost | Sem fundo/borda | Navegação, ícones e ações discretas |
| AI | Roxo ou gradiente azul-roxo | Reescrever, processar e gerar com IA |
| Destructive | Rosa/vermelho | Rejeitar, excluir ou sair |

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Salvar configurações
</Button>

<Button variant="outline">Ver prévia</Button>

<Button className="bg-secondary text-white hover:bg-secondary/90">
  Reescrever com IA
</Button>
```

### 6.2 Tamanhos

- `h-8 px-3 text-xs`: ações compactas e tabelas.
- `h-9 px-4 text-sm`: padrão da interface.
- `h-10 px-5 text-sm`: ação principal.
- `h-11 px-6 text-base`: CTA de login ou onboarding.
- Ícone isolado: `size-9` ou `size-10`, sempre com `aria-label`.

Regras:

- Sempre tenha estado `hover`, `focus-visible`, `disabled` e `loading`.
- Ícone à esquerda para ações; ícone à direita para navegação ou link.
- Não use mais de um botão Primary competindo no mesmo bloco.
- Altura mínima recomendada: 36px; áreas de toque mobile: 44px.

## 7. Formulários

```tsx
<div className="grid gap-2">
  <label htmlFor="email" className="text-sm font-semibold text-foreground">
    E-mail
  </label>
  <input
    id="email"
    type="email"
    placeholder="voce@empresa.com"
    className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-primary"
  />
  <p className="text-xs text-muted-foreground">
    Usaremos este endereço para acessar o workspace.
  </p>
</div>
```

- Use labels visíveis; placeholder não substitui label.
- Inputs padrão: `h-10`, `px-3`, `text-sm`, `rounded-md`.
- Erros devem aparecer abaixo do campo e também em `aria-describedby`.
- Estados: default, hover, focus, preenchido, erro, desabilitado.
- Senha deve oferecer controle de exibir/ocultar com botão acessível.

## 8. Navegação e sidebar

### Desktop

- Sidebar fixa de aproximadamente 260px.
- Logo no topo com nome do produto e subtítulo.
- Navegação agrupada por contexto: Dashboard, Notícias, Afiliados e Configurações.
- Item ativo com fundo roxo translúcido, borda sutil e texto claro.
- Ícones `lucide-react` em 16–18px, alinhados em uma coluna de largura fixa.

### Mobile

- Sidebar recolhida atrás de um menu; não comprima o conteúdo principal.
- Botão menu com `aria-expanded` e `aria-controls`.
- Ao abrir, use overlay e permita fechar com Escape.
- Mantenha o título da tela e a ação principal visíveis no topo.

## 9. Cards, métricas e estados

### Card de métrica

Estrutura recomendada:

1. Label em uppercase ou small caps.
2. Valor principal em 28–32px.
3. Complemento ou unidade em texto secundário.
4. Indicador de estado no canto superior direito.
5. Link contextual na parte inferior.

```tsx
<div className="rounded-xl border border-border bg-card p-5">
  <div className="flex items-start justify-between gap-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Artigos pendentes
    </p>
    <Clock3 className="size-5 text-warning" aria-hidden="true" />
  </div>
  <p className="mt-4 font-heading text-3xl font-bold text-foreground">11</p>
  <p className="mt-1 text-sm text-muted-foreground">aguardando revisão</p>
</div>
```

### Estados semânticos

| Estado | Cor | Exemplos |
|---|---|---|
| Sucesso | `#00C2AB` | Publicado, ativo, conectado |
| Atenção | `#F59E0B` | Pendente, limite próximo |
| Erro | `#F43F5E` | Rejeitado, falha, excluir |
| Informação | `#2563EB` | Em processamento, link, dica |
| IA | `#7C3AED` | Gerado por IA, ação inteligente |

Nunca comunique um estado apenas pela cor: combine texto, ícone e/ou badge.

## 10. Ícones

Use `lucide-react` para uma linguagem consistente:

```tsx
import { Bot, Check, FileText, LockKeyhole, Rss, Sparkles } from "lucide-react"

<Sparkles className="size-4 text-secondary" aria-hidden="true" />
```

Tamanhos:

- 14px: badges e metadados.
- 16px: botões e itens da sidebar.
- 20px: cabeçalhos de cards.
- 24px: empty states e ações principais.

Ícones decorativos devem ter `aria-hidden="true"`. Ícones que funcionam como botão precisam de nome acessível.

## 11. Motion com Framer Motion

Use animação para orientar, não para distrair:

```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.24, ease: "easeOut" }}
>
  {children}
</motion.div>
```

- Entrada de página: fade + deslocamento de até 8px.
- Stagger entre cards: 40–70ms.
- Hover: alterações sutis de cor, borda ou escala até `1.01`.
- Respeite `prefers-reduced-motion`.
- Não anime grandes áreas continuamente nem use efeitos decorativos pesados.

## 12. Login e Cadastro

As telas de autenticação devem ser mais focadas que o dashboard:

- Container central com largura de 400–480px.
- Logo e mensagem curta no topo.
- Card com `p-6 md:p-8`, `rounded-2xl` e borda suave.
- Campos com altura de 44px.
- CTA Primary ocupando toda a largura.
- Link para alternar entre Login e Cadastro.
- Feedback de erro próximo ao campo e mensagem geral no topo do formulário.
- Fundo pode usar uma superfície escura/azul-marinho com detalhes discretos da marca, sem excesso de gradientes.

## 13. Acessibilidade

- Contraste de texto normal mínimo: 4.5:1.
- Contraste de texto grande: 3:1.
- Todos os campos precisam de `label` associado.
- Todo botão deve ter texto ou `aria-label`.
- Use `focus-visible:ring-2 focus-visible:ring-primary`.
- Não remova o outline sem substituí-lo.
- Use landmarks: `header`, `nav`, `main`, `aside`, `footer`.
- Mensagens dinâmicas importantes podem usar `role="status"` ou `role="alert"`.
- Teste navegação completa por teclado e zoom de 200%.

## 14. Responsividade

Breakpoints Tailwind:

- Base: 0–639px — uma coluna, sidebar recolhida.
- `sm`: 640px — grids de dois itens quando houver espaço.
- `md`: 768px — padding maior e navegação mais ampla.
- `lg`: 1024px — sidebar e layout de duas colunas.
- `xl`: 1280px — cards de métricas em quatro colunas.

Nunca dependa apenas de largura fixa. Use `minmax`, `flex-wrap`, `max-w-*` e truncamento controlado para títulos longos.

## 15. Checklist de implementação

- [ ] A tela usa tokens semânticos, não cores soltas.
- [ ] O modo Light e Dark têm contraste e hierarquia equivalentes.
- [ ] Há apenas uma ação Primary dominante por seção.
- [ ] Todos os botões têm estados hover, focus, disabled e loading.
- [ ] Todos os campos têm labels, validação e mensagens acessíveis.
- [ ] A sidebar funciona em desktop e mobile.
- [ ] Ícones são consistentes e não usam emojis.
- [ ] Tipografia usa no máximo duas famílias: Sora e Inter.
- [ ] Espaçamentos seguem múltiplos da escala de 4px.
- [ ] A interface foi testada em viewport desktop e mobile.

## 16. Dependências do projeto

Este sistema aproveita as dependências já disponíveis:

- `next` e `react`: estrutura da aplicação.
- `tailwindcss` e `tailwind-merge`: estilos e composição de classes.
- `class-variance-authority`: variantes de componentes.
- `lucide-react`: ícones.
- `framer-motion`: transições e entradas controladas.
- `next-themes`: alternância Light/Dark.
- `next-auth`: autenticação.
- `prisma`, `@prisma/client` e `pg`: persistência e acesso ao banco.
- `rss-parser`: leitura de feeds RSS.
- `openai`: recursos de geração e processamento com IA.

> Este documento descreve a camada visual. Regras de autenticação, banco de dados, autorização e segurança devem continuar sendo implementadas no servidor e nunca depender apenas do cliente.

## 17. Exemplo de composição de página

```tsx
<main className="min-h-screen bg-background text-foreground">
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          Publicação de Notícias
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Revise, processe e publique seu conteúdo editorial.
        </p>
      </div>
      <Button className="bg-primary text-primary-foreground">
        Publicar agora
      </Button>
    </header>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
      {/* cards de métrica */}
    </section>
  </div>
</main>
```

Este padrão deve ser a base para novas páginas, preservando a identidade do GeraFeed e evitando variações visuais desnecessárias.
