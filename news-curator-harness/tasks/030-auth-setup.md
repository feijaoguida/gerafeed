# Task: 030-auth-setup

## Objetivo
Configurar a base de autenticação com NextAuth (Auth.js) no Next.js.

## Escopo
- Adicionar os pacotes `next-auth` (e `@auth/prisma-adapter`).
- Configurar a rota catch-all do NextAuth (`app/api/auth/[...nextauth]/route.ts`).
- Proteger rotas privadas usando Middleware do Next.js.
- Configurar autenticação provisória via Credentials ou GitHub/Google para facilitar testes.

## Definition of Done
- [ ] NextAuth configurado e rodando.
- [ ] Rotas `/dashboard` e `/settings` inacessíveis para usuários deslogados.
- [ ] Login e Logout funcionais.
