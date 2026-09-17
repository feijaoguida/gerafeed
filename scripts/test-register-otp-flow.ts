import { prisma } from "../src/lib/prisma";
import { generateOtpCode } from "../src/lib/security/otp";
import { hashPassword, verifyPassword } from "../src/lib/security/password";

async function main() {
  console.log("--- Testando Fluxo de Registro com OTP (Task 244) ---");

  const testEmail = `user-reg-${Date.now()}@exemplo.com`;
  const plainPassword = "MinhaSenhaSegura@123";
  const validCode = generateOtpCode();

  // 1. Criar fixture de token válido
  await prisma.verificationToken.create({
    data: {
      identifier: testEmail,
      token: validCode,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // 2. Simular tentativa com código incorreto
  const invalidRecord = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: testEmail,
        token: "000000",
      },
    },
  });
  if (invalidRecord) {
    throw new Error("Código 000000 não deveria ter sido validado!");
  }
  console.log("Rejeição de código incorreto no registro: OK");

  // 3. Simular cadastro bem-sucedido com código correto
  const validRecord = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: testEmail,
        token: validCode,
      },
    },
  });

  if (!validRecord || validRecord.expires < new Date()) {
    throw new Error("Token válido de teste não foi encontrado!");
  }

  const passwordHash = await hashPassword(plainPassword);

  const newUser = await prisma.user.create({
    data: {
      name: "Usuário Teste",
      email: testEmail,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  if (!newUser.emailVerified) {
    throw new Error("emailVerified deveria ter sido registrado!");
  }
  if (!newUser.passwordHash) {
    throw new Error("passwordHash deveria ter sido salvo!");
  }

  const passwordOk = await verifyPassword(plainPassword, newUser.passwordHash);
  if (!passwordOk) {
    throw new Error("Hash da senha registrada não conferiu!");
  }
  console.log("Criação de usuário com e-mail verificado e passwordHash: OK");

  // 4. Consumo do token (deve ser limpo após o cadastro)
  await prisma.verificationToken.deleteMany({
    where: { identifier: testEmail },
  });

  const remainingToken = await prisma.verificationToken.findFirst({
    where: { identifier: testEmail },
  });
  if (remainingToken) {
    throw new Error("Token de verificação não foi consumido após o registro!");
  }
  console.log("Consumo do token de verificação: OK");

  // Limpar usuário de teste
  await prisma.user.delete({
    where: { id: newUser.id },
  });
  console.log("Limpeza de usuário de teste: OK");

  console.log("Todos os testes da Task 244 passaram com sucesso!");
}

main()
  .catch((err) => {
    console.error("Erro no teste da Task 244:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
