# Task 002. Database

## Status
DONE

## Objetivo
Configurar Prisma + PostgreSQL e criar o modelo inicial.

## Escopo
- Instalar/configurar Prisma.
- Configurar `DATABASE_URL`.
- Criar schema para Source, WordPressCategory e Article.
- Criar migration.
- Criar cliente Prisma reutilizável no Next.js.
- Validar conexão.

## Fora do escopo
- CRUD completo da interface.
- RSS.
- IA.
- WordPress.

## Definition of Done
- [x] Prisma configurado.
- [x] PostgreSQL conectado.
- [x] Models criados (`Source`, `WordPressCategory`, `Article`).
- [x] `originalUrl` possui unicidade (`@unique`).
- [x] Migration criada e aplicada (`20260813173749_init`).
- [x] Prisma Client funcionando (`src/lib/prisma.ts`).
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Migração validada localmente.

## Evidence
- Pacotes instalados: `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg`.
- Migration criada e aplicada: `prisma/migrations/20260813173749_init/migration.sql`.
- Banco de dados PostgreSQL local `news_curator` alimentado com os schemas.
- `src/lib/prisma.ts` criado usando o adaptador `PrismaPg`.
- `scripts/test-db.ts` executado e validou:
  - Criação de `Source`
  - Criação de `Article`
  - Restrição de unicidade em `originalUrl` (RF04)
  - Limpeza e encerramento de conexões
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 avisos, 0 erros)
  - `npm run build`: PASS

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
