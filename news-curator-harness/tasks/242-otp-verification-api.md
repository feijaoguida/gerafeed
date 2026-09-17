# Task 242. OTP Verification API & Email Template

## Contexto
Para impedir cadastros fictícios (ex: `teste@teste.com.br`) e assegurar que o e-mail informado pertence legitimamente ao usuário (ADR-086), criaremos o fluxo de validação via código numérico de 6 dígitos (OTP).

O código será gerado no servidor, enviado via `src/lib/mail/` e armazenado na tabela `VerificationToken` do Prisma com validade estrita de 15 minutos.

## Objetivo
1. Criar o template HTML do e-mail com a identidade visual oficial do GeraFeed (logo, cores da marca, código legível e aviso de segurança).
2. Criar endpoint `POST /api/auth/send-verification-code`:
   - Valida sintaxe e descarta domínios inválidos/temporários básicos.
   - Verifica se o e-mail já está cadastrado no sistema.
   - Aplica rate limit básico (mínimo de 60 segundos entre reenvios para o mesmo e-mail).
   - Gera código de 6 dígitos criptograficamente seguro.
   - Salva em `VerificationToken`.
   - Dispara o e-mail via `sendEmail()`.
3. Criar endpoint `POST /api/auth/verify-code`:
   - Recebe `email` e `code`.
   - Valida existência do token e se não expirou (`expires > new Date()`).
   - Retorna `{ valid: true }` ou mensagem amigável de erro.

## Antes de implementar
- Inspecione a tabela `VerificationToken` em `prisma/schema.prisma`.
  ```prisma
  model VerificationToken {
    identifier String
    token      String
    expires    DateTime

    @@id([identifier, token])
  }
  ```
- Inspecione a biblioteca de e-mail construída na Task 240 (`src/lib/mail/`).
- Inspecione o design system (`src/components/brand/logo.tsx`, cores do GeraFeed `#2563EB`, `#7C3AED`, `#00C2A8`).

## Implementação

### 1. Template de E-mail (`src/lib/mail/templates/verification-code.ts`)
- Criar função geradora de HTML responsivo compatível com os principais clientes de e-mail (Gmail, Outlook, Apple Mail):
  - Cabeçalho com nome/marca GeraFeed.
  - Título claro: "Seu código de confirmação no GeraFeed".
  - Bloco em destaque com o código de 6 dígitos em fonte monoespaçada, tamanho grande e fundo sutil.
  - Aviso: "Este código expira em 15 minutos. Se você não solicitou este cadastro, ignore esta mensagem."
  - Versão texto plano (`text/plain`) incluída no payload de envio.

### 2. Geração Segura do Código OTP (`src/lib/security/otp.ts`)
```ts
import crypto from "crypto";

export function generateOtpCode(): string {
  // Gera código de 6 dígitos de 100000 a 999999
  return crypto.randomInt(100000, 1000000).toString();
}
```

### 3. Rota `POST /api/auth/send-verification-code` (`src/app/api/auth/send-verification-code/route.ts`)
- Payload esperado: `{ email: string }`.
- Validações:
  - Formato válido de e-mail.
  - Verificar se já existe conta ativa:
    ```ts
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este e-mail já possui cadastro. Faça login." }, { status: 409 });
    }
    ```
  - Anti-flood (verificar se há token recente criado nos últimos 60 segundos):
    Se houver token criado há menos de 1 minuto, retornar erro 429 solicitando aguardar.
- Salvar no Prisma:
  - Deletar códigos anteriores daquele identifier (`prisma.verificationToken.deleteMany({ where: { identifier: email } })`).
  - Gerar código e salvar com `expires: new Date(Date.now() + 15 * 60 * 1000)`.
- Envio:
  - Chamar `sendEmail({ to: email, subject: "...", html: "..." })`.
  - Retornar `{ success: true, message: "Código enviado para o seu e-mail." }`.

### 4. Rota `POST /api/auth/verify-code` (`src/app/api/auth/verify-code/route.ts`)
- Payload esperado: `{ email: string, code: string }`.
- Buscar no banco:
  ```ts
  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email.trim().toLowerCase(),
        token: code.trim(),
      },
    },
  });
  ```
- Se não encontrar: erro "Código inválido ou não encontrado." (400).
- Se `record.expires < new Date()`: erro "Código expirado. Solicite um novo código." (400).
- Se válido:
  - Retornar `{ success: true, valid: true }`.

## Definition of Done
- [ ] Template visual de e-mail criado e testado.
- [ ] Rota `send-verification-code` gerando códigos de 6 dígitos com expiração de 15 minutos.
- [ ] Proteção contra e-mails já cadastrados e controle anti-flood de 60 segundos.
- [ ] Rota `verify-code` validando tokens válidos e rejeitando códigos incorretos ou expirados.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Evidência registrada em `PROGRESS.md`.
