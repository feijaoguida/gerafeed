# Task 265: Integração End-to-End, Hardening e Evidências da Phase 32

## Status
DONE

## Contexto
Consolidar a entrega da Phase 32 através de testes integrados e validação rigorosa de segurança:
1. Simular o fluxo completo de ponta a ponta com usuário de teste.
2. Validar que o e-mail de recuperação é disparado com código OTP válido.
3. Testar a proteção contra enumeração de usuários (solicitar reset para e-mail inexistente não falha e retorna sucesso idêntico).
4. Testar a proteção anti-flood (tentativa de reenvio antes de 60s retorna HTTP 429).
5. Testar rejeição de código incorreto e expiração de código (> 15 minutos).
6. Testar rejeição de senha curta (< 6 caracteres).
7. Validar que o token é consumido (deletado) após redefinição com sucesso (impedindo reuso).
8. Validar autenticação no NextAuth com a nova senha redefinida (garantindo que a senha antiga é rejeitada e a nova aceita).
9. Garantir integridade de build do Next.js, TypeScript e linter.

## Critérios de Aceitação
- [x] Criar script de teste em `scripts/phase32/test-phase32-e2e.ts`.
- [x] Executar script cobrindo todos os cenários de segurança e validação:
  - Disparo de código para e-mail cadastrado.
  - Comportamento de anti-enumeração para e-mail não cadastrado.
  - Bloqueio por cooldown anti-flood (< 60s).
  - Tentativa com código inválido.
  - Tentativa com código expirado.
  - Validação de complexidade mínima da senha.
  - Redefinição com sucesso e deleção do token (single-use).
  - Tentativa de reuso do mesmo código (deve ser rejeitado).
  - Verificação de hash de senha (`verifyPassword`) e login simulado.
- [x] `npx tsc --noEmit` PASS (0 erros).
- [x] `npm run lint` PASS (0 erros).
- [x] `npm run build` PASS (95/95 rotas compilando com sucesso).
- [x] Registrar evidências no `news-curator-harness/PROGRESS.md`.
- [x] Atualizar status da Phase 32 e tasks no harness.

## Evidências
- `scripts/phase32/test-phase32-e2e.ts`: Todos os 9 cenários integrados aprovados com 100% de sucesso:
  1. Anti-User-Enumeration: resposta HTTP 200 uniforme e sem emissão de token para e-mail inexistente.
  2. Emissão de código OTP de 6 dígitos com isolamento de propósito (`password-reset:${email}`) para usuário cadastrado.
  3. Proteção anti-flood: retorno HTTP 429 e mensagem de espera para tentativa antes de 60s.
  4. Rejeição de código incorreto com HTTP 400.
  5. Rejeição de código expirado com HTTP 400.
  6. Rejeição de senha com menos de 6 caracteres com HTTP 400.
  7. Redefinição de senha bem-sucedida e deleção imediata do token (`single-use`).
  8. Replay attack: tentativa de reutilizar o mesmo código rejeitada com HTTP 400.
  9. Validação de senha: senha antiga invalidada e nova senha autenticada via `verifyPassword` com hash `bcryptjs`.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (95/95 rotas compiladas com sucesso, incluindo `/forgot-password`, `/api/auth/forgot-password/send-code` e `/api/auth/forgot-password/reset`).

## Definition of Done
- Todos os testes de segurança e fluxo passando com 100% de sucesso.
- `npx tsc --noEmit` PASS.
- `npm run lint` PASS.
- `npm run build` PASS.
- Evidências registradas em `PROGRESS.md`.
