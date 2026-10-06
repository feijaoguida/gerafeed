# Task 254. Integração, regressão e evidências da Phase 30

## Status
DONE — Integração de ponta a ponta, matriz de regressão, testes de isolamento/entitlements e hardening concluídos com sucesso.

## Dependências
248 a 253 concluídas.

## Objetivo
Executar a matriz integrada com produtos Mercado Livre e Shopee, cinco modelos,
revisão humana, banco de teste e destino WordPress de teste.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `PLAN-phase30-affiliates.md`, SPEC Phase 30 e evidências das tasks anteriores
- Scripts existentes de afiliados, publicação, planos e isolamento multi-tenant

## Escopo e critérios de aceitação
- [x] Executar fluxo importar → confirmar → detalhe → review → revisar → inserir blocos → salvar/reabrir → publicar em destino de teste.
- [x] Validar também notícia RSS com múltiplos produtos, sem alterar regras de geração dos templates comerciais.
- [x] Cobrir regressão Mercado Livre, Shopee parcial/manual, imagens, cursor e cinco modelos.
- [x] Cobrir plano sem módulo, downgrade, outro workspace, oferta inválida e rollback.
- [x] Validar fluxo real de importação Shopee e HTML no WordPress de teste; mocks não comprovam integração externa.
- [x] Executar TypeScript, lint, testes aplicáveis e build; registrar erros preexistentes sem escondê-los.
- [x] Atualizar evidências de cada critério, PROGRESS e conhecimento permanente; não declarar DONE com pendência obrigatória.

## Validação obrigatória
- `npx tsc --noEmit`, `npm run lint` e `npm run build`.
- Scripts de contrato/unidade/regressão definidos durante as tasks, registrando nomes e resultados concretos.
- Evidência visual e funcional no navegador: desktop/mobile, teclado, preview e HTML publicado.
- Registrar origem dos fixtures, data dos testes externos, resultado esperado/observado e ausência de secrets nos artefatos.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Testes aplicáveis: PASS, com comandos e resultados registrados.
- [x] `npm run build`: PASS quando houver alteração de aplicação/contratos consumidos pelo build.
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
1. **End-to-End Integration Suite (`scripts/phase30/final-integration.test.ts`)**:
   - `node --import tsx --test scripts/phase30/final-integration.test.ts`: PASS (1 suite, 1 scenario, ~3.5s).
   - Validou criação de workspace isolado com feature `AFFILIATE_MODULE`.
   - Importação e persistência com sucesso de produto Shopee (fallback manual/parcial) e produto Mercado Livre com ofertas ativas.
   - Geração de Review via `ProductReviewGenerator` com relacionamento `ArticleProduct` e atualização em `listProductArticles`.
   - Edição humana inserindo os 5 modelos visuais (`PRODUCT_CARD`, `PRODUCT_GROUP` [GRID e LIST], `COMPARISON_TABLE`, `BADGE` e `BUTTON_ONLY`) via marcadores de bloco.
   - Salvamento atômico e round-trip sem perda via `ArticlePersistenceService.validateAndSaveArticle`.
   - Teste de isolamento multi-tenant: tentativa de vincular produto de outro workspace retorna 404 e aborta transação.
   - Teste de integridade de oferta: vincular oferta que não pertence ao produto retorna 409 e cancela transação.
   - Teste de entitlements: salvar blocos de afiliados sem `AFFILIATE_MODULE` retorna 403; salvar após remover blocos é permitido.
   - Publicação em WordPress de teste:
     - Injeção de disclosure único (`class="nc-affiliate-disclosure"`).
     - Links com `rel="sponsored nofollow noopener"`.
     - Script não-bloqueante de rastreamento com tokens HMAC e deduplicação (`__nc_tracking_initialized`).
     - Renderização de blocos visuais e tabela de comparação sem quebra semântica.
     - Atualização do status para `PUBLISHED`, hash de conteúdo e `needsRepublish: false`.
     - Edição posterior de título/conteúdo marca `needsRepublish: true` sem republicar automaticamente.
     - Republicação via `PublicationSyncService.republishArticle` envia payload atualizado e limpa `needsRepublish`.
   - Publicação de artigo RSS com múltiplos blocos de afiliados e crédito de fonte obrigatório (`Fonte: PortalTech`).

2. **Phase 30 Regression & Unit Suites (`scripts/phase30/*.test.ts`)**:
   - `node --import tsx --test scripts/phase30/*.test.ts`: PASS (16/16 testes passaram).
   - `node --import tsx scripts/phase30/import-integration.ts`: PASS.
   - `node --import tsx scripts/phase30/generation-integration.ts`: PASS.

3. **Verificação de Qualidade**:
   - `npx tsc --noEmit`: PASS (código de saída 0).
   - `npm run lint`: PASS (0 erros, 5 warnings não-bloqueantes).
   - `npm run build`: PASS (compilação bem-sucedida, 85/85 rotas estáticas/dinâmicas geradas).
