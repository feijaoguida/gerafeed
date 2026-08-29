# Task 220. Migrate Public Screens (Landing, Login, Register)

## Objetivo
Migrar as páginas públicas da aplicação para utilizar os componentes oficiais do Design System GeraFeed, com total consistência em Modo Claro e Modo Escuro.

## Telas Afetadas
1. `src/app/(public)/layout.tsx`: Header público com logo GeraFeed e alternador de tema.
2. `src/app/(public)/page.tsx`: Landing page com hero, apresentação de proposta de valor e CTAs.
3. `src/app/(public)/login/page.tsx`: Formulário de login utilizando `Card`, `FormField`, `Input` e `Button` (variante gradiente).
4. `src/app/(public)/register/page.tsx`: Formulário de registro utilizando as novas primitivas de formulário.

## Critérios de Aceite
- [ ] Eliminar classes Tailwind ad-hoc e cores hardcoded.
- [ ] Testar paridade visual no Light Mode e no Dark Mode.
- [ ] TypeScript PASS e Lint PASS.
