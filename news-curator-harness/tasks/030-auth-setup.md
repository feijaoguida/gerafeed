# Task: 030-auth-setup

## Status: DONE

## Objetivo
Configurar a base de autenticação com NextAuth (Auth.js) no Next.js.

## Escopo
- Adicionar os pacotes `next-auth` (e `@auth/prisma-adapter`).
- Configurar a rota catch-all do NextAuth (`app/api/auth/[...nextauth]/route.ts`).
- Proteger rotas privadas usando Proxy do Next.js 16.
- Configurar autenticação provisória via Credentials para facilitar testes.

## Definition of Done
- [x] NextAuth configurado e rodando.
- [x] Rotas `/dashboard` e `/settings` inacessíveis para usuários deslogados.
- [x] Login e Logout funcionais.

## Adjustments Applied
- Next.js 16: `proxy.ts` no lugar de `middleware.ts` (Node.js runtime nativo).
- JWT strategy (sem PrismaAdapter — aguarda Task 031).
- Rota `/` pública (landing page); `/login` pública; `/dashboard`, `/settings`, `/articles` protegidas.
- Sidebar movida do root layout para `(app)/layout.tsx`.

## Evidence
- `next-auth@^5.0.0-beta.32` e `@auth/prisma-adapter@^2.11.3` instalados.
- `src/auth.ts` criado: Auth.js v5 com Credentials provider e JWT strategy.
- `src/app/api/auth/[...nextauth]/route.ts` criado: catch-all handler.
- `src/proxy.ts` criado: protege `/dashboard`, `/settings`, `/articles` (Next.js 16).
- Estrutura de rotas reorganizada: `(app)/` (autenticado) e `(public)/` (público).
- `src/app/(app)/dashboard/page.tsx`: dashboard em nova rota `/dashboard`.
- `src/app/(public)/page.tsx`: landing page pública em `/`.
- `src/app/(public)/login/page.tsx`: página de login em `/login`.
- `src/app/(app)/layout.tsx`: layout autenticado com Sidebar.
- `src/components/sidebar.tsx`: links atualizados para `/dashboard` + botão Logout.
- `.env` e `.env.example` atualizados com `AUTH_SECRET`, `AUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Build output confirma: `ƒ Proxy (Middleware)` ativo, rotas `/dashboard`, `/login`, `/settings/*` corretas.
- `npx tsc --noEmit`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS

