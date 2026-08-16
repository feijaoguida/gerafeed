# Task 051 — Fix Image Processing on Serverless (Vercel)

## Problema
O `imageProcessor.ts` salva imagens no filesystem local (`public/media/`). Na Vercel (serverless), o filesystem é read-only em runtime, causando falha silenciosa.

## Escopo
- Alterar `processAndStoreImage` para retornar um Data URI (`data:image/jpeg;base64,...`) em vez de gravar arquivo no disco.
- O campo `modifiedImageUrl` do Article no banco passa a armazenar o Data URI.
- Remover dependências de `fs` e `path` do `imageProcessor.ts`.

## Definition of Done
- [ ] `processAndStoreImage` retorna Data URI base64 em vez de caminho de arquivo.
- [ ] `fs` e `path` removidos do `imageProcessor.ts`.
- [ ] Imagem processada é exibida corretamente no editor (local e Vercel).
- [ ] TypeScript PASS.
- [ ] Lint PASS.
