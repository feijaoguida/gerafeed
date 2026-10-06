# Task 261: Template de E-mail de Recuperação de Senha

## Status
DONE

## Contexto
O usuário que esquece a senha precisa receber um e-mail transacional claro, com o design institucional do GeraFeed, contendo o código OTP de 6 dígitos para redefinir o acesso à conta.
Já existe o template de código de cadastro em `src/lib/mail/templates/verification-code.ts`. Devemos criar um template dedicado para recuperação de senha em `src/lib/mail/templates/password-reset.ts`.

## Critérios de Aceitação
- [x] Criar arquivo `src/lib/mail/templates/password-reset.ts`.
- [x] Definir interface `PasswordResetEmailProps` recebendo `code: string` e `expiresInMinutes?: number` (default 15).
- [x] Exportar função `renderPasswordResetEmail(props: PasswordResetEmailProps)` que retorna `{ html: string, text: string }`.
- [x] O HTML deve seguir rigorosamente a identidade visual GeraFeed (Dark Mode, tipografia moderna, logotipo com degradê, caixa destacada para o OTP de 6 dígitos em fonte monospace/monoespaçada).
- [x] Incluir texto explicativo: "Recebemos uma solicitação para redefinir a senha da sua conta GeraFeed. Use o código de segurança abaixo para prosseguir:".
- [x] Incluir aviso de segurança destacado: "Este código expira em 15 minutos. Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá inalterada."
- [x] Incluir versão textual plana (`text`) equivalente para compatibilidade com clientes de e-mail sem suporte a HTML.
- [x] Validar compilação TypeScript com `npx tsc --noEmit`.

## Evidências
- `src/lib/mail/templates/password-reset.ts` criado com export de `renderPasswordResetEmail`.
- Renderização testada dinamicamente: código OTP injetado com sucesso no HTML estruturado (caixa destacada, dark mode, logo GeraFeed) e na versão em texto puro.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- Arquivo `src/lib/mail/templates/password-reset.ts` criado e exportado.
- Saídas `html` e `text` geradas corretamente com dados dinâmicos.
- `npx tsc --noEmit` PASS.
- `npm run lint` PASS.
