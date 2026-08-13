# AGENTS.md. News Curator

## Antes de qualquer alteração
1. Leia `SPEC.md`, `MEMORY.md` e `PROGRESS.md`.
2. Leia `docs/decisions.md` quando a task envolver arquitetura.
3. Identifique a única task `IN_PROGRESS`; se não existir, use a primeira `TODO`.
4. Leia a task completa antes de codificar.
5. Inspecione o código existente antes de criar abstrações.

## Regras
- Uma task por vez.
- Não implemente escopo de tasks futuras.
- Preserve o MVP existente.
- Não use NestJS, Redis, RabbitMQ, BullMQ, Docker, Cron ou microserviços no MVP.
- TypeScript estrito.
- Secrets nunca chegam ao client nem aparecem em logs.
- API Keys e Application Passwords persistidas pelo usuário devem ser criptografadas.
- Toda criptografia/descriptografia passa por um helper central.
- Não invente criptografia própria. Prefira AES-256-GCM.
- Não declare DONE sem Definition of Done, validação e Evidence.
- Trabalho fora do escopo deve ser registrado em `Discovered Work`.
- Decisões permanentes vão para `docs/decisions.md`.
- Atualize `PROGRESS.md` após cada task.
- Atualize `MEMORY.md` somente com conhecimento permanente.

## Criptografia
`ENCRYPTION_KEY` é o segredo principal e fica somente no ambiente da aplicação.

Um SALT/contexto pode participar da derivação, mas SALT não é uma segunda chave secreta e não substitui a `ENCRYPTION_KEY`.

Se futuramente houver necessidade de um segundo segredo real, use um `PEPPER` separado e secreto em environment variable.

Use AES-256-GCM ou mecanismo autenticado equivalente, com nonce/IV novo para cada valor. Não use nonce/IV fixo.

## AI Provider
O negócio não pode ficar acoplado a um fornecedor.
Use `AIProvider` + factory/registry.

Providers:
- OpenAI
- Gemini
- Anthropic
- OpenAI Compatible

OpenAI Compatible deve permitir DeepSeek, OpenRouter, Kimi e outros endpoints compatíveis.

## Definition of Done
Uma task só vira DONE quando todos os critérios forem atendidos, TypeScript/lint/testes aplicáveis passarem e Evidence objetiva for registrada.
