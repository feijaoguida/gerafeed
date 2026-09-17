import { getMailAdapter, sendEmail, MockAdapter, ResendAdapter, SmtpAdapter } from "../src/lib/mail";

async function main() {
  console.log("--- Testando Email Adapters (Task 240) ---");

  // 1. Teste do MockAdapter diretamente
  const mockAdapter = new MockAdapter();
  const mockRes = await mockAdapter.sendMail({
    to: "usuario@teste.com",
    subject: "Teste Mock",
    html: "<p>Olá mundo</p>",
    text: "Olá mundo",
  });

  if (!mockRes.success || mockRes.provider !== "mock") {
    throw new Error("Falha no MockAdapter!");
  }
  console.log("MockAdapter: OK, messageId =", mockRes.messageId);

  // 2. Teste da Factory com default mock
  delete process.env.EMAIL_PROVIDER;
  const defaultAdapter = getMailAdapter();
  if (defaultAdapter.provider !== "mock") {
    throw new Error(`Factory padrão deveria retornar mock, retornou ${defaultAdapter.provider}`);
  }
  console.log("Factory Default: OK (retornou mock)");

  // 3. Teste do helper sendEmail
  const sendRes = await sendEmail({
    to: "cliente@exemplo.com",
    subject: "Código 123456",
    html: "<strong>123456</strong>",
  });
  if (!sendRes.success) {
    throw new Error("Falha no helper sendEmail!");
  }
  console.log("sendEmail Helper: OK");

  // 4. Instanciação do ResendAdapter e SmtpAdapter
  const resend = new ResendAdapter();
  console.log("ResendAdapter instanciado com sucesso: provider =", resend.provider);

  const smtp = new SmtpAdapter();
  console.log("SmtpAdapter instanciado com sucesso: provider =", smtp.provider);

  console.log("Todos os testes da Task 240 passaram com sucesso!");
}

main().catch((err) => {
  console.error("Erro no teste da Task 240:", err);
  process.exit(1);
});
