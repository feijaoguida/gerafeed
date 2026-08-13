# Task 013. WordPress Configuration

## Status
DONE

## Objetivo
Migrar WordPress para configuração visual.

## Escopo
- URL
- Username
- Application Password
- configuração `wordpressConnection`
- criptografia da password
- teste de conexão
- sincronização de categorias

## Definition of Done
- [x] Configuração pela UI.
- [x] Salva no banco.
- [x] Password não fica plaintext.
- [x] Password nunca retorna ao browser.
- [x] Teste usa decrypt somente server-side.
- [x] Categorias sincronizam.
- [x] Compatibilidade com configuração antiga quando necessário.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.

## Evidence
- Tela de configuração visual implementada em `src/app/settings/wordpress/page.tsx`.
- Endpoints de API `GET` e `POST` criados em `src/app/api/wordpress/config/route.ts`:
  - `GET /api/wordpress/config`: Retorna URL, Username e flags de status (`isConfigured`, `hasApplicationPassword`), sem expor senhas em texto plano ou cifradas.
  - `POST /api/wordpress/config`: Valida e salva a configuração sob a chave `wordpressConnection` no banco de dados, criptografando a `applicationPassword` via AES-256-GCM (`v1:iv:ciphertext:tag`).
- Resolução e descriptografia server-side em `src/lib/wordpress.ts`:
  - `getWordPressConfig()` lê a configuração da tabela `Configuration`, descriptografando a senha exclusivamente em memória durante requisições autorizadas.
  - Fallback automático para variáveis de ambiente (`.env`) preservando compatibilidade com instalações existentes.
- Script de testes de integração `scripts/test-wordpress-config.ts` executado com servidor WordPress mockado:
  - Criptografia verificada (senha não armazenada em plaintext).
  - Descriptografia server-side verificada.
  - Teste de conexão autenticada e sincronização de categorias validados.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 1053ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
