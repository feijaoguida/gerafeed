# Task 012. Encryption Helper

## Status
DONE

## Objetivo
Criar helper central de criptografia.

## Escopo
- `encrypt(value)`.
- `decrypt(value)`.
- AES-256-GCM ou equivalente.
- `ENCRYPTION_KEY`.
- SALT/contexto versionado.
- IV/nonce novo por valor.
- Formato versionado.
- Testes unitários.

## Regras
SALT não é segunda chave secreta. Não usar SALT como substituto da ENCRYPTION_KEY.

## Definition of Done
- [x] Helper central.
- [x] Round-trip funciona.
- [x] IV/nonce diferente em cada criptografia.
- [x] Ciphertext alterado falha.
- [x] Key não hardcoded.
- [x] SALT não substitui a key.
- [x] Secrets não aparecem em logs.
- [x] Testes PASS.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- Módulo central de criptografia criado em `src/lib/crypto.ts` usando o algoritmo AES-256-GCM.
- Formato de payload versionado: `v1:iv_hex:ciphertext_hex:auth_tag_hex`.
- Chave derivada de 32 bytes via `scryptSync` utilizando a variável de ambiente `ENCRYPTION_KEY` e salt de contexto (`news-curator-v1-salt`).
- Nonce/IV aleatório de 12 bytes gerado via `crypto.randomBytes(12)` individualmente em cada criptografia.
- Verificação de integridade via GCM Auth Tag de 16 bytes: adulterações rejeitadas com exceção.
- `ENCRYPTION_KEY` adicionada ao `.env.example` e `.env`.
- Script de testes unitários `scripts/test-crypto.ts` executado validando:
  - Round-trip perfeito de texto criptografado/descriptografado.
  - Variação de IV/nonce para mesmo texto claro.
  - Rejeição e erro de descriptografia em payload alterado.
  - Rejeição de chave incorreta.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação App Router gerada em 402ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
