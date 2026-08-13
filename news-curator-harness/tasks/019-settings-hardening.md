# Task 019. Settings Hardening

## Status
DONE

## Objetivo
Auditar segurança das configurações.

## Escopo
- responses API
- logs
- server/client boundaries
- secrets
- criptografia
- configuração ausente
- compatibilidade

## Definition of Done
- [x] Nenhum secret em response.
- [x] Nenhum secret em logs.
- [x] Nenhum secret hardcoded.
- [x] Password criptografada.
- [x] API Key criptografada.
- [x] ENCRYPTION_KEY server-only.
- [x] IV/nonce não reutilizado.
- [x] Decrypt seguro.
- [x] Configuração inexistente tratada.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.
- [x] Fluxo completo PASS.

## Evidence
- Auditoria de segurança em APIs (`GET /api/wordpress/config`, `GET /api/ai/config`, `POST /api/wordpress/test`, `POST /api/ai/test`): Nenhuma Application Password ou API Key é exposta ao client browser.
- Auditoria de logs (`console.log` / `console.error` em `src/`): Nenhuma credencial ou chave é gravada nos logs do servidor.
- `ENCRYPTION_KEY` restrita ao ambiente Node.js server-side (sem vazamento via prefixo `NEXT_PUBLIC_`).
- Criptografia AES-256-GCM com IVs únicos de 12 bytes por chamada (`crypto.randomBytes(12)`) e validação de autenticidade (Auth Tag de 16 bytes).
- Script de teste de segurança [`scripts/test-settings-hardening.ts`](file:///home/feijao/projetos/news-curator/scripts/test-settings-hardening.ts) executado com sucesso validando sigilo de respostas, autenticidade da criptografia e comportamento gracioso em ausência de configuração.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router gerando 17 rotas em 345ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
