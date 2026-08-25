# Task 188. Customer Billing Portal

## Status
TODO

## Objetivo

Criar área de plano/cobrança para usuários do Workspace.

## Tela

```text
Configurações
└── Plano e cobrança
```

## Mostrar

- plano.
- mensal/anual.
- valor contratado.
- desconto anual snapshot.
- forma.
- status.
- nextDueDate.
- currentPeriodEnd.
- cancelAtPeriodEnd.
- grace state.
- dados cadastrais.
- pagamentos.

## Contratação

Tela de Planos:
- toggle Mensal/Anual.
- preço.
- economia.
- selecionar método disponível.
- iniciar checkout/subscription.

## Pagamentos

Tabela:
- vencimento.
- valor.
- meio.
- status.
- confirmado em.
- opção "Ver cobrança" quando segura.

## Ações

- atualizar dados cadastrais.
- cancelar renovação.
- reativar.
- alterar plano para próximo ciclo.

## UX callback

Após retorno do Asaas:
`Aguardando confirmação`, não `Pago`.

## Definition of Done

- [ ] plans monthly/yearly.
- [ ] annual savings.
- [ ] checkout flow.
- [ ] billing profile.
- [ ] current subscription.
- [ ] payment history.
- [ ] cancel.
- [ ] reactivate.
- [ ] pending plan change.
- [ ] tenant isolation.
- [ ] responsive.
- [ ] TypeScript/Lint/Tests PASS.

## Evidence

Fluxos de usuário documentados.
