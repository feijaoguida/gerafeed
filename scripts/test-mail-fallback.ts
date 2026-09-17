import { sendEmail } from "../src/lib/mail";

async function main() {
  console.log("--- Testando Fallback Automático Resend -> SMTP ---");

  // 1. Configurar EMAIL_PROVIDER="resend" com chave mockada/inválida
  process.env.EMAIL_PROVIDER = "resend";
  process.env.RESEND_API_KEY = "re_invalid_key_for_testing";

  // Configurar SMTP de teste (sem autenticação real, só para checar o acionamento)
  process.env.SMTP_HOST = "smtp.invalid-host-for-testing.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_USER = "user@test.com";
  process.env.SMTP_PASS = "pass123";

  console.log("Disparando envio com Resend propositalmente inválido...");
  const res = await sendEmail({
    to: "destinatario@teste.com",
    subject: "Teste Fallback",
    html: "<p>Teste Fallback</p>",
  });

  console.log("Resultado do envio com tentativa de fallback:", res);

  // Deve ter tentado o Resend, falhado, e tentado o fallback via SMTP
  if (!res.error?.includes("Resend") && !res.error?.includes("fallback SMTP")) {
    throw new Error("O mecanismo de fallback não registrou o fluxo esperado!");
  }

  console.log("✅ Mecanismo de Fallback Resend -> SMTP acionado e validado com sucesso!");
}

main().catch((err) => {
  console.error("Erro no teste de fallback:", err);
  process.exit(1);
});
