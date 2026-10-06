# Plano Phase 30 — Afiliados Shopee e edição de posts

## Estado
Implementação parcial: tasks 247–251 DONE; tasks 252–254 TODO.
Autorizada em 2026-10-02. Em 2026-10-03, o usuário pediu encerrar a execução após a task atual (251).
Não publicar em produção.

## Resultado esperado
Importar produtos Shopee, gerar artigos com imagens originais e distribuir recomendações
comerciais em qualquer posição escolhida pelo editor. Transformar a aba Conteúdo & Pesquisa
em acesso direto ao review e aos artigos que realmente usam o produto.

## Fonte da verdade
- Requisitos: [SPEC.md, Phase 30](SPEC.md#phase-30-shopee-imagens-originais-e-blocos-de-afiliados-na-revisão).
- Regras de execução: [AGENTS.md](AGENTS.md).
- Status/evidências: [PROGRESS.md](PROGRESS.md).
- Decisões: [docs/decisions.md](docs/decisions.md), ADR-090 aceita.
- Tasks abaixo têm critérios e validação próprios; trabalhar em uma por vez.

## Sequência de execução

| Task | Entrega | Depende de |
|---|---|---|
| [247](tasks/247-affiliate-block-contracts.md) | Contratos, compatibilidade e decisões de persistência | Autorização de implementação |
| [248](tasks/248-shopee-affiliate-import.md) | Provider Shopee, importação, dedupe e refresh | 247 |
| [249](tasks/249-affiliate-block-renderers.md) | Cinco modelos e renderização compartilhada | 247, 248 |
| [250](tasks/250-affiliate-original-images-and-placement.md) | Imagens e cards no meio/final da geração | 249 |
| [251](tasks/251-product-content-research-and-review.md) | Artigos vinculados e atalho de review | 247, 250 |
| [252](tasks/252-affiliate-cursor-editor.md) | Inserção/edição de blocos no cursor | 249, 251 |
| [253](tasks/253-affiliate-save-publish-entitlements.md) | Persistência, autorização e publicação integradas | 250, 252 |
| [254](tasks/254-phase30-integration-and-hardening.md) | Testes integrados e evidências finais | 248–253 |

## Direção de implementação a validar na task 247
- Reutilizar provider, catálogo, billing, relações e publisher existentes.
- Definir uma ocorrência estruturada independente do vínculo único ArticleProduct.
- Definir como edição HTML e canônico permanecem equivalentes em RSS e comercial.
- Definir compatibilidade de blocos antigos, política de oferta e relações editoriais.
- Decidir se é necessária migration somente após inspecionar os modelos; não a executar no planejamento.
- Separar produtos-base de geração das recomendações extras adicionadas no editor.
- Documentar testes por task e fixtures sem credenciais ou dados de produção.

## Estratégia de validação

| Área | Cenários essenciais |
|---|---|
| Importação | Link curto/direto, redirects, JSON-LD/OG, parcial, login/challenge, URL insegura, dedupe e refresh |
| Imagens | Zero, uma e várias imagens, repetição permitida, atributo escapado, URL inválida |
| Modelos | Cinco layouts, um/vários produtos, texto longo, responsividade, teclado e toque |
| Cursor | Início/meio/fim, parágrafo dividido, seleção não apagada, foco preservado, posição inválida |
| Persistência | Salvar/reabrir, texto e canônico equivalentes, rollback, save repetido, remover último uso |
| Wizard/relações | Produto fora da primeira página, inválido/arquivado, listagem real paginada, nenhum vínculo duplicado |
| Autorização | Sem sessão, outro workspace, plano sem módulo, downgrade, oferta alheia/inativa |
| Publicação | Aprovar/republicar/adapters, oferta resolvida atual, disclosure único, tracking opcional |

Testes unitários/de contrato com fixtures determinísticas; integração de persistência em banco
de teste; validação visual/editor no navegador; prova de HTML enviado a WordPress de teste.
Teste com link real Shopee deve registrar data, resultado e limitação externa sem expor tracking
pessoal. Se a página pública bloquear, validar também o fluxo manual real; não declarar extração
real aprovada apenas por um teste de fixture. Credenciais e links reais necessários serão
identificados na execução; não ler nem alterar `.env` para elaborar este plano.

## Riscos conhecidos e tratamento
- Shopee pode retornar challenge: resultado parcial legível e complemento manual; nunca dados inventados.
- Há múltiplos renderers: mapear consumidores antes de consolidar; testar todos os caminhos.
- Texto salvo pode divergir do canônico: resolver na persistência, com teste save/reload/publish.
- Repetição pode violar unicidade de ArticleProduct: ocorrências e vínculos têm papéis separados.
- Cursor em HTML pode corromper tags: validar contexto e dividir parágrafos com estrutura válida.
- Blocos existentes podem ficar sem oferta após edição do catálogo: pendência explícita antes de publicar.

## Fluxo do harness após autorização
1. Revalidar SPEC, MEMORY, PROGRESS e task 247; conferir alterações locais do usuário.
2. Marcar somente a task atual como IN_PROGRESS.
3. Implementar o escopo, executar DoD e registrar comandos/resultados.
4. Marcar DONE somente com todos os critérios cumpridos; caso contrário registrar erro e próxima ação.
5. Atualizar PROGRESS e, para conhecimento permanente, MEMORY/decisions.
6. Prosseguir em sequência dentro da autorização recebida; não ampliar escopo com ideias futuras.

## Critério de conclusão deste planejamento
Spec, plano, oito tasks TODO e gate de autorização documentados; links/IDs consistentes;
nenhuma alteração em código, schema, migrations ou variáveis de ambiente.
Isso conclui a documentação, não a Phase 30 de implementação.
