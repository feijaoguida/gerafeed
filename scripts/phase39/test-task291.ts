import { prisma } from "../../src/lib/prisma";
import { SiteAntifraudService } from "../../src/lib/site-antifraud";

async function main() {
  console.log("--- TESTANDO TASK 291: TRAVA ANTI-FRAUDE DE CADASTRO DE SITES ---");

  const testDomain = `antifraud-task291-${Date.now()}.com.br`;
  const url1 = `https://${testDomain}/wp-admin`;
  const url2 = `https://www.${testDomain}/`;
  const url3 = `http://${testDomain}:8080/wp-json/`;

  console.log(`\nDomínio de teste gerado: ${testDomain}`);

  // 1. Simular Conta 1 (workspace-1) cadastrando o site
  console.log("\n1. Conta 1 cadastrando o site...");
  const check1 = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: url1,
    workspaceId: "ws-antifraud-1",
    userEmail: "dono1@empresa1.com",
    sourceContext: "WORDPRESS_SITE",
    reqPath: "/api/wordpress/sites",
  });
  console.log("Resultado Conta 1:", check1);
  if (!check1.allowed || check1.attemptNumber !== 1) {
    throw new Error(`Conta 1 deveria ser permitida (attempt 1), mas retornou: ${JSON.stringify(check1)}`);
  }

  // Simular criação do site WordPress e vinculação
  const fakeSite1Id = `site-wp-1-${Date.now()}`;
  if (check1.historyRecordId) {
    await prisma.siteRegistrationHistory.update({
      where: { id: check1.historyRecordId },
      data: { wordpressSiteId: fakeSite1Id },
    });
  }

  // 2. Simular Conta 1 "excluindo" o site (ou cancelando assinatura)
  console.log("\n2. Conta 1 exclui o site WordPress (o histórico de registro permanece intacto)...");
  // O registro em siteRegistrationHistory não é deletado

  // 3. Simular Conta 2 (workspace-2) cadastrando o MESMO site
  console.log("\n3. Conta 2 cadastrando o mesmo site...");
  const check2 = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: url2,
    workspaceId: "ws-antifraud-2",
    userEmail: "dono2@empresa2.com",
    sourceContext: "WORDPRESS_SITE",
    reqPath: "/api/wordpress/sites",
  });
  console.log("Resultado Conta 2:", check2);
  if (!check2.allowed || check2.attemptNumber !== 2) {
    throw new Error(`Conta 2 deveria ser permitida (attempt 2), mas retornou: ${JSON.stringify(check2)}`);
  }

  // 4. Simular Conta 3 (workspace-3) tentando cadastrar o MESMO site -> DEVE BLOQUEAR!
  console.log("\n4. Conta 3 tentando cadastrar o mesmo site (3ª conta distinta)...");
  const check3 = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: url3,
    workspaceId: "ws-antifraud-3",
    userEmail: "dono3@empresa3.com",
    sourceContext: "WORDPRESS_SITE",
    reqPath: "/api/wordpress/sites",
  });
  console.log("Resultado Conta 3 (Bloqueio):", check3);
  if (check3.allowed !== false || check3.attemptNumber !== 3 || !check3.blockedMessage?.includes("Suporte")) {
    throw new Error(`Conta 3 deveria ser BLOQUEADA (attempt 3), mas retornou: ${JSON.stringify(check3)}`);
  }

  // 5. Simular tentativa no cadastro de novo usuário (/register) com o mesmo site
  console.log("\n5. Tentativa de cadastro de novo usuário com o mesmo site bloqueado...");
  const checkRegister = await SiteAntifraudService.validateAndRecordSiteRegistration({
    rawUrl: `https://${testDomain}`,
    userEmail: "novo4@empresa4.com",
    sourceContext: "REGISTER",
    reqPath: "/api/auth/register",
  });
  console.log("Resultado no Register:", checkRegister);
  if (checkRegister.allowed !== false || checkRegister.attemptNumber < 3) {
    throw new Error(`Cadastro no /register deveria ser BLOQUEADO, mas retornou: ${JSON.stringify(checkRegister)}`);
  }

  // 6. Verificar persistência em SystemErrorLog
  console.log("\n6. Verificando SystemErrorLog gerado...");
  const logs = await prisma.systemErrorLog.findMany({
    where: {
      errorMessage: { contains: testDomain },
      statusCode: 403,
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Logs de segurança encontrados: ${logs.length}`);
  if (logs.length < 2) {
    throw new Error(`Deveriam existir pelo menos 2 logs de erro 403 para o domínio bloqueado, mas encontrou: ${logs.length}`);
  }

  // 7. Simular ação de suporte liberando o domínio
  console.log("\n7. Testando liberação administrativa pelo suporte...");
  const clearedCount = await SiteAntifraudService.clearDomainForWorkspace(
    SiteAntifraudService.normalizeSiteDomain(testDomain),
    "ws-antifraud-1"
  );
  console.log(`Registros liberados pelo suporte: ${clearedCount}`);

  // Limpeza dos dados de teste
  await prisma.siteRegistrationHistory.deleteMany({
    where: { normalizedDomain: SiteAntifraudService.normalizeSiteDomain(testDomain) },
  });
  await prisma.systemErrorLog.deleteMany({
    where: { errorMessage: { contains: testDomain } },
  });

  console.log("\n✅ TASK 291 VALIDADA COM 100% DE SUCESSO!");
}

main()
  .catch((err) => {
    console.error("❌ Falha no teste da Task 291:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

