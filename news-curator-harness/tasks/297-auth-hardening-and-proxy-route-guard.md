# Task 297: Endurecimento de Autenticação (`src/auth.ts`), Proxy Guard (`src/proxy.ts`) e Proteção do Layout Autenticado

## Status
TODO

## Contexto
A auditoria de segurança pré-produção identificou duas falhas críticas nos itens **4 (Autenticação robusta)** e **5 (Autorização no servidor)**:
1. Em `src/auth.ts` (linhas 133–148), quando um usuário existe no banco com `passwordHash` nulo ou vazio (`passwordHash String?`), a checagem `if (regularUser.passwordHash)` é ignorada e o usuário é autenticado independentemente da senha informada (Bypass de Autenticação — CWE-287). Além disso, senhas de SuperAdmin e Admin em variáveis de ambiente são comparadas com `===`, ficando sujeitas a *timing attacks*.
2. Em `src/proxy.ts`, a exportação passiva `export { auth as proxy }` sem callback `authorized` ou verificação explícita de `req.auth` no NextAuth v5 permite que requisições não autenticadas atravessem o proxy até as rotas de API e páginas internas. E em `src/app/(app)/layout.tsx`, não há redirecionamento para `/login` quando `session?.user` está ausente.

## Escopo de Implementação

### 1. Comparação Constant-Time e Bloqueio de Senha Nula (`src/auth.ts`)
1. Criar helper seguro `constantTimeCompare(a: string, b: string): boolean` utilizando `crypto.createHash("sha256")` e `crypto.timingSafeEqual` para comparar segredos sem vazar tamanho nem tempo de execução.
2. No provider `Credentials` (`authorize`):
   - Higienizar `email = credentials.email.trim().toLowerCase()`.
   - Na checagem de `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`, usar `constantTimeCompare`.
   - Na checagem legada de `ADMIN_EMAIL` / `ADMIN_PASSWORD`, restringir sua ativação apenas quando `process.env.NODE_ENV !== "production"` e usar `constantTimeCompare`.
   - Na checagem de `regularUser`:
     - Exigir obrigatoriamente que `regularUser.passwordHash` exista e não seja vazio (`if (!regularUser.passwordHash) return null;`).
     - Validar `const isValid = await verifyPassword(password, regularUser.passwordHash);` e retornar `null` se `!isValid`.

### 2. Bloqueio de Requisições Não Autenticadas no Proxy (`src/proxy.ts`)
1. Implementar handler explícito no `src/proxy.ts` (ou callback `authorized` integrado ao `auth`):
   - Verificar se a rota é pública (`/`, `/login`, `/register`, `/forgot-password`, `/como-funciona`, `/automacao-wordpress`, `/rss-para-wordpress`, `/curadoria-de-conteudo-com-ia`, `/para-agencias`, `/para-portais-de-noticias`, `/blog`, `/blog/*`, `/api/auth/*`, `/api/billing/coupons/validate`, `/api/webhooks/*`, `/sitemap.xml`, `/robots.txt` e assets estáticos).
   - Para qualquer rota privada/protegida sem `session?.user?.id`:
     - Se `pathname.startsWith("/api/")`: retornar `NextResponse.json({ error: "Não autenticado. Faça login para continuar." }, { status: 401 })`.
     - Se for rota de interface (`/(app)/*`, `/backoffice/*`): redirecionar para `/login?callbackUrl=${encodeURIComponent(pathname)}`.

### 3. Guarda Server-Side no Layout da Aplicação (`src/app/(app)/layout.tsx`)
1. Em `src/app/(app)/layout.tsx`, verificar `if (!session?.user?.id) { redirect("/login"); }` imediatamente após `const session = await auth();`, garantindo defesa em profundidade caso o layout seja renderizado sem sessão.

## Critérios de Aceitação (Definition of Done)
- [ ] `src/auth.ts` nega login (`return null`) para qualquer usuário com `passwordHash` nulo ou vazio.
- [ ] `src/auth.ts` utiliza `crypto.timingSafeEqual` para comparação de credenciais administrativas de ambiente.
- [ ] `src/proxy.ts` retorna `HTTP 401` para chamadas não autenticadas em rotas `/api/*` protegidas e redireciona para `/login` em páginas privadas, preservando intactas todas as landing pages públicas, blog, sitemap, robots, `/api/auth/*`, `/api/billing/coupons/validate` e `/api/webhooks/*`.
- [ ] `src/app/(app)/layout.tsx` redireciona para `/login` caso `session?.user?.id` não esteja presente.
- [ ] Teste automatizado `scripts/phase40/test-task297-auth-and-proxy.ts` validando todos os cenários.
- [ ] `npx tsc --noEmit`: PASS (0 erros).
- [ ] `npm run lint`: PASS (0 erros).

