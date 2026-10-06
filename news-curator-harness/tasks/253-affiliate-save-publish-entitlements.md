# Task 253. Persistência, publicação e autorização integradas

## Status
DONE — implementada, validada em testes unitários e de integração real; evidências registradas.

## Dependências
250 e 252.

## Objetivo
Garantir que a versão revisada seja a publicada e que plano, workspace, ofertas e
relações sejam validados atomicamente em todos os caminhos de escrita/publicação.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- APIs de artigos, produtos vinculados e placements
- `src/lib/wordpress.ts`, `src/lib/publisher/`, BillingService e publicação/republicação
- Contratos 247 e edição 252

## Escopo e critérios de aceitação
- [x] Validar documentos e todas as referências no servidor antes de gravar; recusar produto/oferta de outro workspace.
- [x] Salvar conteúdo/canônico/ocorrências/ArticleProduct em transação e manter idempotência de saves repetidos.
- [x] Preservar distinção entre produtos-base de geração e recomendações manuais ao sincronizar vínculos.
- [x] Resolver ofertas atuais para preview/publicação; oferta explícita inválida exige ação do editor, sem troca silenciosa.
- [x] Aplicar AFFILIATE_MODULE em importação, edição comercial, preview e publicação, inclusive endpoints diretos.
- [x] Permitir leitura e remoção de blocos após downgrade, preservando dados; bloquear nova publicação com afiliados.
- [x] Usar renderização equivalente em approve, republish e adapters/legado; marcar necessidade de republicar sem publicar automaticamente.
- [x] Garantir disclosure único e tracking conforme entitlement analytics, sem bloquear navegação.

## Validação obrigatória
- Transação real em banco de teste: falha em vínculo reverte corpo/blocos; saves repetidos não duplicam dados.
- Tentar operações sem sessão, sem módulo, em tenant alheio e com oferta de outro produto.
- Editar corpo comercial, salvar/reabrir e capturar HTML enviado para WordPress: deve conter texto atualizado e blocos corretos.
- Downgrade, remover último bloco, preservar relação editorial necessária, oferta desativada entre edição e publish.
- Validar approve/republish/adapters e ausência de links hardcoded no documento persistido.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS (0 erros, 5 avisos preexistentes em arquivos não relacionados).
- [x] Testes aplicáveis: PASS (`scripts/phase30/persistence-publish.test.ts`: PASS, e 15/15 testes da Phase 30 com sucesso).
- [x] `npm run build`: PASS (compilação completa de produção com 85/85 rotas estáticas e dinâmicas).
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- `src/lib/affiliate/article-persistence-service.ts` criado com método atômico `validateAndSaveArticle`:
  - Validação rigorosa de isolamento multi-tenant: rejeita atualizações sem workspace (401), acessos entre workspaces alheios (404) e referências a produtos de outros tenants (404).
  - Validação estrita de ofertas: impede vínculos com ofertas alheias ao produto ou ao workspace (409).
  - Transação real com rollback: falha em qualquer etapa (produto ou oferta) preserva o documento e os vínculos originais intactos.
  - Idempotência: salvamentos repetidos com o mesmo payload produzem exatamente os mesmos registros sem duplicar `articleProducts` nem blocos.
  - Distinção entre produtos-base e recomendações manuais: `meta.baseProductIds` preserva produtos-base mesmo se omitidos do corpo; produtos adicionados no corpo como recomendação são desvinculados quando seu último bloco é removido.
  - Ausência de links hardcoded: o documento persistido armazena apenas IDs estruturados nos marcadores e no canônico, sem persistir `affiliateUrl`.
  - Detecção de alteração em post publicado: edição em artigo já publicado marca `needsRepublish: true` sem publicar automaticamente.
- `src/app/api/articles/[id]/route.ts`:
  - Endpoint PATCH refatorado para delegar a persistência ao `ArticlePersistenceService`, retornando status HTTP apropriados (400, 401, 403, 404, 409, 500).
- `src/lib/wordpress.ts`:
  - `publishArticleToWordPress` integrado com `WordPressAffiliateRenderer.renderToHtml`: valida entitlement `AFFILIATE_MODULE`, resolve ofertas ativas no momento da publicação (impedindo publicação com oferta pausada/removida com erro 409), injeta disclosure único e script de analytics não bloqueante.
  - Publicação registra hash e metadados via `PublicationSyncService.recordPublication`.
- `src/app/api/articles/[id]/approve/route.ts`:
  - Mapeamento adequado de status HTTP para falhas de autorização (403), recursos ausentes (404) e ofertas inválidas/inativas (409).
- `src/app/api/articles/[id]/republish/route.ts` e `src/lib/publisher/publication-sync.ts`:
  - Suporte completo a documento canônico estruturado, marcadores HTML e compatibilidade legada; republicação via adapter WordPress sincroniza hash e redefine `needsRepublish: false`.
- `src/app/api/articles/[id]/preview/route.ts`:
  - Rota GET e POST criada para renderização server-side fiel ao WordPress, aplicando validações de entitlement (403) e resolução de ofertas ativas (409 se inativas).
- `src/lib/affiliate/article-product-service.ts`:
  - Sincronização atômica de `meta.baseProductIds` ao remover vínculos editoriais com validação de cardinalidade por tipo de artigo comercial.
- Testes automatizados:
  - `node --import tsx --test scripts/phase30/persistence-publish.test.ts`: PASS (8 cenários integrados com banco de dados real em tenant isolado, transações, rollback, downgrade, cardinalidade e republicação).
  - `node --import tsx --test scripts/phase30/*.test.ts`: 15/15 PASS.
  - `npx tsc --noEmit`: PASS (0 erros).
  - `npm run lint`: PASS (0 erros, 5 avisos preexistentes).
  - `npm run build`: PASS (85/85 páginas compiladas).
- Nenhuma publicação em produção foi realizada.

## Falha ou dependência indisponível
Nenhuma. Todos os critérios foram concluídos com sucesso.
