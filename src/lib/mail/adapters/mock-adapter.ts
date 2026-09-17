import type { EmailAdapter, EmailOptions, SendMailResult } from "../types";

export class MockAdapter implements EmailAdapter {
  readonly provider = "mock" as const;

  async sendMail(options: EmailOptions): Promise<SendMailResult> {
    const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    const from = options.from || process.env.EMAIL_FROM || "GeraFeed <nao-responda@gerafeed.com.br>";
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    console.log("==================== [MOCK EMAIL ADAPTER] ====================");
    console.log(`[MockEmail] De:      ${from}`);
    console.log(`[MockEmail] Para:    ${to}`);
    console.log(`[MockEmail] Assunto: ${options.subject}`);
    if (options.text) {
      console.log(`[MockEmail] Texto:\n${options.text}`);
    }
    console.log(`[MockEmail] MessageId: ${messageId}`);
    console.log("==============================================================");

    return {
      success: true,
      provider: "mock",
      messageId,
    };
  }
}
