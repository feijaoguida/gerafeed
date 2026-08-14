# Architectural Decisions

## ADR-010. Estratégia de Modificação de Imagens
Status: Accepted

### Contexto
O usuário precisa de imagens para as notícias, mas a cópia exata de imagens de terceiros pode gerar problemas de duplicidade ou copyright. Foi solicitado o uso da imagem original com modificações (via IA ou simples, como inversão).

### Decisão
O sistema oferecerá uma estratégia configurável. Para modificações "sutis" e "inversão", implementaremos inicialmente um processamento programático usando a biblioteca `sharp` (Node.js). Ela permite espelhar horizontalmente (flop), alterar brilho/saturação e aplicar filtros de forma rápida, barata e determinística. Integrações com IA gerativa de imagem (DALL-E 3) poderão ser acopladas posteriomente na mesma interface de pipeline, mas o `sharp` resolve o MVP de alteração sutil eficientemente.

### Consequência
O backend precisará baixar a imagem original, processá-la via buffer com `sharp`, salvá-la temporariamente (ou em cloud storage/diretório public) e disponibilizar a URL para aprovação.

## ADR-011. Atribuição de Fonte
Status: Accepted

### Contexto
Todo artigo gerado deve informar a fonte original.

### Decisão
Um campo `creditName` será adicionado ao modelo `Source`. Durante a montagem do payload para publicação no WordPress, o backend anexará o texto de crédito no final do HTML gerado.

### Consequência
O fluxo do editor não precisa que a IA gere o crédito no corpo do texto. O crédito é anexado de forma programática na etapa de `Aprovar e Publicar`, garantindo que não seja perdido caso a IA se perca no prompt.

Architectural Decisions
##ADR-020. Multi-tenant via Workspace (Tenant-per-row)
Status: Accepted

## Contexto
O sistema precisa suportar múltiplos clientes isolados.

## Decisão
Usaremos o modelo Pool (Tenant-per-row). Todas as tabelas de domínio (`Source`, `Article`, `Configuration`) receberão uma Foreign Key `workspaceId`. O ID do workspace será recuperado da sessão ativa do usuário.

## Consequência
Toda e qualquer query no Prisma deverá obrigatoriamente incluir `where: { workspaceId }`. Esquecer disso resulta em vazamento de dados.

## ADR-021. Abstração do Gateway de Pagamento
Status: Accepted

## Contexto
O usuário solicitou Asaas agora, mas preparação para Stripe no futuro.

## Decisão
Criaremos uma interface `PaymentGateway` com os métodos essenciais (`createCustomer`, `createSubscription`, `cancelSubscription`, `handleWebhook`). A injeção de dependência/factory definirá qual implementação usar com base em variáveis de ambiente (ex: `PAYMENT_GATEWAY=asaas`).

## Consequência
O código de negócio (checkout, upgrade) lidará apenas com a interface. Trocar para o Stripe futuramente exigirá apenas implementar a classe `StripeGateway`, sem refatorar o frontend ou a lógica de negócio principal.
