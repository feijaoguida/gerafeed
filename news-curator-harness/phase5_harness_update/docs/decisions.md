# Architectural Decisions

## ADR-020. Multi-tenant via Workspace (Tenant-per-row)
Status: Accepted

### Contexto
O sistema precisa suportar múltiplos clientes isolados.

### Decisão
Usaremos o modelo *Pool* (Tenant-per-row). Todas as tabelas de domínio (`Source`, `Article`, `Configuration`) receberão uma Foreign Key `workspaceId`. O ID do workspace será recuperado da sessão ativa do usuário.

### Consequência
Toda e qualquer query no Prisma deverá obrigatoriamente incluir `where: { workspaceId }`. Esquecer disso resulta em vazamento de dados. 

## ADR-021. Abstração do Gateway de Pagamento
Status: Accepted

### Contexto
O usuário solicitou Asaas agora, mas preparação para Stripe no futuro.

### Decisão
Criaremos uma interface `PaymentGateway` com os métodos essenciais (`createCustomer`, `createSubscription`, `cancelSubscription`, `handleWebhook`). A injeção de dependência/factory definirá qual implementação usar com base em variáveis de ambiente (ex: `PAYMENT_GATEWAY=asaas`).

### Consequência
O código de negócio (checkout, upgrade) lidará apenas com a interface. Trocar para o Stripe futuramente exigirá apenas implementar a classe `StripeGateway`, sem refatorar o frontend ou a lógica de negócio principal.
