# Task 263: Link no Login e Liberação de Rota Pública no Proxy

## Status
DONE

## Contexto
Para que o usuário consiga acessar o fluxo de recuperação de senha:
1. O formulário de login (`/login`) deve apresentar de forma clara e acessível o link "Esqueceu a senha?".
2. A nova rota `/forgot-password` deve ser autorizada no Next.js Proxy (`src/proxy.ts`), caso contrário o middleware redirecionará usuários não autenticados para `/login`.

## Critérios de Aceitação
- [x] Atualizar `src/proxy.ts` adicionando `forgot-password` à lista de exclusão do matcher (rotas públicas permitidas sem sessão).
- [x] Atualizar `src/app/(public)/login/login-view.tsx`:
  - Inserir link "Esqueceu a senha?" posicionado de forma harmoniosa no bloco do campo de senha (ou imediatamente acima do botão de submissão).
  - Estilização com cores da marca, hover acessível e apontando para `/forgot-password`.
- [x] Validar que `npx tsc --noEmit` passa sem erros.
- [x] Validar que `npm run lint` passa sem erros.

## Evidências
- `src/proxy.ts` atualizado: rota `/forgot-password` incluída na regex de rotas públicas liberadas.
- `src/app/(public)/login/login-view.tsx` atualizado: linha de label da senha com texto "Senha" e link "Esqueceu a senha?" apontando para `/forgot-password`, mantendo layout alinhado e acessível.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).

## Definition of Done
- `src/proxy.ts` atualizado com a rota pública `/forgot-password`.
- `login-view.tsx` exibe o link funcional apontando para `/forgot-password`.
- `npx tsc --noEmit` PASS.
- `npm run lint` PASS.
