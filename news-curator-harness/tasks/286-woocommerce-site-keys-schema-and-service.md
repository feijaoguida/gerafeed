# Task 286: Schema & Backend de Credenciais WooCommerce em WordPressSite

## Status
DONE

## Contexto
Permitir que cada destino WordPress (`WordPressSite`) armazene as credenciais da WooCommerce REST API (`woocommerceConsumerKey` e `encryptedWooCommerceSecret`), garantindo que segredos sejam criptografados com AES-256-GCM e nunca expostos ao client.

## Evidências de Conclusão
- `prisma/schema.prisma`: Adicionados `woocommerceConsumerKey String?` e `encryptedWooCommerceSecret String?` no model `WordPressSite`.
- Banco de dados e Prisma Client:
  - `npx prisma db push`: Banco sincronizado com sucesso.
  - `npx prisma generate`: Client atualizado com sucesso.
- `src/lib/wordpress-sites.ts`:
  - Interfaces atualizadas: `CreateWordPressSiteInput`, `UpdateWordPressSiteInput`, `WordPressSiteClientSafe` e `WordPressSiteDecryptedConfig`.
  - `createWordPressSite`: encripta `woocommerceConsumerSecret` via AES-256 (`encrypt()`) antes de salvar no banco.
  - `updateWordPressSite`: suporta atualizar `woocommerceConsumerKey` e `woocommerceConsumerSecret`, permitindo também limpar (`null`) quando string vazia for enviada.
  - `sanitizeWordPressSite`: expõe `woocommerceConsumerKey: string | null` e `hasWooCommerceSecret: boolean` sem expor a chave secreta ao client.
  - `getWordPressSiteConfig`: decripta `encryptedWooCommerceSecret` para `woocommerceConsumerSecret` para chamadas de servidor autenticadas.
- Validações:
  - Teste automatizado com inserção real no banco, encriptação `v1:`, sanitização e decriptação: SUCESSO TOTAL.
  - `npx tsc --noEmit`: PASS (0 erros).
  - `npm run lint`: PASS (0 erros).

## Critérios de Aceitação
- [x] `prisma/schema.prisma` com `woocommerceConsumerKey` e `encryptedWooCommerceSecret`.
- [x] `npx prisma db push` e `npx prisma generate` executados com sucesso.
- [x] `src/lib/wordpress-sites.ts` atualizado com tipagens e encriptação/sanitização.
- [x] `npx tsc --noEmit` PASS (0 erros).
- [x] `npm run lint` PASS (0 erros).
