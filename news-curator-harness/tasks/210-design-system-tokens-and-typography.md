# Task 210. Design System Tokens and Typography

## Objetivo
Configurar a base de tokens CSS semânticos para Modo Claro e Modo Escuro no Tailwind CSS 4, carregar as fontes oficiais Google (Sora e Inter) e disponibilizar o utilitário central `cn` e os tokens de tipografia.

## Requisitos
1. **Tokens CSS no `src/app/globals.css`**:
   - `:root` com background claro (`#F8FAFC`), superfícies (`#FFFFFF`), texto ink (`#0F172A`), bordas suaves e tokens de marca.
   - `.dark` com background navy escuro (`#07111F`), superfícies (`#0D1B2D`), superfícies elevadas (`#112239`), bordas discretas (`rgba(148,163,184,0.12)`) e texto claro (`#F8FAFC`).
   - Cores de marca e gradiente: `--primary` (`#2563EB`), `--primary-purple` (`#7C3AED`), `--accent` (`#00C2A8`), `--gradient-brand`.
   - Cores funcionais: `--success` (`#10B981`), `--warning` (`#F59E0B`), `--danger` (`#EF4444`).
   - Mapeamento no `@theme inline` para compatibilidade total com classes Tailwind.
2. **Fontes Oficiais no `src/app/layout.tsx`**:
   - `Sora` (pesos 500, 600, 700) com variável `--font-heading`.
   - `Inter` (pesos 400, 500, 600, 700) com variável `--font-sans`.
3. **Utilitário `cn` em `src/lib/utils.ts`**:
   - Validar suporte completo a `clsx` e `tailwind-merge`.
4. **Módulo de Tipografia**:
   - Criar `src/components/design-system/typography.tsx` com componentes e helpers tipados (`Display`, `Heading1`, `Heading2`, `Heading3`, `Heading4`, `Text`, `Caption`, `Overline`).

## Definition of Done
- [ ] Tokens `:root` e `.dark` configurados e documentados.
- [ ] Sora e Inter carregadas sem quebrar layout existente.
- [ ] `typography.tsx` criado e tipado.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
