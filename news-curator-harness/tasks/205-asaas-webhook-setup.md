# Task 205: Configurar e Validar Webhook Asaas

## Descrição
O painel do Asaas (Sandbox e Produção) deve ter o webhook ativado. A API local precisa lidar com resiliência, logar eventos adequadamente e fazer conciliação via ID da Subscription com renovação e inativação certas.

## Arquivos a alterar
- `src/app/api/webhooks/asaas/route.ts`

## Critérios de Aceite
1. Melhorar a resolução de assinaturas local em `POST /api/webhooks/asaas`. Buscar usando o campo `subscription` (ID do Asaas) do payload ou fallback `workspaceId` vindo de externalReference.
2. Adicionar tratamento para ciclo anual: quando o `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` bater, atualizar a vigência para `+365 dias` se o plano da assinatura for anual (`YEARLY`), ou `+30 dias` se for mensal (`MONTHLY`).
3. Tratar `PAYMENT_CREATED` fazendo log da intenção, sem ativar a assinatura ainda.
4. Incluir logs robustos que ajudem em diagnóstico.
5. Prover instruções no arquivo para ativar a notificação no painel do Asaas para Sandbox e Prod (Eventos: `PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_DELETED`).
6. Passar testes: `npx tsc --noEmit` e `npm run lint`.
