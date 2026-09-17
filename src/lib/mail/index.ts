import type { EmailAdapter, EmailOptions, SendMailResult } from "./types";
import { MockAdapter } from "./adapters/mock-adapter";
import { ResendAdapter } from "./adapters/resend-adapter";
import { SmtpAdapter } from "./adapters/smtp-adapter";

export * from "./types";
export { MockAdapter } from "./adapters/mock-adapter";
export { ResendAdapter } from "./adapters/resend-adapter";
export { SmtpAdapter } from "./adapters/smtp-adapter";

let cachedAdapter: EmailAdapter | null = null;

/**
 * Retorna o adapter de e-mail ativo com base na variável EMAIL_PROVIDER.
 * Suporta: "resend" | "smtp" | "mock".
 * Se não configurado ou em dev sem credenciais, utiliza MockAdapter.
 */
export function getMailAdapter(): EmailAdapter {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const provider = (process.env.EMAIL_PROVIDER || "mock").trim().toLowerCase();

  switch (provider) {
    case "resend":
      if (!process.env.RESEND_API_KEY) {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          console.warn("[Mail] EMAIL_PROVIDER='resend', mas RESEND_API_KEY não foi informada. Usando SMTP como fallback inicial.");
          cachedAdapter = new SmtpAdapter();
        } else {
          console.warn("[Mail] EMAIL_PROVIDER='resend', mas RESEND_API_KEY não foi informada. Usando MockAdapter.");
          cachedAdapter = new MockAdapter();
        }
      } else {
        cachedAdapter = new ResendAdapter();
      }
      break;

    case "smtp":
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[Mail] EMAIL_PROVIDER='smtp', mas credenciais SMTP estão incompletas. Usando MockAdapter.");
        cachedAdapter = new MockAdapter();
      } else {
        cachedAdapter = new SmtpAdapter();
      }
      break;

    case "mock":
    default:
      cachedAdapter = new MockAdapter();
      break;
  }

  return cachedAdapter;
}

/**
 * Helper de alto nível para disparo de e-mails usando o adapter ativo.
 * Se EMAIL_PROVIDER for "resend" e o envio falhar (ex: cota atingida ou erro de rede),
 * tenta automaticamente o envio via SMTP como fallback de alta disponibilidade.
 */
export async function sendEmail(options: EmailOptions): Promise<SendMailResult> {
  const adapter = getMailAdapter();
  const result = await adapter.sendMail(options);

  // Fallback automático: se falhou no Resend, tenta via SMTP se configurado
  if (!result.success && adapter.provider === "resend") {
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (hasSmtp) {
      console.warn(`[Mail] Falha ao enviar via Resend (${result.error}). Tentando fallback automático via SMTP...`);
      const smtpAdapter = new SmtpAdapter();
      const fallbackResult = await smtpAdapter.sendMail(options);

      if (fallbackResult.success) {
        console.log(`[Mail] Envio concluído com sucesso via fallback SMTP! MessageId: ${fallbackResult.messageId}`);
        return fallbackResult;
      }

      console.error(`[Mail] Fallback via SMTP também falhou: ${fallbackResult.error}`);
      return {
        ...fallbackResult,
        error: `Falha no Resend (${result.error}) e no fallback SMTP (${fallbackResult.error})`,
      };
    }
  }

  return result;
}
