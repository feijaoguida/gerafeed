# Task: 022-image-processing-pipeline

## Status
DONE

## Objetivo
Criar o serviço de backend que processa a imagem original criando a versão modificada.

## Contexto
Quando uma notícia for processada e tiver uma `originalImageUrl`, o sistema deve baixar, aplicar a alteração (ex: inversão horizontal via biblioteca `sharp`) e disponibilizar a nova URL.

## Escopo
- Atualizar `schema.prisma`: adicionar `modifiedImageUrl String?` e `selectedImage String? @default("ORIGINAL")` no model `Article`.
- Instalar biblioteca `sharp`.
- Criar serviço (`src/lib/imageProcessor.ts`) que receba uma URL, baixe o buffer, inverta a imagem horizontalmente (`.flop()`) e aplique uma mudança sutil (ex: leve ajuste de contraste).
- Salvar o resultado (na pasta `public/media/modified-${articleId}.jpg`).
- Integrar esse passo ao final do `processArticle` (se a configuração global mandar alterar).

## Fora do escopo
- Envio para o WordPress (isso ocorre na publicação).

## Definition of Done
- [x] Banco atualizado.
- [x] Processador de imagem funcional.
- [x] O processamento da notícia salva a `modifiedImageUrl` no banco quando aplicável.

## Evidence
- Modelo `Article` atualizado com `modifiedImageUrl String?` e `selectedImage String? @default("ORIGINAL")` em `prisma/schema.prisma`.
- Migração `20260814030524_add_image_fields_to_article` aplicada com sucesso via `npx prisma migrate dev`.
- Biblioteca `sharp` instalada e integrada ao serviço [`src/lib/imageProcessor.ts`](file:///home/feijao/projetos/news-curator/src/lib/imageProcessor.ts).
- Processador baixa o buffer da `originalImageUrl`, aplica `.flop()`, modulação de brilho/saturação e salva em `public/media/modified-${articleId}.jpg`.
- `processArticleWithAi` em [`src/lib/ai.ts`](file:///home/feijao/projetos/news-curator/src/lib/ai.ts) atualizado para ler a preferência global `imageSettings` e gravar `modifiedImageUrl` e `selectedImage` no artigo.
- Script de teste [`scripts/test-image-processing-pipeline.ts`](file:///home/feijao/projetos/news-curator/scripts/test-image-processing-pipeline.ts) executado com sucesso.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção Next.js App Router em 624ms)

## Status
DONE
