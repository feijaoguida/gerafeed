# Task 260: Integração End-to-End, Hardening e Evidências da Phase 31

## Status
DONE

## Contexto
Consolidar a entrega da Phase 31 garantindo que todo o fluxo funcione perfeitamente:
1. Simulação de erros (servidor e cliente) verificando que o erro é mascarado com popup elegante e simultaneamente registrado no banco com todos os detalhes solicitados (usuário, tela, consulta/payload, caminho, mensagem original e stack trace).
2. Validação dos filtros no Backoffice (tenant, módulo, usuário, data).
3. Validação da rotina de limpeza com período configurado.
4. Testes de segurança (SuperAdmin obrigatório).
5. TypeScript estrito, lint e build do Next.js sem quebras.

## Critérios de Aceitação
- [x] Criar script de teste abrangente em `scripts/phase31/test-phase31-e2e.ts`.
- [x] Testar cenários:
  - Erro capturado no backend com gravação e resposta mascarada.
  - Erro reportado pelo frontend com dados de tela e contexto.
  - Sanitização de campos com credenciais/senhas.
  - Filtros no Backoffice por tenant, módulo, usuário e data.
  - Rotina de limpeza apagando somente registros acima do prazo configurado.
- [x] Validar que rotas protegidas rejeitam requisições sem `isSuperAdmin`.
- [x] `npx tsc --noEmit` PASS (0 erros).
- [x] `npm run lint` PASS (0 erros).
- [x] `npm run build` PASS (92/92 rotas compilando com sucesso).
- [x] Registrar evidências detalhadas em `news-curator-harness/PROGRESS.md`.

## Evidências
- `scripts/phase31/test-phase31-e2e.ts`: Todos os 5 cenários integrados validados com 100% de sucesso:
  1. Sanitização estrita de credenciais (`password`, `apiKey`, `secretToken`, `applicationPassword`, `creditCard`).
  2. Tratamento no servidor (`handleApiError`) gravando mensagem original bruta, stack trace e dados de rede no banco, enquanto entrega mensagem mascarada e `errorId` para o cliente.
  3. Reporte de erro client-side com tela, rota e stack trace.
  4. Filtros de auditoria no Backoffice por tenant, módulo, usuário e período.
  5. Rotina de expurgo com cutoff de 180 dias apagando registros antigos e preservando recentes.
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (92/92 rotas Next.js geradas com sucesso).


## Definition of Done
- Todas as verificações e scripts executados com sucesso.
- Zero erros de lint ou tipagem.
- Documentação e evidências atualizadas.
