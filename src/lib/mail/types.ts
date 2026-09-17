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
