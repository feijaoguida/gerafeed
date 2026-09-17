# Task 243. Home Pricing Plan Selection & Purchase Intent

## Contexto
Na Home Page (`/`), a seção de preços apresenta os planos dinâmicos através do componente `PricingCarousel` (`src/components/landing/pricing-carousel.tsx`). Atualmente, os botões de contratação redirecionam o visitante para a rota estática `/register` sem nenhum parâmetro de contexto. Com isso, a intenção de contratação do usuário é perdida e ele é cadastrado involuntariamente no plano gratuito básico (ADR-088).

## Objetivo
1. Atualizar o componente `PricingCarousel` para que o botão de cada plano direcione para `/register?plan={slug}&cycle=monthly` (ou ciclo anual, se selecionável).
2. Preservar o rastreamento analítico sem PII em `trackEvent("cta_click", ...)`.
3. Criar utilitário no cliente para capturar e persistir a intenção de compra (`plan` e `cycle`) em `sessionStorage` para resiliência contra recarregamentos de página acidentais.
4. Exibir badge ou aviso sutil na página de cadastro informando qual plano está sendo contratado e seu valor mensal.

## Antes de implementar
- Inspecione `src/components/landing/pricing-carousel.tsx`.
- Inspecione `src/lib/public-plans.ts` e veja os campos de `PublicPlan` (`slug`, `name`, `monthlyPrice`, `highlight`).
- Inspecione `src/app/(public)/register/register-view.tsx` para planejar onde a indicação do plano selecionado será renderizada.

## Implementação

### 1. Atualizar `PricingCarousel` (`src/components/landing/pricing-carousel.tsx`)
- No loop `plans.map(plan => ...)`:
  - Formatar o link do CTA:
    ```tsx
    const registerHref = isFree
      ? "/register?plan=free"
      : `/register?plan=${encodeURIComponent(plan.slug)}&cycle=monthly`;
    ```
  - Atualizar o elemento `<Link href={registerHref} ...>` para usar esse destino.
  - No `trackEvent`, enviar `plan_slug: plan.slug` e `plan_price: plan.monthlyPrice`.

### 2. Utilitário de Intenção de Plano (`src/lib/plan-intent.ts`)
- Criar helpers:
  ```ts
  export interface PlanIntent {
    slug: string;
    cycle: "MONTHLY" | "YEARLY";
  }

  export function savePlanIntent(intent: PlanIntent): void;
  export function getStoredPlanIntent(): PlanIntent | null;
  export function clearPlanIntent(): void;
  ```
- Usar `sessionStorage` com verificação de execução no browser (`typeof window !== "undefined"`).

### 3. Integração na Tela de Registro (`src/app/(public)/register/register-view.tsx`)
- Ler parâmetros da URL via `useSearchParams()`:
  - `const planParam = searchParams.get("plan");`
  - `const cycleParam = searchParams.get("cycle");`
- Se houver parâmetro na URL, salvar no storage. Se não houver na URL mas houver no storage, recuperar do storage.
- Se o plano selecionado for pago (ex: `plan !== "free"`), exibir no cabeçalho do formulário de cadastro um badge informativo:
  - *"Plano selecionado: [Nome do Plano] — R$ [Valor]/mês"* com opção de alterar ou continuar no gratuito.

## Definition of Done
- [ ] Cada card de plano no carrossel da Home navega para `/register?plan=slug&cycle=...`.
- [ ] O plano gratuito direciona para `/register?plan=free` ou sem parâmetros.
- [ ] A página `/register` identifica o plano e exibe o resumo visual para o visitante.
- [ ] Recarregar a página `/register` não perde a seleção do plano graças ao storage de apoio.
- [ ] Nenhum dado sensível é propagado em URL ou storage.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Evidência registrada em `PROGRESS.md`.
