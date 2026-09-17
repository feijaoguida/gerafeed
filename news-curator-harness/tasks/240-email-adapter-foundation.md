# Task 240. Email Adapter Foundation (Resend, SMTP e Mock)

## Contexto
O GeraFeed necessita enviar e-mails transacionais (como códigos de confirmação de cadastro OTP). Para evitar acoplamento a um provedor único e permitir flexibilidade operacional (ADR-085), implementaremos uma camada de abstração de e-mail baseada em Adapter Pattern.

O sistema deve suportar nativamente:
1. **Resend**: via SDK oficial (`resend`), aproveitando a cota gratuita de 100 e-mails/dia (3.000/mês).
2. **SMTP**: via biblioteca `nodemailer`, permitindo conexão com servidores SMTP convencionais.
3. **Mock**: para ambientes de desenvolvimento ou testes locais, exibindo os dados do e-mail no console sem requisições de rede.

A seleção do provedor ativo será definida pela variável de ambiente `EMAIL_PROVIDER="resend" | "smtp" | "mock"`.
A arquitetura deve possibilitar adicionar futuros provedores (ex: Mailgun) apenas criando uma nova classe implementando o contrato `EmailAdapter`.

## Objetivo
1. Definir os tipos e interfaces do serviço de e-mail em `src/lib/mail/types.ts`.
2. Implementar `ResendAdapter`, `SmtpAdapter` e `MockAdapter`.
3. Implementar a factory `getMailAdapter()` em `src/lib/mail/index.ts`.
4. Documentar as novas variáveis de ambiente em `.env.example`.
5. Garantir que nenhuma chave secreta seja exposta ao client ou em logs indevidos.

## Antes de implementar
- Inspecione `package.json` para verificar versões de dependências existentes.
- Inspecione `.env.example` para mapear variáveis de ambiente padronizadas.
- Não acoplar chamadas de e-mail diretamente a rotas da aplicação nesta task (isso será feito nas tasks subsequentes).

## Implementação

### 1. Dependências
- Adicionar ao `package.json`:
  - `resend` (SDK oficial do Resend)
  - `nodemailer` e `@types/nodemailer`
- Instalar via npm e validar a compilação.

### 2. Interfaces (`src/lib/mail/types.ts`)
Definir:
```ts
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "smtp" | "mock";
  error?: string;
}

export interface EmailAdapter {
  readonly provider: "resend" | "smtp" | "mock";
  sendMail(options: EmailOptions): Promise<SendMailResult>;
}
```

### 3. Adapters em `src/lib/mail/adapters/`
- **`mock-adapter.ts`**:
  - Imprime no terminal o remetente, destinatário, assunto e corpo resumido em formatação legível quando executado em desenvolvimento. Retorna `{ success: true, provider: "mock", messageId: "mock-..." }`.
- **`resend-adapter.ts`**:
  - Instancia `Resend` usando `process.env.RESEND_API_KEY`.
  - Se a chave não estiver configurada, lança erro ou retorna falha estruturada informativa.
  - Utiliza `EMAIL_FROM` padrão (ex: `GeraFeed <nao-responda@gerafeed.com.br>`) caso `from` não seja especificado.
- **`smtp-adapter.ts`**:
  - Cria transporter com `nodemailer.createTransport({ host, port, secure, auth: { user, pass } })`.
  - Envia via `transporter.sendMail()`.

### 4. Factory e Ponto de Entrada (`src/lib/mail/index.ts`)
- Ler `process.env.EMAIL_PROVIDER` (defaults para `"mock"` se não configurado ou em dev sem credenciais).
- Exportar função singleton ou factory `getMailAdapter(): EmailAdapter`.
- Exportar helper de alto nível `sendEmail(options: EmailOptions): Promise<SendMailResult>`.

### 5. Configuração no `.env.example`
Adicionar bloco explicativo:
```bash
# Provedor de E-mail: "resend" | "smtp" | "mock"
EMAIL_PROVIDER="mock"

# Configuração Resend (quando EMAIL_PROVIDER="resend")
RESEND_API_KEY="re_..."

# Configuração SMTP (quando EMAIL_PROVIDER="smtp")
SMTP_HOST="smtp.exemplo.com"
SMTP_PORT="587"
SMTP_USER="usuario@exemplo.com"
SMTP_PASS="senha_aqui"
SMTP_SECURE="false"

# Remetente padrão
EMAIL_FROM="GeraFeed <nao-responda@gerafeed.com.br>"
```

## Definition of Done
- [ ] `src/lib/mail/types.ts` criado com tipagem estrita.
- [ ] `ResendAdapter`, `SmtpAdapter` e `MockAdapter` implementados e tratando erros de conexão.
- [ ] `getMailAdapter()` retornando o adapter de acordo com `EMAIL_PROVIDER`.
- [ ] Teste unitário/script de validação demonstrando o funcionamento do MockAdapter e a alternância de provedores.
- [ ] `.env.example` atualizado com todas as variáveis necessárias.
- [ ] TypeScript PASS (`npx tsc --noEmit`).
- [ ] Lint PASS (`npm run lint`).
- [ ] Evidência registrada em `PROGRESS.md`.
