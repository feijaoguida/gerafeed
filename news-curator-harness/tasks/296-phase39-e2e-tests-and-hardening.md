# Task 296: Testes E2E Automatizados da Phase 39, Auditoria de Logs de Erro e Build

## Status
DONE

## Evidência de Conclusão
- `scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`: Suíte de testes E2E executada com 100% de sucesso validando:
  - **Cenário 1**: Cadastro de cupons no Backoffice (`INFLUENCER19` FIXED_PRICE R$ 19,90 por 3 meses para Cliente Novo; `BASE50FOREVER` PERCENTAGE 50% vitalício para múltiplos planos e Cliente Base).
  - **Cenário 2**: Validação de cupom no cadastro de Cliente Novo e rejeição de cupom exclusivo de Cliente Base com gravação em `SystemErrorLog` (`module: "BILLING"`).
  - **Cenário 3**: Ciclo de vida promocional automatizado no Asaas: 3 faturas pagas a R$ 19,90, e ao atingir a 3ª fatura, transição automática e idempotente para o valor original de R$ 89,90 (`updatePendingPayments: true`), marcação de `CouponRedemption` como `COMPLETED` e gravação de `DISCOUNT_ENDED` em `PlanHistory`.
  - **Cenário 4**: Aplicação de cupom em Plano & Cobrança para Cliente Base, atualização da assinatura no Asaas com `updatePendingPayments: true`, persistência na `Subscription` e registro `COUPON_APPLIED` no histórico de planos.
  - **Cenário 5**: Histórico perpétuo e Trava Anti-Fraude de Sites em múltiplas contas: 1ª conta OK (`ALLOWED`), 2ª conta OK (`ALLOWED`), 3ª conta bloqueada (`BLOCKED`, HTTP 403) com alerta de suporte e registro em `SystemErrorLog` (`module: "WORDPRESS"`), e posterior desbloqueio administrativo via `clearDomainForWorkspace`.
- `npx tsx scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`: PASS (todos os 5 cenários validados).
- `npx tsc --noEmit`: PASS (0 erros).
- `npm run lint`: PASS (0 erros).
- `npm run build`: PASS (107/107 páginas compiladas com Turbopack em produção).

## Critérios de Aceitação (Definition of Done)
- [x] `npx tsx scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`: PASS em todos os 5 cenários.
- [x] `npx tsc --noEmit`: PASS (0 erros).
- [x] `npm run lint`: PASS (0 erros).
- [x] `npm run build`: PASS.
- [x] Evidências objetivas registradas em `PROGRESS.md` e nas tasks `290` a `296`.

## Escopo de Implementação

### 1. Script Automatizado de Testes E2E (`scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`)
Criar script executável via `npx tsx scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts` validando com asserções estritas:
1. **Cenário 1 — Cadastro de Cupom no Backoffice (Múltiplos Planos, Valor Fixo / Percentual, Tempo e Tipo de Cliente)**:
   - Criação de cupom `INFLUENCER19` para o Plano Influencer (`monthlyPrice = 89.90`), `discountType = "FIXED_PRICE"`, `discountValue = 19.90`, `durationMonths = 3` (3 primeiros meses), `customerType = "NEW"`.
   - Criação de cupom `BASE50FOREVER` para múltiplos planos (`Influencer` e `Pro`), `discountType = "PERCENTAGE"`, `discountValue = 50`, `durationMonths = 0` (Para Sempre), `customerType = "BASE"`.
2. **Cenário 2 — Validação de Cupom na Criação de Conta (Cliente Novo) e Rejeições com `SystemErrorLog`**:
   - Validação de `INFLUENCER19` para Cliente Novo no Plano Influencer → Sucesso (`discountedAmount = 19.90`, `originalAmount = 89.90`, `durationMonths = 3`).
   - Tentativa de Cliente Novo usar `BASE50FOREVER` (exclusivo Cliente Base) → Rejeitado (`403`) + verificação de que um registro foi criado em `SystemErrorLog` (`module = "BILLING"`).
   - Tentativa de usar cupom em plano não vinculado ou cupom expirado/inativo → Rejeitado (`400`) + verificação de registro em `SystemErrorLog`.
3. **Cenário 3 — Contratação no Asaas e Ciclo Promocional Automático (3 Primeiros Meses R$ 19,90 → 4º Mês R$ 89,90)**:
   - Assinatura criada com `INFLUENCER19`: valor inicial enviado ao gateway = `R$ 19,90`.
   - Simulação da 1ª cobrança confirmada (`PAYMENT_CONFIRMED` #1): `discountCyclesUsed = 1`, valor na assinatura permanece `R$ 19,90`.
   - Simulação da 2ª cobrança confirmada (`PAYMENT_CONFIRMED` #2): `discountCyclesUsed = 2`, valor na assinatura permanece `R$ 19,90`.
   - Simulação da 3ª cobrança confirmada (`PAYMENT_CONFIRMED` #3): `discountCyclesUsed = 3` (atingiu `discountDurationMonths = 3`!) → O sistema dispara automaticamente `updateSubscription` (`PUT /v3/subscriptions/{id}` com `value: 89.90, updatePendingPayments: true`), atualiza `Subscription.amount = 89.90`, marca `CouponRedemption.status = "COMPLETED"` e grava `DISCOUNT_ENDED` em `PlanHistory`.
4. **Cenário 4 — Aplicação de Cupom em Plano & Cobrança para Cliente Base e Histórico de Planos**:
   - Cliente Base com assinatura ativa aplica `BASE50FOREVER`: valida plano e `customerType = "BASE"`, atualiza assinatura no Asaas com `updatePendingPayments: true`, grava em `PlanHistory` e mantém desconto vitalício (`durationMonths = 0`).
   - Verificação da linha do tempo completa em `PlanHistory`.
5. **Cenário 5 — Histórico e Anti-Fraude de Cadastro de Sites (1ª Vez OK, 2ª Vez OK, 3ª Vez Bloqueada + Alerta de Suporte + `SystemErrorLog`)**:
   - Conta 1 (`email1` / `workspace1`) cadastra `https://www.sitedoemail1.com.br` → **1ª vez OK (`ALLOWED`)**.
   - Conta 1 exclui o site e cancela a assinatura.
   - Conta 2 (`email2` / `workspace2`) cadastra `http://sitedoemail1.com.br/wp-json` → **2ª vez OK (`ALLOWED`)** (reconhece o mesmo domínio normalizado `sitedoemail1.com.br`).
   - Conta 3 (`email3` / `workspace3`) tenta cadastrar `https://sitedoemail1.com.br/` → **3ª vez BLOQUEADA (`BLOCKED`, HTTP 403)** com mensagem de alerta pedindo para procurar o suporte, impedindo a criação do site e gerando log obrigatório em `SystemErrorLog` (`module = "WORDPRESS"`).
   - SuperAdmin executa liberação de suporte e permite novo cadastro quando autorizado.
6. Limpeza automática (cleanup) de todos os dados de teste criados no banco ao final da execução.

### 2. Validação Técnica, Segurança e Atualização do Harness
1. Executar `npx tsx scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`.
2. Executar `npx tsc --noEmit` (0 erros).
3. Executar `npm run lint` (0 erros).
4. Executar `npm run build` (build de produção Next.js completo).
5. Atualizar `news-curator-harness/PROGRESS.md`, `news-curator-harness/SPEC.md` e tasks `290`–`296` com status `DONE` e evidências verificáveis.

## Critérios de Aceitação (Definition of Done)
- [ ] `npx tsx scripts/phase39/test-coupons-history-and-site-antifraud-e2e.ts`: PASS em todos os 5 cenários.
- [ ] `npx tsc --noEmit`: PASS (0 erros).
- [ ] `npm run lint`: PASS (0 erros).
- [ ] `npm run build`: PASS.
- [ ] Evidências objetivas registradas em `PROGRESS.md` e nas tasks `290` a `296`.

