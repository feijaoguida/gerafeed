# Task 250. Imagens originais e cards no meio e final

## Status
DONE

## Dependências
249-affiliate-block-renderers.

## Objetivo
Corrigir a composição de artigos gerados, incluindo produtos com apenas uma imagem,
e distribuir recomendações comerciais editáveis ao longo do texto.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `src/lib/affiliate/generators/{review-generator,comparison-generator,roundup-generator}.ts`
- Contratos e renderers concluídos em 247/249

## Escopo e critérios de aceitação
- [x] Obter imagens exclusivamente do catálogo validado; usar a primeira também no corpo se for a única.
- [x] Nos reviews, manter abertura e adicionar card no meio e no final; nos conteúdos de vários produtos, distribuir grupos sem excesso.
- [x] Determinar meio em fronteira de parágrafo/seção, preservando HTML; definir fallback para texto muito curto.
- [x] Persistir ocorrências estruturadas editáveis e vínculos únicos; não embutir URLs afiliadas no conteúdo canônico.
- [x] Preservar imagem destacada; permitir repetição intencional e impedir duplicação automática em cada save/reload.
- [x] Eliminar fallbacks factuais inventados nos caminhos alterados: notas, prós/contras, seller e promessa de desconto.
- [x] Não reescrever artigos existentes/publicados em lote.

## Validação obrigatória
- Gerador com IA simulada e catálogo contendo zero/uma/várias imagens; conferir corpo, capa, meio e fim.
- Review, comparação, lista e guia com produtos selecionados; IDs extras da IA não entram no documento.
- Conteúdo com poucos parágrafos, headings, listas e tabelas sem tag quebrada.
- Salvar/reabrir mantém quantidade e posição dos blocos; ausência de dados não gera fatos fictícios.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Testes aplicáveis: PASS, com comandos e resultados registrados.
- [x] `npm run build`: PASS quando houver alteração de aplicação/contratos consumidos pelo build.
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- `enrich-document.ts` e `html-position.ts` distribuem ocorrências no meio/final em fronteiras seguras e usam somente imagens do catálogo.
- Quatro geradores atualizados, com baseProductIds e imagem destacada; removidos fallbacks de notas/prós/contras nos caminhos alterados.
- `generation.test.ts`: PASS (2 testes; 9 combinações de quantidade/imagens e round-trip).
- `generation-integration.ts`: PASS — quatro geradores reais com IA simulada e PostgreSQL local temporário; corpo/capa/ocorrências/vínculos persistidos e limpos ao final.
- `npx tsc --noEmit`, `npm run lint` (0 erros, 6 avisos preexistentes), lint dos scripts novos e `npm run build`: PASS.
- Nenhum artigo existente foi reescrito nem houve chamada de IA real/publicação.


## Falha ou dependência indisponível
Manter IN_PROGRESS ou BLOCKED conforme situação. Registrar erro, tentativas e próxima ação.
Trabalho fora do escopo deve ir para Discovered Work, sem implementação automática.
