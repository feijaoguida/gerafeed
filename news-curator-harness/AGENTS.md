# AGENTS.md. News Curator

## Fonte de verdade

O repositório é a fonte de verdade. Antes de alterar código:

1. Leia `AGENTS.md`.
2. Leia `SPEC.md`.
3. Leia `MEMORY.md`.
4. Leia `PROGRESS.md`.
5. Leia a task atual.
6. Leia `docs/decisions.md` quando houver mudança arquitetural.
7. Inspecione a implementação atual antes de criar ou alterar abstrações.

## Harness

Uma task por vez.

Fluxo obrigatório:

```text
Contexto
→ Task
→ Implementação
→ Definition of Done
→ Validation
→ Evidence
→ PROGRESS
→ MEMORY/decisions quando necessário
```

Não declarar uma task como DONE apenas porque o código compila.

## Multi-tenant

Todas as entidades de domínio pertencem a um Workspace quando aplicável.

Toda query deve validar `workspaceId`.

Nunca confiar em um ID enviado pelo client sem confirmar que o recurso pertence ao Workspace autorizado.

No Backoffice, o SuperAdmin pode selecionar outro Workspace, mas essa seleção precisa ser explícita e validada no servidor.

## WordPress

Na nova arquitetura, WordPress configurado pelo usuário é uma entidade `WordPressSite`.

Não tratar a antiga chave `wordpressConnection` como único site depois da migração.

Application Password continua criptografada.

## Feeds

`Source` é global ao Workspace.

A relação com WordPress é N:N através da entidade de associação.

Nunca copiar o mesmo Feed para tabelas diferentes apenas para criar associação.

## Prompt

A resolução de prompt deve ficar centralizada em um serviço/função.

Precedência definida pela SPEC:

```text
Feed ↔ WordPress override
→ Feed default
→ WordPress default
→ Workspace default
```

Não duplicar essa regra no frontend.

## Backoffice

A área `/backoffice` é independente da UI funcional, mas usa o mesmo domínio.

Somente `User.isSuperAdmin === true` pode acessar.

Não confiar apenas em middleware/client-side para proteger dados. APIs e Server Actions também devem verificar SuperAdmin.

## Secrets

Nunca retornar API keys, Application Passwords ou outros secrets descriptografados, mesmo para SuperAdmin.

Para trocar um secret, aceitar uma nova credencial e criptografar server-side.

## Planos e Features

Reutilizar BillingService e modelos existentes sempre que possível.

Não duplicar cálculo de limites no Backoffice.

## Definition of Done

Todos os critérios da task devem ser atendidos.

Obrigatório quando aplicável:
- TypeScript PASS
- Lint PASS
- testes PASS
- Build PASS
- validação de autorização
- evidências registradas

## Discovered Work

Se surgir algo fora da task:

```text
## Discovered Work
Descrição:
Motivo:
Impacto:
```

Não implementar automaticamente.
