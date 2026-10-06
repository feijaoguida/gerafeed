# Task 251. Conteúdo & Pesquisa e review pré-selecionado

## Status
DONE

## Dependências
247 e 250.

## Objetivo
Trocar placeholders por orientação amigável, listar artigos reais e abrir o assistente
de review com o produto atual pré-selecionado.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `src/components/affiliate/product-detail.tsx` e `src/lib/affiliate/product-service.ts`
- `src/components/publishing/affiliate-publishing-wizard.tsx` e página de publicação affiliate
- `ArticleProduct`, APIs de produto e template PRODUCT_REVIEW

## Escopo e critérios de aceitação
- [x] Substituir texto técnico por orientação da SPEC; botão exato “Gerar Review deste Produto”.
- [x] Propagar referência do produto para wizard com PRODUCT_REVIEW selecionado, sem gerar automaticamente.
- [x] Carregar produto diretamente mesmo se estiver fora da primeira página do catálogo.
- [x] Validar tenant/entitlement/estado e exibir recuperação para produto indisponível; manter fluxo normal sem parâmetro.
- [x] Consultar ArticleProduct por workspace do produto e artigo, com paginação e ordem determinística.
- [x] Mostrar título, status, data e link de revisão; link publicado quando existir, sem chamar rascunho de publicado.
- [x] Implementar vazio/loading/erro e garantir que ocorrências repetidas não dupliquem artigos na listagem.

## Validação obrigatória
- Criar vínculos de teste reais com artigos pendente/publicado/rejeitado e conferir listagem e paginação.
- Produto sem vínculo, múltiplas ocorrências e produto de outro workspace.
- Navegação ao wizard com produto fora da primeira página, ID inválido/arquivado e plano sem módulo.
- Conferir que abrir o wizard não chama geração nem consome crédito.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Testes aplicáveis: PASS, com comandos e resultados registrados.
- [x] `npm run build`: PASS quando houver alteração de aplicação/contratos consumidos pelo build.
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- `product-content-service.ts` e API de artigos por produto consultam ArticleProduct com isolamento por workspace, paginação e ordenação determinística.
- `product-content-research.tsx` substitui os exemplos fixos por artigos reais, estados de loading/vazio/erro, status, data e links; CTA exato “Gerar Review deste Produto”.
- Página e wizard carregam o produto diretamente, pré-selecionam PRODUCT_REVIEW e não disparam geração ao abrir; produto ausente/arquivado tem recuperação e plano sem módulo é bloqueado.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/phase30-browsers node --import tsx scripts/phase30/content-browser.mjs`: PASS no Chromium e PostgreSQL locais, com usuário/workspaces temporários e limpeza automática. Cenários: lista vazia, artigos pendente/publicado/rejeitado, paginação, ocorrências repetidas sem duplicar relações, produto de workspace alheio, catálogo simulado sem o produto na primeira página, navegação completa e checkbox selecionado, ID inválido, arquivado, wizard sem parâmetro, bloqueio de plano na UI/API (403), zero requisições de geração.
- Captura: `/tmp/phase30-wizard-selected.png` (artefato local temporário).
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS (0 erros, 5 avisos preexistentes); `npx eslint scripts/phase30/content-browser.mjs`: PASS; `npm run build`: PASS; `git diff --check`: PASS.
- Correção do import de constantes no script de teste após erro inicial de export ESM; nova execução aprovada.
- Sem publicação em produção ou chamada real de geração de IA. Em 2026-10-03 o usuário pediu encerrar apenas a task atual; tasks 252–254 não iniciadas.


## Falha ou dependência indisponível
Manter IN_PROGRESS ou BLOCKED conforme situação. Registrar erro, tentativas e próxima ação.
Trabalho fora do escopo deve ir para Discovered Work, sem implementação automática.
