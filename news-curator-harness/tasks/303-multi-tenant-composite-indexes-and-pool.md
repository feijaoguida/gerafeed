# Task 303 — Índices Compostos Multi-Tenant e Otimização do Pool de Conexões (Pilar 1)

## Objetivo
Implementar os índices compostos multi-tenant ausentes em `prisma/schema.prisma` iniciando pela chave de isolamento do tenant (`workspaceId` / `productId` / `subscriptionId`) combinada com as colunas de filtragem e ordenação mais frequentes, e ajustar o `idleTimeoutMillis` do pool de conexões PostgreSQL em `src/lib/prisma.ts` para evitar reconexões TCP/TLS excessivas entre requisições consecutivas.

## Escopo Técnico

### 1. Índices Compostos em `prisma/schema.prisma`
Adicionar os seguintes índices compostos nos modelos:
- **`Source`**:
  - `@@index([workspaceId, active])`
  - `@@index([workspaceId, createdAt(sort: Desc)])`
- **`Article`**:
  - `@@index([workspaceId, status, createdAt(sort: Desc)])`
  - `@@index([workspaceId, processedAt])`
  - `@@index([workspaceId, sourceId, status])`
  - `@@index([workspaceId, wordpressSiteId, status])`
  - `@@index([workspaceId, originalPublishedAt])`
- **`Product`**:
  - `@@index([workspaceId, status, updatedAt(sort: Desc)])`
  - `@@index([workspaceId, categoryId, status])`
- **`ProductOffer`**:
  - `@@index([workspaceId, status, price])`
  - `@@index([productId, status, price])`
- **`Invoice`**:
  - `@@index([workspaceId, createdAt(sort: Desc)])`
  - `@@index([subscriptionId, status])`
- **`SystemErrorLog`**:
  - `@@index([workspaceId, module, createdAt(sort: Desc)])`
- **`PlanHistory`**:
  - `@@index([workspaceId, createdAt(sort: Desc)])`

### 2. Otimização do Pool de Conexões em `src/lib/prisma.ts`
- Manter o padrão Singleton (`globalForPrisma.pool` e `globalForPrisma.prisma`) e o limite seguro por processo (`max: 2`, `connectionTimeoutMillis: 5000`).
- Ajustar `idleTimeoutMillis` de `1000` (1s) para `15000` (15s), evitando que conexões ativas sejam encerradas e recriadas a cada intervalo curto entre chamadas de API da mesma sessão.

### 3. Sincronização do Schema e Prisma Client
- Executar `npx prisma db push` e `npx prisma generate` para aplicar os novos índices no banco PostgreSQL e atualizar o client tipado.

## Critérios de Aceite (Definition of Done)
- [ ] Todos os 14 novos índices compostos declarados em `prisma/schema.prisma` e sincronizados no PostgreSQL via `npx prisma db push`.
- [ ] `src/lib/prisma.ts` atualizado com `idleTimeoutMillis: 15000` mantendo o Singleton de `Pool` e `PrismaClient`.
- [ ] Script de verificação da Task 303 confirmando os índices no schema e no catálogo `pg_indexes` do banco.
- [ ] `npx tsc --noEmit` e `npm run lint` passando sem erros.

