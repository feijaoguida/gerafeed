# Task 211. Design System Core Primitives (Button, Badge, IconButton, Separator, Skeleton)

## Objetivo
Implementar os componentes primitivos fundamentais usando `class-variance-authority` (CVA) e ícones de `lucide-react`, com suporte nativo a Light/Dark Mode e acessibilidade `focus-visible`.

## Requisitos
1. **`src/components/ui/button.tsx`**:
   - Variantes CVA: `default` (azul primário), `gradient` (Blue → Purple oficial GeraFeed), `secondary`, `outline`, `ghost`, `destructive`, `link`.
   - Tamanhos: `sm`, `md`, `lg`, `icon`.
   - Estados: `hover`, `focus-visible:ring-2`, `disabled`, `loading` (spinner embutido sem quebrar layout).
   - Suporte a `leadingIcon` e `trailingIcon`.
2. **`src/components/ui/badge.tsx`**:
   - Variantes CVA: `default`, `secondary`, `success`, `warning`, `danger`, `info`, `purple`, `outline`.
   - Mapeamento direto de status: `ACTIVE`, `PENDING`, `PUBLISHED`, `REJECTED`, `FAILED`, `PROCESSING`, `CONNECTED`, `DISCONNECTED`, `PAST_DUE`.
3. **`src/components/ui/icon-button.tsx`**:
   - Botão para ícones com atributo `aria-label` obrigatório por tipagem.
4. **`src/components/ui/separator.tsx`**:
   - Linha divisória horizontal e vertical utilizando `--border`.
5. **`src/components/ui/skeleton.tsx`**:
   - Placeholder animado de pulso com contraste adequado para Light e Dark mode.

## Definition of Done
- [ ] Primitivas criadas em `src/components/ui/`.
- [ ] CVA implementado com variantes tipadas.
- [ ] Suporte a ícones Lucide e estados de loading.
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS.
