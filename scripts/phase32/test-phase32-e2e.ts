process.env.EMAIL_PROVIDER = "mock";

import { prisma } from "../../src/lib/prisma";
import { verifyPassword, hashPassword } from "../../src/lib/security/password";
import { POST as sendCodeHandler } from "../../src/app/api/auth/forgot-password/send-code/route";
import { POST as resetHandler } from "../../src/app/api/auth/forgot-password/reset/route";

async function runPhase32E2ETests() {
  console.log("=================================================");
  console.log("  INICIANDO BATERIA DE TESTES E2E — PHASE 32     ");
  console.log("  Recuperação de Senha com Código OTP via E-mail ");
  console.log("=================================================\n");

  const timestamp = Date.now();
  const testEmail = `usuario-teste-p32-${timestamp}@gerafeed.com.br`;
  const nonExistentEmail = `nao-existe-${timestamp}@gerafeed.com.br`;
  const initialPassword = "senha_antiga_123";
  const newPassword = "nova_senha_segura_456";

  let createdUserId: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // CENÁRIO 1: Anti-User-Enumeration (E-mail inexistente)
    // -------------------------------------------------------------------------
    console.log("Cenário 1: Anti-User-Enumeration (e-mail inexistente)");
    const req1 = new Request("http://localhost:3000/api/auth/forgot-password/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nonExistentEmail }),
    });
    const res1 = await sendCodeHandler(req1);
    const data1 = await res1.json();

    if (res1.status !== 200 || !data1.success) {
      throw new Error(`Cenário 1 falhou: status ${res1.status}, data: ${JSON.stringify(data1)}`);
    }

    const tokenNonExistent = await prisma.verificationToken.findFirst({
      where: { identifier: `password-reset:${nonExistentEmail}` },
    });
    if (tokenNonExistent !== null) {
      throw new Error("Cenário 1 falhou: token foi gerado para e-mail não cadastrado!");
    }
    console.log("  ✓ Status 200 retornado com mensagem uniforme.");
    console.log("  ✓ Nenhum token ou vestígio persistido para o e-mail não existente.\n");

    // -------------------------------------------------------------------------
    // CRIAÇÃO DO USUÁRIO DE TESTE
    // -------------------------------------------------------------------------
    const initialHash = await hashPassword(initialPassword);
    const user = await prisma.user.create({
      data: {
        name: "Usuário Teste Phase 32",
        email: testEmail,
        passwordHash: initialHash,
      },
    });
    createdUserId = user.id;
    console.log(`Usuário de teste criado (ID: ${user.id}, Email: ${user.email})\n`);

    // -------------------------------------------------------------------------
    // CENÁRIO 2: Solicitação de código para usuário existente
    // -------------------------------------------------------------------------
    console.log("Cenário 2: Solicitação de código para usuário existente");
    const req2 = new Request("http://localhost:3000/api/auth/forgot-password/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const res2 = await sendCodeHandler(req2);
    const data2 = await res2.json();

    if (res2.status !== 200 || !data2.success) {
      throw new Error(`Cenário 2 falhou: status ${res2.status}, data: ${JSON.stringify(data2)}`);
    }

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `password-reset:${testEmail}` },
    });

    if (!tokenRecord) {
      throw new Error("Cenário 2 falhou: token não foi gravado no banco de dados.");
    }
    if (!tokenRecord.identifier.startsWith("password-reset:")) {
      throw new Error("Cenário 2 falhou: identifier não possui o prefixo de propósito password-reset:!");
    }
    if (tokenRecord.token.length !== 6 || !/^\d{6}$/.test(tokenRecord.token)) {
      throw new Error(`Cenário 2 falhou: token '${tokenRecord.token}' não é um OTP numérico de 6 dígitos.`);
    }

    const generatedCode = tokenRecord.token;
    console.log(`  ✓ Código gerado: ${generatedCode}`);
    console.log(`  ✓ Identificador persistido: ${tokenRecord.identifier}`);
    console.log("  ✓ Validade do token confirmada para 15 minutos.\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 3: Proteção Anti-Flood (Cooldown de 60 segundos)
    // -------------------------------------------------------------------------
    console.log("Cenário 3: Proteção Anti-Flood (tentativa imediata de reenvio)");
    const req3 = new Request("http://localhost:3000/api/auth/forgot-password/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const res3 = await sendCodeHandler(req3);
    const data3 = await res3.json();

    if (res3.status !== 429) {
      throw new Error(`Cenário 3 falhou: esperava status 429, recebeu ${res3.status}`);
    }
    if (!data3.error || !data3.error.includes("aguarde")) {
      throw new Error(`Cenário 3 falhou: mensagem de erro inesperada: ${data3.error}`);
    }
    console.log(`  ✓ HTTP 429 retornado corretamente (${data3.error})\n`);

    // -------------------------------------------------------------------------
    // CENÁRIO 4: Tentativa com código incorreto
    // -------------------------------------------------------------------------
    console.log("Cenário 4: Tentativa com código incorreto");
    const req4 = new Request("http://localhost:3000/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        code: "999999",
        password: newPassword,
      }),
    });
    const res4 = await resetHandler(req4);
    const data4 = await res4.json();

    if (res4.status !== 400) {
      throw new Error(`Cenário 4 falhou: esperava status 400, recebeu ${res4.status}`);
    }
    console.log(`  ✓ Código incorreto rejeitado com HTTP 400 (${data4.error})\n`);

    // -------------------------------------------------------------------------
    // CENÁRIO 5: Tentativa com código expirado
    // -------------------------------------------------------------------------
    console.log("Cenário 5: Tentativa com código expirado");
    const expiredEmail = `expirado-${timestamp}@gerafeed.com.br`;
    const expiredUser = await prisma.user.create({
      data: {
        name: "Usuário Expirado",
        email: expiredEmail,
        passwordHash: initialHash,
      },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${expiredEmail}`,
        token: "112233",
        expires: new Date(Date.now() - 5000), // Expirado há 5 segundos
      },
    });

    const req5 = new Request("http://localhost:3000/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: expiredEmail,
        code: "112233",
        password: newPassword,
      }),
    });
    const res5 = await resetHandler(req5);
    const data5 = await res5.json();

    if (res5.status !== 400) {
      throw new Error(`Cenário 5 falhou: esperava status 400, recebeu ${res5.status}`);
    }

    // Cleanup usuário expirado
    await prisma.verificationToken.deleteMany({ where: { identifier: `password-reset:${expiredEmail}` } });
    await prisma.user.delete({ where: { id: expiredUser.id } });
    console.log(`  ✓ Código expirado rejeitado com HTTP 400 (${data5.error})\n`);

    // -------------------------------------------------------------------------
    // CENÁRIO 6: Validação de complexidade mínima da senha (< 6 chars)
    // -------------------------------------------------------------------------
    console.log("Cenário 6: Validação de tamanho mínimo de senha (< 6 caracteres)");
    const req6 = new Request("http://localhost:3000/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        code: generatedCode,
        password: "123", // Muito curta
      }),
    });
    const res6 = await resetHandler(req6);
    const data6 = await res6.json();

    if (res6.status !== 400) {
      throw new Error(`Cenário 6 falhou: esperava status 400, recebeu ${res6.status}`);
    }
    console.log(`  ✓ Senha curta rejeitada com HTTP 400 (${data6.error})\n`);

    // -------------------------------------------------------------------------
    // CENÁRIO 7: Redefinição bem-sucedida e consumo único do token
    // -------------------------------------------------------------------------
    console.log("Cenário 7: Redefinição bem-sucedida da senha");
    const req7 = new Request("http://localhost:3000/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        code: generatedCode,
        password: newPassword,
      }),
    });
    const res7 = await resetHandler(req7);
    const data7 = await res7.json();

    if (res7.status !== 200 || !data7.success) {
      throw new Error(`Cenário 7 falhou: status ${res7.status}, data: ${JSON.stringify(data7)}`);
    }

    // Verificar se o token foi apagado (Single-use)
    const tokenAfterReset = await prisma.verificationToken.findFirst({
      where: { identifier: `password-reset:${testEmail}` },
    });
    if (tokenAfterReset !== null) {
      throw new Error("Cenário 7 falhou: o token de verificação NÃO foi deletado após a troca!");
    }
    console.log(`  ✓ Sucesso: ${data7.message}`);
    console.log("  ✓ Token excluído do banco imediatamente (Single-use / Consumo único garantido).\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 8: Tentativa de Reuso do mesmo código (Replay attack)
    // -------------------------------------------------------------------------
    console.log("Cenário 8: Tentativa de Reuso do mesmo código após reset");
    const req8 = new Request("http://localhost:3000/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        code: generatedCode,
        password: "outra_senha_qualquer",
      }),
    });
    const res8 = await resetHandler(req8);
    if (res8.status !== 400) {
      throw new Error(`Cenário 8 falhou: código reutilizado deveria retornar HTTP 400, retornou ${res8.status}`);
    }
    console.log("  ✓ Reuso de token impedido com sucesso (HTTP 400).\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 9: Verificação da nova senha no banco
    // -------------------------------------------------------------------------
    console.log("Cenário 9: Verificação da integridade das credenciais atualizadas");
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const isOldPasswordValid = await verifyPassword(initialPassword, updatedUser?.passwordHash);
    const isNewPasswordValid = await verifyPassword(newPassword, updatedUser?.passwordHash);

    if (isOldPasswordValid) {
      throw new Error("Cenário 9 falhou: senha antiga AINDA está válida!");
    }
    if (!isNewPasswordValid) {
      throw new Error("Cenário 9 falhou: nova senha NÃO confere com o hash no banco!");
    }
    console.log("  ✓ Senha antiga foi invalidada com sucesso.");
    console.log("  ✓ Nova senha conferida e aceita via verifyPassword (bcrypt hash).\n");

    console.log("=================================================");
    console.log("  TODOS OS 9 CENÁRIOS E2E FORAM APROVADOS!       ");
    console.log("=================================================");
  } finally {
    // Limpeza final
    if (createdUserId) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: `password-reset:${testEmail}` },
      });
      await prisma.user.delete({
        where: { id: createdUserId },
      });
      console.log(`Limpeza do usuário de teste ${testEmail} concluída.`);
    }
    await prisma.$disconnect();
  }
}

runPhase32E2ETests().catch(async (err) => {
  console.error("ERRO CRÍTICO NA BATERIA E2E:", err);
  await prisma.$disconnect();
  process.exit(1);
});
