# Task 010. Settings Layout

## Status
DONE

## Objetivo
Criar sidebar e navegação para configurações.

## Escopo
- Dashboard
- Notícias
- Pendentes
- Publicadas
- Rejeitadas
- Configurações
- Fontes RSS
- WordPress
- Inteligência Artificial

## Definition of Done
- [x] Sidebar implementada.
- [x] Rotas organizadas.
- [x] Link ativo correto.
- [x] Responsivo.
- [x] Dashboard existente não quebra.
- [x] TypeScript PASS.
- [x] Lint PASS.

## Evidence
- Componente `Sidebar` criado em `src/components/sidebar.tsx` com suporte a navegação por grupos (Dashboard, Notícias com sub-filtros de status e Configurações), destaque de link ativo e colapso responsivo (drawer com backdrop).
- Integrado ao `src/app/layout.tsx` envelopado com limite de `Suspense`.
- Estrutura de rotas criada e validada:
  - `/` (Dashboard Editorial)
  - `/?status=PENDING` (Fila de Notícias Pendentes)
  - `/?status=PUBLISHED` (Fila de Notícias Publicadas)
  - `/?status=REJECTED` (Fila de Notícias Rejeitadas)
  - `/settings/sources` (Página dedicada para gestão de fontes RSS)
  - `/settings/wordpress` (Shell de configurações do WordPress para a Task 013)
  - `/settings/ai` (Shell de configurações de Provedores de IA para a Task 015)
- Dashboard refatorado sem duplicação de leiautes ou headers.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js com 14 rotas geradas em 560ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
