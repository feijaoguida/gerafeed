# AGENTS.md. News Curator

## Missão
Você é um agente de desenvolvimento trabalhando no News Curator. O projeto é um monólito Next.js simples para coleta manual de notícias RSS, processamento com IA, revisão humana e publicação em WordPress.

## Antes de qualquer alteração
1. Leia `SPEC.md`.
2. Leia `MEMORY.md`.
3. Leia `PROGRESS.md`.
4. Identifique a única task `IN_PROGRESS`. Se não existir, escolha a primeira task `TODO`.
5. Leia o arquivo da task antes de implementar.

## Regras
- Trabalhe em uma task por vez.
- Implemente somente o escopo da task atual.
- Não adicione infraestrutura não prevista.
- Não use NestJS, Redis, RabbitMQ, BullMQ, Docker, Cron ou microserviços no MVP.
- Preserve TypeScript estrito.
- Secrets nunca podem chegar ao client.
- Prefira a solução mais simples que satisfaça os requisitos.
- Não declare uma task como concluída sem executar sua Definition of Done.
- Registre evidências objetivas ao terminar.
- Se surgir trabalho fora do escopo, registre em `Discovered Work` em vez de implementá-lo automaticamente.
- Decisões arquiteturais permanentes devem ser registradas em `docs/decisions.md`.
- Atualize `PROGRESS.md` após cada task.
- Atualize `MEMORY.md` somente quando surgir conhecimento permanente.

## Definition of Done
Uma task só pode virar `DONE` quando:
- todos os critérios da task forem atendidos;
- TypeScript passar;
- lint passar;
- testes aplicáveis passarem;
- integração aplicável tiver sido validada;
- evidências forem registradas.

## Evidência
Use fatos verificáveis. Exemplo:
- `src/lib/rss.ts` criado.
- Feed real processado com sucesso.
- 5 itens retornados.
- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.

Não escreva apenas “funcionando”.

## Falhas
Se não for possível concluir:
- mantenha a task `IN_PROGRESS` ou marque `BLOCKED`;
- registre o erro;
- registre o que foi tentado;
- registre a próxima ação.

Nunca remova um critério para fazer uma task parecer concluída.
