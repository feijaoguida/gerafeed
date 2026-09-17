import { Resend } from "resend";
import type { EmailAdapter, EmailOptions, SendMailResult } from "../types";

export class ResendAdapter implements EmailAdapter {
  readonly provider = "resend" as const;
  private client: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.client = new Resend(apiKey);
    }
  }

  async sendMail(options: EmailOptions): Promise<SendMailResult> {
    if (!this.client) {
      const errorMsg = "RESEND_API_KEY não configurada no ambiente.";
      console.error(`[ResendAdapter] ${errorMsg}`);
      return {
        success: false,
        provider: "resend",
        error: errorMsg,
      };
    }

    try {
      const from = options.from || process.env.EMAIL_FROM || "GeraFeed <nao-responda@gerafeed.com.br>";
      const to = Array.isArray(options.to) ? options.to : [options.to];

      const { data, error } = await this.client.emails.send({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      if (error) {
        console.error("[ResendAdapter] Erro retornado pela API do Resend:", error);
        return {
          success: false,
          provider: "resend",
          error: error.message,
        };
      }

      return {
        success: true,
        provider: "resend",
        messageId: data?.id,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao enviar e-mail via Resend.";
      console.error("[ResendAdapter] Exceção:", message);
      return {
        success: false,
        provider: "resend",
        error: message,
      };
    }
  }
}
