# Task 249. Cinco modelos visuais e renderização compartilhada

## Status
DONE

## Dependências
247 e 248.

## Objetivo
Renderizar cards com e sem foto, grade, carrossel e botão com nome abaixo usando os
mesmos contratos no preview e no HTML de publicação.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `src/lib/affiliate/canonical-document.ts`
- `src/lib/publisher/wordpress-renderer.ts` e `src/lib/affiliate/placement-service.ts`
- Primitivas de UI e estilos existentes

## Escopo e critérios de aceitação
- [x] Criar cinco modelos da SPEC com um ou vários produtos e CTA editável.
- [x] Reutilizar imagens originais com alt, dimensões responsivas e fallback sem imagem quebrada.
- [x] Botão deve ter CTA principal e nome do produto menor abaixo, com destino identificado acessivelmente.
- [x] Grade responsiva; carrossel com rolagem por toque/teclado e sem scripts externos/autoplay.
- [x] Renderizar dados escapados e URLs HTTP(S) válidas; rel comercial e proteção de nova aba.
- [x] Resolver ofertas conforme contrato 247; ausência/inatividade deve produzir pendência validável, nunca href="#".
- [x] Reutilizar disclosure e integração de tracking existente; distinguir ocorrências por ID/posição quando analytics habilitado.
- [x] Preservar compatibilidade dos blocos legados; não trocar tabela comparativa existente por grade silenciosamente.

## Validação obrigatória
- Fixtures dos cinco modelos com produtos distintos, repetidos, sem foto, texto longo e caracteres HTML.
- Rejeitar URLs javascript/data perigosas e escapar nomes/CTA/atributos.
- Verificar foto/CTA/ordem equivalentes no preview e nos renderers de publicação.
- Inspeção visual mobile/desktop, temas administrativos claro/escuro e HTML WordPress isolado; teclado no carrossel.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Testes aplicáveis: PASS, com comandos e resultados registrados.
- [x] `npm run build`: PASS quando houver alteração de aplicação/contratos consumidos pelo build.
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- `render-document.ts`: cinco modelos compartilhados, imagens originais, links escapados/compliance, disclosure único e comparação preservada como tabela.
- Renderer WordPress usa catálogo/entitlements do workspace; oferta inválida rejeitada, tracking condicionado a analytics.
- Placement legado usa modelos compartilhados e não duplica fechamento de parágrafos.
- `contracts.test.ts`: PASS (3); `render.test.ts`: PASS (2).
- `cards-browser.mjs`: PASS no Chromium, 390/1280px, fundos claro/escuro, imagens carregadas e carrossel focável por teclado. Screenshot mobile inspecionada visualmente.
- Evidências visuais: `/tmp/phase30-cards-{390,1280}-{light,dark}.png`.
- `npx tsc --noEmit`, `npm run lint` (0 erros, 6 avisos preexistentes) e `npm run build`: PASS.
- Build retomado após bloqueio temporário do auto-review por limite de uso; nenhuma publicação executada.


## Falha ou dependência indisponível
Manter IN_PROGRESS ou BLOCKED conforme situação. Registrar erro, tentativas e próxima ação.
Trabalho fora do escopo deve ir para Discovered Work, sem implementação automática.
