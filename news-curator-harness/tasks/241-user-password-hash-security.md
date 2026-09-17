# Task 241. User Password Hash & Credentials Security

## Contexto
Durante o diagnóstico da arquitetura (ADR-087), constatou-se que o modelo `User` do Prisma ainda não armazena o hash das senhas dos usuários comuns criados via `/api/auth/register`, e a função `authorize` em `src/auth.ts` aceita o login se o e-mail existir na base, sem validar o hash da senha enviada.

Para assegurar proteção estrita contra acessos não autorizados e conformidade com as melhores práticas de segurança, adicionaremos a persistência de senhas criptografadas usando algoritmo de derivação de chave com SALT rounds (`bcryptjs`).

## Objetivo
1. Adicionar o campo opcional `passwordHash String?` ao modelo `User` em `prisma/schema.prisma`.
2. Executar migração do banco de dados para atualizar a tabela `User`.
3. Criar utilitário de segurança de senhas em `src/lib/security/password.ts` (`hashPassword` e `verifyPassword` usando `bcryptjs` com SALT rounds = 10).
4. Atualizar o provedor `Credentials` em `src/auth.ts` para verificar `passwordHash` usando `verifyPassword`.
5. Atualizar a rota `/api/auth/register` para gerar o `passwordHash` na criação do usuário.

## Antes de implementar
- Inspecione `prisma/schema.prisma` e o modelo `User`.
- Inspecione `src/auth.ts` e veja como o bloco `Credentials` realiza a validação de SuperAdmin, Admin legado e `regularUser`.
- Inspecione `src/app/api/auth/register/route.ts`.

## Implementação

### 1. Dependências
- Adicionar ao `package.json`: `bcryptjs` e `@types/bcryptjs`.
- Instalar via npm.

### 2. Schema Prisma (`prisma/schema.prisma`)
Adicionar campo `passwordHash`:
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  image         String?
  isSuperAdmin  Boolean   @default(false)
  accounts      Account[]
  sessions      Session[]
  workspaces    WorkspaceUser[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```
Executar:
`npx prisma db push` ou gerar migração.
`npx prisma generate`.

### 3. Utilitário de Senha (`src/lib/security/password.ts`)
```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || plainText.length < 6) {
    throw new Error("A senha deve ter no mínimo 6 caracteres.");
  }
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}
```

### 4. Atualizar `src/auth.ts`
No método `authorize`:
- Para usuários comuns encontrados no banco (`regularUser`):
  - Se `regularUser.passwordHash` existir:
    - Executar `const isValid = await verifyPassword(password, regularUser.passwordHash);`
    - Se for falso, retornar `null` (recusando o login).
  - Se for um usuário antigo sem `passwordHash` registrado, exigir migração ou tratar de forma segura.
  - Retornar o payload de sessão somente com credenciais confirmadas.

### 5. Atualizar `src/app/api/auth/register/route.ts`
- Receber `password` do payload.
- Validar tamanho mínimo (6 caracteres).
- Gerar `const passwordHash = await hashPassword(password);`.
- Salvar `passwordHash` na criação do `prisma.user.create`.

## Definition of Done
- [ ] Campo `passwordHash` adicionado ao schema do Prisma e banco atualizado.
- [ ] Utilitário `src/lib/security/password.ts` implementado com SALT rounds = 10.
- [ ] `src/app/api/auth/register/route.ts` salvando o hash de senha com sucesso.
- [ ] `src/auth.ts` rejeitando senhas incorretas e aceitando apenas a senha válida criptografada.
- [ ] Credenciais dos admins e superadmin preservadas sem quebras.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Evidência registrada em `PROGRESS.md`.
