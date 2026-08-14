# Task: 024-article-generation-attribution

## Status
DONE

## Objetivo
Garantir que a imagem escolhida e o crédito da fonte sejam enviados corretamente ao WordPress.

## Contexto
É a etapa final da Fase 3: consolidar as escolhas feitas no dashboard na carga útil (payload) enviada à API do WordPress.

## Escopo
- Interceptar a rota de aprovação (`POST /api/articles/:id/approve`).
- Buscar a fonte associada à notícia para pegar o `creditName`.
- Fazer append no final do `content`: `<br><br><p><em>Fonte: ${creditName}</em></p>` (somente se `creditName` existir).
- Realizar o upload do arquivo de imagem selecionado (via endpoint de media do WP `/wp-json/wp/v2/media`) para obter o `featured_media` ID.
- Atribuir o ID gerado à chave `featured_media` do payload do post.
- Executar a publicação do post.

## Definition of Done
- [x] Texto do crédito aparece corretamente na matéria publicada no WP.
- [x] A imagem selecionada no dashboard aparece como Featured Image no post do WP.
- [x] Validações de erro (falha de upload de mídia) bem tratadas.

## Evidence
- Atribuição de crédito implementada em `publishArticleToWordPress` em [`src/lib/wordpress.ts`](file:///home/feijao/projetos/news-curator/src/lib/wordpress.ts): inclui `<br><br><p><em>Fonte: ${creditName}</em></p>` no final do HTML.
- Upload de imagem destacada implementado via função `uploadMediaToWordPress` (`/wp-json/wp/v2/media`) e vinculação ao campo `featured_media` no post do WordPress.
- Tratamento de erro resiliente: caso o upload de mídia falhe ou o servidor WordPress recuse o arquivo, o post é publicado normalmente sem interromper o fluxo.
- Script de teste de integração [`scripts/test-article-generation-attribution.ts`](file:///home/feijao/projetos/news-curator/scripts/test-article-generation-attribution.ts) executado com sucesso.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 322ms)

## Status
DONE
