import nodemailer from "nodemailer";
import type { EmailAdapter, EmailOptions, SendMailResult } from "../types";

export class SmtpAdapter implements EmailAdapter {
  readonly provider = "smtp" as const;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendMail(options: EmailOptions): Promise<SendMailResult> {
    if (!this.transporter) {
      const errorMsg = "Configurações de SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) incompletas no ambiente.";
      console.error(`[SmtpAdapter] ${errorMsg}`);
      return {
        success: false,
        provider: "smtp",
        error: errorMsg,
      };
    }

    try {
      const from = options.from || process.env.EMAIL_FROM || "GeraFeed <nao-responda@gerafeed.com.br>";
      const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;

      const info = await this.transporter.sendMail({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao enviar e-mail via SMTP.";
      console.error("[SmtpAdapter] Exceção:", message);
      return {
        success: false,
        provider: "smtp",
        error: message,
      };
    }
  }
}
