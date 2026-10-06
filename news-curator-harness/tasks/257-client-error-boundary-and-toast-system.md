# Task 257: Módulo Client de Captura de Erros e Sistema de Toast Popup

## Status
DONE

## Contexto
O usuário solicitou:
"Todo erro que estourar no sistema quero que continue exibindo como esta, normalmente mascarado e mostrando um popup pequeno nos cantos da tela, só que quero gravar no banco de dados também informações do erro, para que eu consiga simular qualquer problema, para que eu consiga, validar, identificar a causa. Quero Usuário, Tela, Consulta, Caminho, Mensagem de erro que estorou antes de tratar."

Precisamos de:
1. Endpoint `POST /api/error-logs` permitindo que erros no client sejam despachados com segurança para o banco de dados.
2. Contexto de feedback visual (Toast / Popup discreto no canto inferior ou superior da tela) integrado ao design system existente do GeraFeed.
3. Hook ou helper client `useErrorHandler` / `reportClientError` que emite o popup amigável e dispara em background o reporte do erro real.

## Critérios de Aceitação
- [x] Criar endpoint `POST /api/error-logs` com validação de payload, captura de sessão (se autenticado) e gravação no `SystemErrorLog`.
- [x] Implementar componente de Toast / Popup discreto no canto da tela (`src/components/ui/toast.tsx`, sem dependências pesadas, usando Tailwind CSS do design system).
- [x] Integrar o `ToastProvider` no layout raiz `src/app/layout.tsx` para suporte global em todas as telas da aplicação.
- [x] Fornecer helper client `reportClientError(error, context)` e hook `useToast` para componentes.
- [x] Teste automatizado validando endpoint `POST /api/error-logs`.
- [x] `npx tsc --noEmit` e `npm run lint` PASS.

## Evidências
- `src/app/api/error-logs/route.ts` criado e validado, recebendo e persistindo erros de tela/client com método `CLIENT`.
- `src/components/ui/toast.tsx` implementado com auto-dismiss configurável, suporte a `error`, `success`, `warning`, `info`, e renderização flutuante em `fixed bottom-4 right-4 z-50`.
- `src/lib/errors/client-reporter.ts` criado com `reportClientError`, emitindo notificação amigável e despachando os dados brutos com `keepalive: true`.
- `src/app/layout.tsx` atualizado envolvendo a aplicação com `<ToastProvider>`.
- `scripts/phase31/test-client-reporting.ts`: Teste automatizado validando o endpoint, persistência e metadados com 100% de aprovação.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).


## Definition of Done
- Endpoint `POST /api/error-logs` funcionando.
- Popups elegantes e discretos aparecendo nos cantos da tela ao acionar erros tratados.
- Logs enviados em background sem afetar a usabilidade do usuário.
