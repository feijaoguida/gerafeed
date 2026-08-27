# Task 202: Fix Billing Checkout Flow and Asaas Hosted URL

## Origem
Resolução de problemas de UX relatados no fluxo de checkout. Quando o cliente tentava assinar um plano pago:
1. Sem dados cadastrais, era redirecionado sem contexto.
2. A criação do checkout Asaas (geração da URL de pagamento) falhava silenciosamente porque não enviava o valor e o ciclo para o link.
3. O frontend fazia fallback enganoso para a página "Solicitação de pagamento realizada" (`?checkout=success`), impossibilitando o cliente de selecionar método de pagamento (PIX, Cartão ou Boleto).
4. Faltavam botões claros para Upgrades em `/settings/billing`.

## Contexto
O Asaas suporta a criação direta de faturas para assinaturas (método preferido para controle do ciclo de vida no SaaS). Ao criar a `Subscription` na API do Asaas com o `customerId`, o valor correto e o `billingType` `"UNDEFINED"`, o Asaas imediatamente gera a primeira fatura, cuja `invoiceUrl` contém a página de checkout oficial do Asaas. Essa página oferece as opções de Pix, Cartão e Boleto de forma segura. O GeraFeed deve obter essa `invoiceUrl` e direcionar o cliente para ela de forma garantida, exibindo erros claros caso a geração da fatura falhe, jamais engolindo exceções de checkout.

## Requisitos

### 1. `src/lib/payments/types.ts`
- Modificar `CheckoutParams` para aceitar `planId` (opcional), `planName` (opcional), `amount` (número, opcional), `cycle` (`BillingCycle`, opcional), e `customerId` (opcional).

### 2. `src/lib/payments/asaas.ts`
- Atualizar a função `createSubscription(params)`:
  - Definir `billingType: "UNDEFINED"` (para abrir a fatura com todas as opções de pagamento nativas).
  - Após receber a criação de assinatura do Asaas (que pode não ter o link na resposta imediata dependendo da versão), fazer uma requisição subsequente: `GET /v3/subscriptions/{subscriptionId}/payments`.
  - Capturar o `invoiceUrl` do primeiro pagamento e retornar em `paymentUrl` (e `invoiceUrl`).
- Atualizar a função `getCheckoutUrl(params)`:
  - Se `params.customerId` e `params.amount` forem válidos, priorizar a chamada para `createSubscription` usando os parâmetros, e usar o `paymentUrl` (a `invoiceUrl` da fatura Asaas) como `checkoutUrl`.
  - Como fallback ou criação via `paymentLinks`, garantir que `value: params.amount` e `subscriptionCycle: params.cycle` sejam preenchidos no payload.
  - Lançar exceção se a API do Asaas não retornar o link válido.

### 3. `src/app/api/billing/checkout/route.ts`
- Alterar o payload enviado para `gateway.getCheckoutUrl(...)`: passar `planId`, `planName`, `amount`, `cycle` e `customerId`.
- Incluir uma verificação forte: `if (!checkoutUrl) throw new Error("O gateway de pagamento não retornou a URL da fatura de checkout.");` impedindo que a rota devolva `{ checkoutUrl: "" }` e crie a falsa ilusão de sucesso.

### 4. `src/app/(app)/settings/billing/upgrade/page.tsx`
- Ao receber o código `BILLING_PROFILE_REQUIRED` na resposta:
  - Redirecionar via router.push para `/settings/billing?redirect=upgrade&planId=${plan.id}&cycle=${cycle}&planName=${encodeURIComponent(plan.name)}`
- Após processar o retorno de checkout de planos pagos (`!data.isFree`):
  - Validar a presença de `data.checkoutUrl`. Se falhar (ex: undefined ou vazio), jogar um erro explícito na tela usando `throw new Error(...)` para ser exibido no `errorMessage`.
  - NUNCA executar `router.push('/settings/billing?checkout=success')` em caso de falha de `checkoutUrl`! O redirecionamento local só deve ocorrer para planos gratuitos.
- Suportar auto-disparo de checkout: Checar no useEffect se a URL contém `autoCheckout=1`, `planId` e `cycle`. Se sim, inicializar o processo de seleção do plano automaticamente e limpar os query params via router.replace.

### 5. `src/app/(app)/settings/billing/page.tsx`
- No bloco visual do "Plano Ativo do Workspace" (próximo do `plan.name` e status):
  - Adicionar um link/botão para "Alterar Plano / Fazer Upgrade" apontando para `/settings/billing/upgrade`.
- Mensagem condicional de Dados Cadastrais:
  - Se `redirect === "upgrade"` e `planName` estiver presente: exibir um alert contextual e chamativo informando: `"Atenção: Preencha ou confirme seus dados de cobrança abaixo para continuar com a contratação do plano [Nome do Plano]."`.

### 6. `src/components/settings/billing-profile-form.tsx`
- Ler query params (se possível, ou passados por props) de `redirect`, `planId`, `cycle` e `planName` via `useSearchParams()`.
- Após salvar os dados com sucesso, exibir, de forma adjacente ao banner de sucesso, um botão em destaque: `"Continuar Contratação do Plano [Nome]"` com link para `/settings/billing/upgrade?planId=[X]&cycle=[Y]&autoCheckout=1`.

## Entregáveis
- Os tipos e o payload da chamada `AsaasGateway.getCheckoutUrl` estarão enviando corretamente o valor do plano e ciclo.
- A API do Asaas retornará a URL oficial da fatura (`invoiceUrl`), apresentando as 3 formas de pagamento ao cliente de maneira transparente, atrelando a fatura ao cadastro do cliente que já estava sincronizado na plataforma.
- A experiência de usuário fluirá desde a tentativa de compra, requisição de perfil caso ausente, salvamento de perfil, até a continuidade direta para a tela do Asaas sem interrupções e sem páginas de falsos sucessos.

## Definition of Done
- TypeScript passa: `npx tsc --noEmit`
- Lint passa: `npm run lint`
- Os arquivos foram atualizados seguindo a especificação descrita, garantindo um redirecionamento seguro para a interface do Asaas (não aplicável teste real no browser agora, apenas codificação robusta e validada por scripts de testes existentes se houver).
