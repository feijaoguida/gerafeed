import { generateOtpCode } from "../src/lib/security/otp";
import { renderVerificationCodeEmail } from "../src/lib/mail/templates/verification-code";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("--- Testando OTP Verification (Task 242) ---");

  // 1. Geração do código OTP
  const code = generateOtpCode();
  console.log("Código OTP gerado:", code);
  if (!/^\d{6}$/.test(code)) {
    throw new Error(`Código OTP deve conter exatamente 6 dígitos numéricos: ${code}`);
  }
  console.log("Formato de 6 dígitos numéricos: OK");

  // 2. Template de e-mail
  const { html, text } = renderVerificationCodeEmail({ code, expiresInMinutes: 15 });
  if (!html.includes(code) || !text.includes(code)) {
    throw new Error("Template de e-mail não contém o código gerado!");
  }
  console.log("Renderização do template de e-mail: OK");

  // 3. Teste no Banco com VerificationToken
  const testEmail = `test-otp-${Date.now()}@exemplo.com`;

  // Limpar antes
  await prisma.verificationToken.deleteMany({
    where: { identifier: testEmail },
  });

  // Criar token válido
  await prisma.verificationToken.create({
    data: {
      identifier: testEmail,
      token: code,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // Buscar token válido
  const validRecord = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: testEmail,
        token: code,
      },
    },
  });

  if (!validRecord || validRecord.expires < new Date()) {
    throw new Error("Token válido não foi encontrado ou foi considerado expirado!");
  }
  console.log("Validação de token correto no banco: OK");

  // Buscar com código incorreto
  const wrongRecord = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: testEmail,
        token: "000000",
      },
    },
  });

  if (wrongRecord) {
    throw new Error("Código incorreto foi aceito!");
  }
  console.log("Rejeição de código incorreto: OK");

  // Criar token expirado e testar
  const expiredEmail = `expired-${Date.now()}@exemplo.com`;
  await prisma.verificationToken.create({
    data: {
      identifier: expiredEmail,
      token: "999999",
      expires: new Date(Date.now() - 1000), // já expirado
    },
  });

  const expiredRecord = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: expiredEmail,
        token: "999999",
      },
    },
  });

  if (!expiredRecord || !(expiredRecord.expires < new Date())) {
    throw new Error("Verificação de expiração falhou!");
  }
  console.log("Detecção de token expirado: OK");

  // Limpar registros de teste
  await prisma.verificationToken.deleteMany({
    where: { identifier: { in: [testEmail, expiredEmail] } },
  });
  console.log("Limpeza de fixtures de teste: OK");

  console.log("Todos os testes da Task 242 passaram com sucesso!");
}

main()
  .catch((err) => {
    console.error("Erro no teste da Task 242:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
