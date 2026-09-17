# Task 246. Acquisition Funnel Hardening & E2E Validation

## Contexto
Com as Tasks 240 a 245 concluídas, o novo fluxo de ponta a ponta (Home → Seleção de Plano → Cadastro → Verificação de E-mail OTP → Criação com Senha Criptografada → Bifurcação Free vs Pago → Faturamento e Checkout Asaas) estará implementado.
Esta task tem como objetivo executar a validação rigorosa, testes automatizados, auditoria de segurança (PII, tokens, credenciais) e garantir a entrega sem regressões.

## Objetivo
1. Criar script automatizado de validação E2E (`scripts/validate-phase29.ts`) cobrindo:
   - Alternância e funcionamento dos Adapters de E-mail (Resend, SMTP, Mock).
   - Validação de expiração e conferência de códigos OTP (`VerificationToken`).
   - Criptografia de senhas com SALT (`bcryptjs`) e rejeição de senhas inválidas no Auth.js.
   - Validação dos payloads de checkout e persistência do `BillingProfile`.
2. Verificar que nenhuma informação pessoal identificável (PII), token de verificação ou segredo do Asaas vaze em logs, URLs ou eventos de analytics.
3. Executar o fluxo completo de cadastro gratuito e validar chegada no `/dashboard`.
4. Executar o fluxo de plano pago e validar geração de `checkoutUrl` e redirecionamento.
5. Executar os gates formais de qualidade: TypeScript, ESLint e Build de produção.
6. Atualizar a documentação, fechar a Phase 29 e registrar as evidências finais em `PROGRESS.md`.

## Antes de implementar
- Inspecione os scripts existentes em `scripts/` (ex: `scripts/test-blog.ts`, `scripts/validate-phase28.ts`).
- Inspecione `news-curator-harness/PROGRESS.md`.

## Implementação

### 1. Script de Validação Automatizada (`scripts/validate-phase29.ts`)
Implementar testes automatizados para:
1. **Email Adapter**:
   - Chamar `getMailAdapter()` com `EMAIL_PROVIDER="mock"`.
   - Disparar `sendEmail` e confirmar retorno com `success: true` e `provider: "mock"`.
2. **OTP Generation & Verification**:
   - Gerar OTP de 6 dígitos.
   - Simular inserção no `VerificationToken`.
   - Validar que código correto é aceito.
   - Validar que código incorreto ou expirado é rejeitado com mensagem descritiva.
3. **Password Hashing & Salt**:
   - Gerar hash de senha via `hashPassword`.
   - Confirmar que `verifyPassword` passa com a senha correta e falha com senha errada.
   - Confirmar que o hash gerado possui padrão bcrypt (`$2a$` ou `$2b$`).
4. **Billing & Customer Sync Contract**:
   - Validar validador de CPF e CNPJ (casos válidos e inválidos).
   - Validar cálculo de montante do plano e formato da sessão de checkout.

### 2. Auditoria de Segurança
- Confirmar que `passwordHash` nunca é retornado em respostas JSON para o cliente.
- Confirmar que tokens OTP não são logados em texto aberto em produção.
- Confirmar que `NEXT_PUBLIC_*` não expõe segredos de e-mail ou do gateway Asaas.

### 3. Execução dos Comandos de Validação
```bash
npx tsx scripts/validate-phase29.ts
npx tsc --noEmit
npm run lint
npm run build
```

### 4. Finalização
- Registrar as evidências factuais em `PROGRESS.md`.
- Marcar todas as tasks da Phase 29 como concluídas `[x]`.

## Definition of Done
- [ ] Script `scripts/validate-phase29.ts` executado com 100% de sucesso.
- [ ] Fluxo gratuito e fluxo pago testados e validados.
- [ ] Auditoria de segurança aprovada (sem vazamento de senhas ou PII).
- [ ] `npx tsc --noEmit`: PASS.
- [ ] `npm run lint`: PASS (0 erros).
- [ ] `npm run build`: PASS (todas as rotas compiladas).
- [ ] Evidências completas registradas em `PROGRESS.md`.
