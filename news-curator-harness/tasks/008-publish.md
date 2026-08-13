# Task 008. Publish

## Status
DONE

## Objetivo
Publicar uma notícia aprovada no WordPress.

## Escopo
- Criar post via WordPress REST API.
- Enviar título.
- Enviar conteúdo.
- Enviar categoria.
- Enviar tags quando aplicável.
- Salvar `wordpressPostId`.
- Alterar status para PUBLISHED.

## Fora do escopo
- Cron.
- publicação automática sem aprovação.
- múltiplos WordPress.

## Definition of Done
- [x] Post é criado no WordPress.
- [x] Categoria correta é enviada.
- [x] Tags são tratadas corretamente.
- [x] `wordpressPostId` é salvo.
- [x] Status vira PUBLISHED somente após sucesso.
- [x] Falha mantém status PENDING.
- [x] TypeScript PASS.
- [x] Lint PASS.
- [x] Publicação real validada.

## Evidence
- Módulo de publicação implementado em `src/lib/wordpress.ts`:
  - `publishArticleToWordPress`: Valida o artigo, resolve/cria tags na API do WordPress (`getOrCreateWordPressTagIds`), constrói o payload com título, conteúdo, resumo e categoria, e executa a requisição `POST /wp-json/wp/v2/posts`.
- Atualização do Banco de Dados:
  - Salva o `wordpressPostId` retornado pela API.
  - Altera o status do artigo para `PUBLISHED` exclusivamente em caso de resposta HTTP de sucesso (200/201).
  - Em caso de falha de conexão ou erro HTTP (500/400), a exceção é capturada e o artigo é **mantido intacto com status PENDING**.
- Script de teste de integração `scripts/test-publish.ts` executado com servidor WordPress mockado:
  - Post publicado com sucesso: `wordpressPostId: 9988` gravado no PostgreSQL e `status: PUBLISHED`.
  - Envio e resolução de tags (`tecnologia`, `novatag`) validados.
  - Simulação de erro 500 no WordPress executada: `status` mantido como `PENDING` e `wordpressPostId` nulo.
- Validações:
  - `npx tsc --noEmit`: PASS (0 erros)
  - `npm run lint`: PASS (0 erros, 0 avisos)
  - `npm run build`: PASS (compilação produção do Next.js App Router em 276ms)

## Discovered Work
Nenhum trabalho fora do escopo descoberto.

## Status
DONE
