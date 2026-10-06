# Task 247. Contratos de blocos, persistência e compatibilidade

## Status
DONE

## Dependências
Autorização explícita para iniciar implementação.

## Objetivo
Mapear a edição e publicação atuais e definir os contratos que impedem divergência entre
texto revisado, documento canônico, ocorrências comerciais e vínculos ArticleProduct.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `src/lib/affiliate/{canonical-document,placement-service,article-product-service,template-rules}.ts`
- `src/lib/wordpress.ts`, `src/lib/publisher/` e `prisma/schema.prisma`
- `src/components/affiliate/affiliate-article-editor.tsx` e revisão de artigos

## Escopo e critérios de aceitação
- [x] Documentar todos os consumidores de content/canonicalContent, inclusive preview, approve, republish e adapter.
- [x] Definir contrato validável com ID estável de ocorrência, modelo, produtos ordenados, CTA, oferta opcional e posição.
- [x] Definir representação única ou adaptação explícita para RSS e comercial, sem hardcode de affiliateUrl.
- [x] Definir sincronização atômica e idempotente de corpo, canônico e ArticleProduct; política de remoção do último uso.
- [x] Distinguir produtos-base de geração de recomendações adicionadas manualmente sem enfraquecer limites dos templates.
- [x] Definir compatibilidade com blocos/artigos existentes e política determinística de ofertas; só propor migration se necessária.
- [x] Definir contratos das APIs e respostas 400/401/403/404/409 conforme situação; reutilizar convenções de autenticação existentes.
- [x] Atualizar ADR-090 com decisão efetiva e justificar eventual nova dependência. Implementar apenas contratos/validadores/compatibilidade desta task.

## Validação obrigatória
- Validar contratos com fixtures: documento antigo, cinco modelos, múltiplas ocorrências do mesmo produto e grupos ordenados.
- Rejeitar layout desconhecido, IDs inválidos, payload excessivo, referência incompleta e oferta incompatível.
- Testar round-trip de serialização e preservação do texto/ordem, sem gravar links comerciais no documento.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Testes aplicáveis: PASS, com comandos e resultados registrados.
- [x] `npm run build`: PASS quando houver alteração de aplicação/contratos consumidos pelo build.
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- `block-contract.ts`: cinco modelos, ocorrências estáveis, validação e resolução determinística de oferta.
- `canonical-document.ts` e `editor-document.ts`: novo bloco compatível com legado e round-trip de edição.
- ADR-090 aceita com mapa de consumidores, sincronização, política de vínculos/base e erros de API.
- `node --import tsx scripts/phase30/contracts.test.ts`: PASS, 3 testes com casos positivos/negativos.
- `npx tsc --noEmit`: PASS. `npm run lint`: PASS, 0 erros e 6 avisos preexistentes.
- `npm run build`: PASS, 85/85 páginas, executado com rede após encerrar tentativa restrita pendente.
- Não houve alteração de banco nem publicação. Integração desta task é round-trip/compatibilidade dos contratos; persistência real é task 253.


## Falha ou dependência indisponível
Manter IN_PROGRESS ou BLOCKED conforme situação. Registrar erro, tentativas e próxima ação.
Trabalho fora do escopo deve ir para Discovered Work, sem implementação automática.
