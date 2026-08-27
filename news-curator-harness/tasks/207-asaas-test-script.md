# Task 207: Teste de Integração E2E no Sandbox

## Descrição
Escrever um script simples no pacote `scripts` para confirmar o fluxo do Asaas 100% de ponta-a-ponta batendo na API sandbox real.

## Arquivos a alterar
- `scripts/test-billing-e2e.ts` (NEW)

## Critérios de Aceite
1. Criar o script test-billing-e2e.ts rodando um fluxo de teste sem o Next.js, diretamente nas bibliotecas internas.
2. Passo a passo: cria (ou encontra) customer, gera assinatura para ele (com `billingType: "BOLETO"`), busca cobranças da assinatura via `GET`, retira `invoiceUrl` e exibe na tela no formato console.log.
3. Executar o script no Sandbox e constatar URL válida na saída.
4. Passar TS.
