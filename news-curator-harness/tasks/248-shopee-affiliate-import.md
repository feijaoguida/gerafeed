# Task 248. Provider Shopee, preview, confirmação e refresh

## Status
DONE

## Dependências
247-affiliate-block-contracts.

## Objetivo
Adicionar Shopee ao fluxo existente de importação manual, preservando Mercado Livre e
atribuição do link afiliado. Extração é best-effort, com fallback manual seguro.

## Antes de implementar
Leia AGENTS.md, SPEC.md (Phase 30), MEMORY.md, PROGRESS.md e PLAN-phase30-affiliates.md.
Revalide a implementação atual e as alterações locais do usuário.

- `src/lib/affiliate/{types,factory,seed,resolver,ssrf,metadata-extractor,service,refresh-service}.ts`
- `src/components/affiliate/affiliate-importer.tsx` e APIs de importação/refresh

## Escopo e critérios de aceitação
- [x] Validar hosts e formatos com documentação oficial e links reais; registrar a allowlist exata e fontes consultadas.
- [x] Implementar provider Shopee, registro na factory e seed idempotente; extrator não deve aplicar heurísticas exclusivas do Mercado Livre.
- [x] Definir COMPLETE como nome, imagem e oferta/preço extraídos confiavelmente; demais campos são opcionais e nunca inventados.
- [x] Distinguir PARTIAL por dados indisponíveis de FAILED por entrada/redirecionamento inseguro; não importar páginas genéricas/login como produto.
- [x] Adicionar seleção de marketplace; invalidar preview ao trocar URL/provider; enviar provider na confirmação.
- [x] Preservar affiliateUrl e seus parâmetros; salvar resolvedUrl/identidade externa/source/date separadamente.
- [x] Validar provider, URLs, categoria, workspace, limites e dedupe no servidor e na confirmação concorrente.
- [x] Resolver redirects com proteção SSRF em todos os saltos e limite de duração também na leitura do corpo.
- [x] Atualizar refresh e textos de interface para usar o provider da oferta, preservando dados editoriais.

## Validação obrigatória
- Fixtures de link direto/curto, JSON-LD/OG, metadata incompleta, HTML vazio, challenge/login e erro HTTP.
- Testar URL maliciosa, credenciais embutidas, DNS/IP privado, redirect proibido, loop, timeout e corpo excessivo.
- Testar dedupe entre programas, dentro do mesmo programa e confirmação repetida/concorrente.
- Regressão de preview/confirm/refresh Mercado Livre, tenant e limites.
- Validar link real Shopee em ambiente de teste; registrar resultado real da extração e, se bloqueada, do complemento manual.

## Definition of Done
- [x] Todos os critérios de aceitação e cenários aplicáveis executados.
- [x] `npx tsc --noEmit`: PASS.
- [x] `npm run lint`: PASS.
- [x] Testes aplicáveis: PASS, com comandos e resultados registrados.
- [x] `npm run build`: PASS quando houver alteração de aplicação/contratos consumidos pelo build.
- [x] Integração aplicável e autorização/isolamento validados.
- [x] Evidências registradas e PROGRESS atualizado; MEMORY/decisions somente para conhecimento permanente.

## Evidências
- Shopee provider/factory/seed, seleção de marketplace, preview invalidado e confirmação com revalidação server-side.
- Resolver limita também leitura do corpo; fixtures cobrem redirect inseguro, corpo excessivo e timeout.
- Confirmações serializadas por Workspace (row lock PostgreSQL), sem segurar conexões externas de billing na transação; dedupe por programa/URL/identidade.
- `node --import tsx scripts/phase30/shopee.test.ts`: PASS, 2 testes com vários cenários.
- `scripts/phase30/import-integration.ts`: PASS em workspace temporário PostgreSQL local, com limpeza; concorrência gera um único produto, preview não grava, preserva descrição editorial e rejeita categoria alheia.
- Consulta real a produto público do blog oficial Shopee em 2026-10-03: PARTIAL. Fluxo manual confirmado no banco local; extração automática completa real NÃO comprovada. Fixture JSON-LD: COMPLETE.
- Fonte do produto real: https://shopee.com.br/blog/produtos-para-afiliados/ (link Shopito de Pelúcia, produto 947152679.23297335584).
- Fontes oficiais de fluxo/links: https://help.shopee.com.br/portal/10/article/128461-Como-gerar-seus-links-de-Afiliado-ou-ID-de-produto-para-compartilhar e https://help.shopee.ph/portal/10/article/123992-How-to-generate-your-Link.
- Allowlist: shopee.com.br, shope.ee e shp.ee, com subdomínios e validação SSRF/DNS em cada salto. Link personalizado do usuário ainda não recebido; formatos curtos cobertos por fixtures.
- `npx tsc --noEmit`: PASS; `npm run lint`: PASS (0 erros, 6 avisos preexistentes); `npm run build`: PASS.


## Falha ou dependência indisponível
Manter IN_PROGRESS ou BLOCKED conforme situação. Registrar erro, tentativas e próxima ação.
Trabalho fora do escopo deve ir para Discovered Work, sem implementação automática.
