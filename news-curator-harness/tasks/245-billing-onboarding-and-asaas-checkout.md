# Task 245. Billing Onboarding & Asaas Hosted Checkout Redirection

## Contexto
Quando o usuário escolhe um plano pago na Home Page (ex: Pro), ele conclui o cadastro básico e a confirmação de e-mail na Task 244. Contudo, para emitir a assinatura e fatura no gateway Asaas de forma válida perante a legislação fiscal brasileira e as regras do gateway, são obrigatórios os dados de cobrança do pagador (`BillingProfile`: CPF ou CNPJ válido, Telefone, Endereço completo e CEP) (ADR-089).

Nesta task, criaremos a etapa intermediária de onboarding de faturamento que conecta a criação da conta diretamente à rota de checkout do Asaas (`/api/billing/checkout`), redirecionando o cliente para o checkout oficial do Asaas (com opções de Cartão de Crédito, Pix e Boleto).

## Objetivo
1. Criar o formulário de Faturamento/Cobrança (`BillingStep` ou página dedicada de onboarding `/checkout/billing`) para clientes com intenção de plano pago.
2. Integrar máscaras e validações matemáticas para CPF e CNPJ (rejeitando documentos falsos).
3. Integrar busca de endereço automática por CEP (via serviço ViaCEP ou equivalente sem sobrecarga de dependências).
4. Persistir o `BillingProfile` via API existente `/api/billing/profile`.
5. Acionar a rota `/api/billing/checkout` já implementada e redirecionar imediatamente o usuário para a `checkoutUrl` retornada pelo Asaas.
6. Garantir que caso o usuário decida não pagar naquele momento, o plano permaneça como gratuito/pendente com status transparente.

## Antes de implementar
- Inspecione o modelo `BillingProfile` em `prisma/schema.prisma`.
- Inspecione a rota `/api/billing/profile` e o serviço `src/lib/billing-profile.ts`.
- Inspecione a rota `/api/billing/checkout/route.ts` e o gateway `src/lib/payments/asaas.ts`.
- Inspecione `src/app/(app)/settings/billing/page.tsx` para reaproveitar componentes ou lógicas de formulário fiscal existentes.

## Implementação

### 1. Componente / Tela de Faturamento Onboarding
- Pode ser implementado como o **Passo 3** do fluxo em `register-view.tsx` (quando `plan !== "free"`) ou como rota `/checkout/billing?plan=...`.
- Campos necessários:
  - Nome completo ou Razão Social (já pré-preenchido com o nome do cadastro).
  - CPF ou CNPJ (com máscara dinâmica e validação de dígitos verificadores).
  - Celular / WhatsApp com DDD.
  - CEP (com máscara e auto-preenchimento de Logradouro, Bairro, Cidade e UF).
  - Número e Complemento.

### 2. Validações e Máscaras
- Adicionar validações utilitárias leves em `src/lib/validation/cpf-cnpj.ts`:
  - Validação de formato e dígitos verificadores de CPF e CNPJ.
  - Formatação visual automática conforme a digitação.
- Busca de CEP:
  - Consumir endpoint `https://viacep.com.br/ws/${cleanCep}/json/` com tratamento de erro e preenchimento dos campos correspondentes.

### 3. Chamada da API de Cobrança e Checkout
Ao submeter o formulário:
1. Enviar `POST /api/billing/profile` com os dados fiscais estruturados.
2. Em seguida, disparar `POST /api/billing/checkout` com:
   ```json
   {
     "planSlug": planIntent.slug,
     "cycle": planIntent.cycle || "MONTHLY",
     "billingMethod": "CREDIT_CARD"
   }
   ```
3. A API do checkout:
   - Sincroniza o cliente no Asaas (`gateway.ensureCustomer`).
   - Cria a assinatura no Asaas (`gateway.createSubscription`).
   - Devolve `{ success: true, checkoutUrl: "https://sandbox.asaas.com/..." }`.
4. O frontend limpa a intenção de compra temporária (`clearPlanIntent()`) e executa:
   `window.location.href = checkoutUrl;`

### 4. Tratamento de Erros e Recuperação
- Se o gateway retornar falha (ex: CPF inválido perante a Receita ou Asaas indisponível), apresentar mensagem de erro amigável ao usuário sem perder os dados digitados.
- Permitir botão secundário: *"Decidir depois (Acessar no plano gratuito)"*, que leva o usuário ao `/dashboard` sem bloquear a conta recém-criada.

## Definition of Done
- [ ] Formulário de cobrança solicita todos os dados exigidos pelo Asaas (CPF/CNPJ, Telefone, CEP e Endereço).
- [ ] Validador de CPF e CNPJ bloqueia entradas com números incorretos.
- [ ] Consulta de CEP preenche endereço automaticamente.
- [ ] `BillingProfile` é criado/atualizado com sucesso no banco.
- [ ] `/api/billing/checkout` gera a sessão de cobrança no Asaas e retorna a URL.
- [ ] Redirecionamento para a página oficial de pagamento do Asaas ocorre de forma suave.
- [ ] Opção de continuar no plano gratuito preservada para não prender o usuário.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Evidência registrada em `PROGRESS.md`.
