# Task: 020-rss-source-credit

## Status
DONE

## Objetivo
Adicionar o campo "Fonte" ao modelo de fontes RSS para uso posterior em créditos.

## Contexto
Para dar os devidos créditos às matérias originais, precisamos que cada fonte cadastrada tenha um nome comercial de exibição.

## Escopo
- Atualizar `schema.prisma`: adicionar `creditName String?` no model `Source`.
- Gerar migração do Prisma.
- Atualizar a interface de gerenciamento de Fontes RSS (`app/settings/sources`) para incluir um campo de texto opcional "Fonte (Nome de exibição)".
- Atualizar a API de criação/edição de fontes para aceitar e salvar este campo.

## Fora do escopo
- Inserir o crédito na publicação (isso será feito na task 024).

## Definition of Done
- [x] Schema Prisma atualizado.
- [x] Migração aplicada com sucesso.
- [x] UI de configurações de RSS exibe o novo campo.
- [x] Cadastro e edição de fonte salvam o valor no banco de dados.
- [x] TypeScript PASS.

## Evidence
- Modelo `Source` atualizado com o campo opcional `creditName String?` em `prisma/schema.prisma`.
- Migração `20260814025934_add_credit_name_to_source` gerada e aplicada via `npx prisma migrate dev`.
- Endpoints `POST /api/sources` e `PATCH /api/sources/[id]` atualizados para receber, sanitizar e gravar `creditName`.
- Interface gráfica em `src/app/settings/sources/page.tsx` atualizada com o campo no cadastro e suporte a edição inline dos dados de crédito da fonte.
- Script de integração `scripts/test-rss-source-credit.ts` executado com sucesso validando persistência via Prisma e API REST.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 2.1s)

## Status
DONE
