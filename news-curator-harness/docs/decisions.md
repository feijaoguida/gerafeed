# Architectural Decisions

## Histórico

As decisões anteriores (ADR-010 em diante) permanecem válidas, salvo quando explicitamente substituídas por uma decisão posterior.

## ADR-022. WordPressSite como entidade própria
Status: Accepted

Um Workspace pode possuir múltiplos sites WordPress. Não representar isso somente por JSON em `Configuration`.

`WordPressSite` será entidade de domínio com credenciais criptografadas.

Motivo:
- múltiplos destinos;
- estado independente;
- categorias por destino;
- associação de feeds;
- histórico e auditoria.

## ADR-023. Source global no Workspace
Status: Accepted

Feed/RSS continua sendo uma entidade do Workspace e não uma propriedade exclusiva de um WordPressSite.

Um mesmo Feed pode alimentar vários sites.

## ADR-024. Relação N:N Feed ↔ WordPress
Status: Accepted

Criar uma entidade de associação, como `WordPressSiteSource`.

Ela armazena o vínculo e permite override de prompt específico do destino.

Motivo: o mesmo feed pode ser adaptado para diferentes portais.

## ADR-025. Hierarquia de Prompt
Status: Accepted

A resolução final usa:

```text
Feed ↔ WordPress override
→ Feed default
→ WordPress default
→ Workspace default
```

A resolução fica em serviço/função central.

## ADR-026. Article pertence a um destino editorial
Status: Accepted

Quando um artigo tem destino definido, `Article.wordpressSiteId` registra o WordPress para o qual foi preparado.

Motivos:
- filtro;
- prompt correto;
- publicação;
- auditoria.

## ADR-027. Backoffice como segunda área da mesma aplicação
Status: Accepted

Backoffice utiliza o mesmo Next.js e banco, mas possui layout, rotas e autorização próprios.

Não criar segundo aplicativo para o MVP.

## ADR-028. SuperAdmin global
Status: Accepted

`User.isSuperAdmin` autoriza Backoffice.

`WorkspaceUser.role` não concede acesso ao Backoffice.

## ADR-029. Empresa é Workspace
Status: Accepted

No Backoffice, o conceito apresentado ao operador é “Empresa”, mas o registro de domínio continua sendo `Workspace`.

Não criar `Company` duplicada sem necessidade.

## ADR-030. Feature e PlanFeature
Status: Accepted

Planos são configurados através de Features associadas por `PlanFeature`, permitindo `enabled` e `limit` quando aplicável.

O cálculo real de uso/limite deve permanecer no BillingService.

## ADR-031. Seed SuperAdmin por environment
Status: Accepted

Seed utiliza `SUPERADMIN_EMAIL` e `SUPERADMIN_PASSWORD`.

Não hardcodar credenciais.

## ADR-032. Secrets nunca são expostos ao SuperAdmin
Status: Accepted

Mesmo SuperAdmin não recebe Application Password/API Keys descriptografadas. O Backoffice permite substituir secrets, não visualizá-los.
