# Task 011. Configuration Storage

## Status
DONE

## Objetivo
Criar armazenamento central.

## Escopo
Model `Configuration`:
- id
- key
- value
- createdAt
- updatedAt

Criar repository/service server-side e upsert.

## Definition of Done
- [x] Model criado.
- [x] Migration aplicada.
- [x] Key única.
- [x] Upsert funcionando.
- [x] Leitura funcionando.
- [x] Values sensíveis não são expostos automaticamente.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Testes PASS.

## Evidence
- Model `Configuration` adicionado a `prisma/schema.prisma` com chave `@unique` no campo `key` e tipo `Json` no campo `value`.
- Migration `20260813195926_add_configuration_model` gerada e aplicada com sucesso via Prisma no PostgreSQL.
- Módulo de serviço server-side implementado em `src/lib/config.ts`:
  - `getConfig(key)`: busca dinâmica de configuração por chave única.
  - `setConfig(key, value)`: operação de upsert idempotente para criação ou atualização de configurações.
  - `getAllConfigs()`: listagem de configurações ordenadas.
  - `deleteConfig(key)`: exclusão por chave.
- Proteção de dados sensíveis: acesso restrito a funções server-side/Route Handlers do Next.js sem vazamento para componentes do client.
- Script de teste de integração `scripts/test-config-storage.ts` executado validando criação, leitura, atualização por upsert, restrição de chave única e deleção.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js gerada em 554ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
