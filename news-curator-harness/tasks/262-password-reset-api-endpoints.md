# Task 262: Endpoints de API para Solicitação e Redefinição de Senha

## Status
DONE

## Contexto
Implementar as duas rotas backend que orquestram a recuperação de senha:
1. `POST /api/auth/forgot-password/send-code`: valida o e-mail, gera o código OTP isolado e dispara o e-mail, mantendo resposta uniforme (anti-enumeração) e proteção anti-flood.
2. `POST /api/auth/forgot-password/reset`: valida o código, garante prazo e propósito, atualiza o hash da nova senha com `bcryptjs` e invalida o token usado.

## Critérios de Aceitação
- [x] Criar rota `src/app/api/auth/forgot-password/send-code/route.ts`:
  - Validação estrita de formato de e-mail (regex).
  - Normalização para lowercase e trim (`cleanEmail`).
  - Proteção Anti-Flood: verificar em `prisma.verificationToken` se já existe token recente com `identifier: "password-reset:" + cleanEmail`. Se o tempo desde a emissão for menor que 60s, retornar HTTP 429 com `{ error: "Por favor, aguarde Xs antes de solicitar um novo código." }`.
  - Anti-User-Enumeration: verificar se `prisma.user.findUnique({ where: { email: cleanEmail } })` existe.
    - Se existir: limpar tokens de reset anteriores do e-mail, gerar código de 6 dígitos via `generateOtpCode()`, salvar em `prisma.verificationToken` com `identifier: "password-reset:" + cleanEmail` e expiração em 15 minutos, renderizar template `renderPasswordResetEmail` e disparar via `sendEmail`.
    - Se NÃO existir: não disparar e-mail nem registrar erro para o cliente.
    - Em ambos os casos, retornar HTTP 200 com mensagem uniforme: `"Se este e-mail estiver cadastrado, você receberá um código de confirmação em instantes."`.
- [x] Criar rota `src/app/api/auth/forgot-password/reset/route.ts`:
  - Receber `{ email, code, password }`.
  - Validar campos obrigatórios e formato (senha mínima de 6 caracteres, código de 6 dígitos).
  - Buscar `prisma.verificationToken` com `identifier: "password-reset:" + cleanEmail` e `token: cleanCode`.
  - Se não encontrado ou `expires < new Date()`, retornar HTTP 400 com erro amigável.
  - Buscar o usuário em `prisma.user`. Se inexistente, retornar erro.
  - Gerar novo hash de senha com `hashPassword(password)`.
  - Atualizar `prisma.user.update({ where: { id: user.id }, data: { passwordHash } })`.
  - Deletar imediatamente todos os tokens com `identifier: "password-reset:" + cleanEmail` para garantir uso único.
  - Retornar HTTP 200 com `{ success: true, message: "Senha redefinida com sucesso. Faça login com a nova senha." }`.
- [x] Captura de erros com log sem vazar dados sensíveis.
- [x] Validação estrita de tipos com TypeScript (`npx tsc --noEmit`).

## Evidências
- `src/app/api/auth/forgot-password/send-code/route.ts` criado com proteção anti-flood (cooldown 60s), anti-enumeração de usuários (HTTP 200 uniforme) e disparo de e-mail integrado.
- `src/app/api/auth/forgot-password/reset/route.ts` criado com validação de token `password-reset:${email}`, expiração em 15min, hash `bcryptjs` (SALT 10) e consumo imediato do token (`single-use`).
- Teste integrado executado com validação dos seguintes cenários:
  1. Anti-enumeração: retorno 200 com mensagem genérica para e-mail não existente.
  2. Envio de código para usuário existente e persistência de token com prefixo isolado.
  3. Bloqueio por anti-flood com HTTP 429 para reenvio em menos de 60 segundos.
  4. Rejeição de código incorreto com HTTP 400.
  5. Redefinição bem-sucedida da senha com HTTP 200.
  6. Invalidação (deleção) do token do banco garantindo uso único.
  7. Nova senha conferida e aprovada via `verifyPassword`.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- As duas rotas criadas e funcionais.
- Token gravado com identificador isolado `password-reset:${email}`.
- Rejeição de tokens expirados e incorretos.
- `npx tsc --noEmit` PASS.
- `npm run lint` PASS.
