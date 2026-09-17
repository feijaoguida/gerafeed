# Task 244. Register Stepper & Inline OTP Verification Flow

## Contexto
O cadastro de novos usuários em `src/app/(public)/register/register-view.tsx` atualmente consiste em um formulário único que cadastra diretamente sem validação de e-mail.
Para atender ao requisito de confirmação de e-mail real via código numérico de 6 dígitos inline (ADR-086) sem que o usuário perca o foco ou precise sair da página, implementaremos um fluxo orientado a passos (Stepper/Wizard) dentro da mesma tela.

## Objetivo
1. Refatorar `register-view.tsx` para operar em 2 etapas primárias:
   - **Passo 1 (Identificação & Envio do Código)**: Nome, E-mail profissional e Aceite dos Termos. Ao submeter, envia o código OTP para o e-mail informado e avança para a digitação do código.
   - **Passo 1.1 (Digitação do Código OTP de 6 Dígitos)**: Campos para inserção do código com auto-avanço, botão de conferência e temporizador de reenvio (60s).
   - **Passo 2 (Criação de Senha e Finalização)**: Campo de senha segura, confirmação e criação do registro no banco com e-mail confirmado.
2. Atualizar o backend `/api/auth/register` para exigir a verificação prévia do token e gravar `emailVerified: new Date()`.
3. Manter a coerência visual e de contraste do Design System GeraFeed em ambos os modos (Light e Dark).

## Antes de implementar
- Inspecione o formulário atual em `src/app/(public)/register/register-view.tsx`.
- Inspecione as APIs `/api/auth/send-verification-code` e `/api/auth/verify-code` criadas na Task 242.
- Inspecione `src/app/api/auth/register/route.ts` atual.

## Implementação

### 1. Estados da Interface no `register-view.tsx`
- Etapas:
  - `step === "email_input"`: Coleta Nome, E-mail e Aceite de Termos. Botão: *"Enviar Código de Confirmação"*.
  - `step === "code_verification"`: Mostra *"Enviamos um código de 6 dígitos para [email]"*. Exibe input com formatação visual para 6 dígitos, botão *"Confirmar Código"* e link *"Reenviar código (em Xs)"*.
  - `step === "password_setup"`: Mostra *"E-mail verificado com sucesso!"* e solicita criar a senha (mínimo de 6 caracteres). Botão: *"Concluir Cadastro"*.

### 2. Fluxo de Validação
1. No envio do `email_input`:
   - Faz `POST /api/auth/send-verification-code` com `{ email }`.
   - Em caso de sucesso, transiciona para `code_verification` e inicia cronômetro de 60 segundos.
2. Na confirmação do `code_verification`:
   - Faz `POST /api/auth/verify-code` com `{ email, code }`.
   - Se validado com sucesso, transiciona para `password_setup`.
3. No submit do `password_setup`:
   - Faz `POST /api/auth/register` com `{ name, email, password, code }`.
   - O backend valida novamente o código no banco antes de criar o usuário, garantindo proteção contra adulterações no frontend.
   - Cria o usuário com `passwordHash` (Task 241) e `emailVerified: new Date()`.
   - Autentica a sessão via `signIn("credentials", { email, password, redirect: false })`.
   - Se o plano selecionado for gratuito: redireciona para `/dashboard`.
   - Se o plano selecionado for pago: em vez de ir ao dashboard, aciona a etapa de faturamento (Task 245).

### 3. Componentes de UI
- Utilizar componentes do Design System: `FormField`, `Input`, `Button`, `Heading2`, `Text`.
- O input de 6 dígitos deve permitir colar o código completo diretamente da área de transferência (Clipboard paste).
- Mensagens claras de erro em caso de código expirado ou incorreto.

## Definition of Done
- [ ] Cadastro dividido em passos claros sem necessidade de refresh ou redirecionamento externo.
- [ ] E-mail é disparado com sucesso no primeiro passo e o código é validado no segundo.
- [ ] Bloqueio de avanço caso o código digitado esteja errado ou expirado.
- [ ] Reenvio de código habilitado apenas após o término do contador de 60 segundos.
- [ ] Usuário é cadastrado no banco com `emailVerified` preenchido e hash de senha gravado.
- [ ] Sessão é iniciada automaticamente após a criação da conta.
- [ ] Design System respeitado em Light e Dark mode.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Evidência registrada em `PROGRESS.md`.
