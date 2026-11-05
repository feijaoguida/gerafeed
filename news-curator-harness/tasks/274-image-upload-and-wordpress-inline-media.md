# Task 274: Upload Seguro de Fotos e Imagens Inline no WordPress

## Status
DONE

## Contexto
Permitir que o usuário envie fotos e imagens do seu dispositivo para usar como capa da matéria ou inserir no corpo da matéria, com validação de segurança e upload automático para o WordPress ao publicar.

## Critérios de Aceitação
- [x] Criar endpoint `POST /api/images/upload` validando sessão/workspace, tamanho máximo (8MB), MIME type e magic bytes via `sharp(buffer).metadata()`, otimizando a imagem e retornando Data URI.
- [x] Atualizar `src/lib/imageProcessor.ts` (`processAndStoreImage`) para suportar imagens em formato Data URI além de URLs HTTP/HTTPS.
- [x] Atualizar `src/lib/wordpress.ts` (`uploadMediaToWordPress` e `publishArticleToWordPress`) para enviar imagens inline (`<img src="data:image/..." />`) do corpo da matéria para a Biblioteca de Mídia do WordPress e substituir pelo `source_url` publicado.
- [x] `npx tsc --noEmit` PASS.

## Evidências
- `src/app/api/images/upload/route.ts` criado com validação de sessão/workspace, limite de 8MB, validação de magic bytes com `sharp` (`jpeg`, `png`, `webp`), remoção de metadados EXIF e header `X-Content-Type-Options: nosniff`.
- `src/lib/imageProcessor.ts` atualizado com `validateAndOptimizeUploadedImage`, suporte a Data URI em `processAndStoreImage`, `buildInlineImageHtml` e `distributeImagesInHtmlContent`.
- `src/lib/wordpress.ts` atualizado com `uploadMediaToWordPressWithUrl` e `replaceInlineDataUriImagesWithWordPressMedia` integrado em `publishArticleToWordPress`.
- `npx tsc --noEmit`: PASS (0 erros).
