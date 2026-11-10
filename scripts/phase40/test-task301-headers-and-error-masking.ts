import nextConfig from "../../next.config";
import {
  isInternalInfrastructureError,
  getSafeClientErrorMessage,
} from "../../src/lib/errors/service";
import { MockAdapter } from "../../src/lib/mail/adapters/mock-adapter";

async function runTests() {
  console.log("=== INICIANDO TESTES DA TASK 301: HEADERS, ERROR MASKING & LOG HYGIENE ===");

  // 1. Validar Security Headers em next.config.ts
  console.log("\n[1] Validando Security Headers em next.config.ts...");
  if (typeof nextConfig.headers !== "function") {
    throw new Error("nextConfig.headers deve ser uma função assíncrona.");
  }

  const headerRules = await nextConfig.headers();
  const rootRule = headerRules.find((r) => r.source === "/:path*");
  if (!rootRule || !rootRule.headers) {
    throw new Error("Não foi encontrada regra de headers para '/:path*'");
  }

  const headersMap = new Map(rootRule.headers.map((h) => [h.key, h.value]));

  const requiredHeaders: Record<string, string | RegExp> = {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": /max-age=63072000/,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": /camera=\(\)/,
    "Content-Security-Policy": /frame-ancestors 'none'/,
  };

  for (const [key, expected] of Object.entries(requiredHeaders)) {
    const val = headersMap.get(key);
    if (!val) {
      throw new Error(`Header de segurança obrigatório ausente: ${key}`);
    }
    if (typeof expected === "string") {
      if (val !== expected) {
        throw new Error(`Header ${key} com valor inesperado: ${val} (esperado: ${expected})`);
      }
    } else if (!expected.test(val)) {
      throw new Error(`Header ${key} não corresponde ao padrão esperado: ${val}`);
    }
    console.log(`  ✓ Header ${key}: CONFORME (${val.substring(0, 40)}...)`);
  }

  // 2. Validar Mascaramento de Erros Internos do Prisma / PostgreSQL
  console.log("\n[2] Validando Mascaramento de Erros Internos...");

  const prismaErrors = [
    {
      name: "PrismaClientKnownRequestError",
      message: "Unique constraint failed on the constraint: User_email_key",
    },
    {
      name: "PrismaClientValidationError",
      message: "Invalid `prisma.article.findUnique()` invocation:\nUnknown argument `foo`.",
    },
    new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    new Error("relation \"articles\" does not exist in schema \"public\""),
    new Error("Fatal error at /home/feijao/projetos/news-curator/node_modules/pg/client.js"),
    new Error("Query failed: SELECT * FROM secrets WHERE id = 1"),
  ];

  for (const err of prismaErrors) {
    const isInfra = isInternalInfrastructureError(err);
    if (!isInfra) {
      throw new Error(`Falha ao identificar erro de infraestrutura: ${JSON.stringify(err)}`);
    }

    const safeMessage = getSafeClientErrorMessage(err, "Falha interna segura");
    if (safeMessage !== "Falha interna segura") {
      throw new Error(`Mensagem não foi mascarada: ${safeMessage}`);
    }
    console.log(`  ✓ Erro de infra detectado e mascarado: "${(err as Error).name || 'Error'}" -> "${safeMessage}"`);
  }

  // Erros seguros legítimos não devem ser mascarados
  const safeBusinessError = new Error("Cupom de desconto expirado.");
  if (isInternalInfrastructureError(safeBusinessError)) {
    throw new Error("Erro de negócio legítimo classificado incorretamente como erro de infra.");
  }
  const clientMsg = getSafeClientErrorMessage(safeBusinessError, "Fallback");
  if (clientMsg !== "Cupom de desconto expirado.") {
    throw new Error(`Mensagem de negócio corrompida: ${clientMsg}`);
  }
  console.log(`  ✓ Erro de negócio legítimo preservado com sucesso: "${clientMsg}"`);

  // 3. Validar Higienização de Logs (MockAdapter em produção)
  console.log("\n[3] Validando Higienização de Logs em Produção...");
  const oldEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const adapter = new MockAdapter();

    let logsPrinted = 0;
    const originalConsoleLog = console.log;
    console.log = () => {
      logsPrinted++;
    };

    try {
      await adapter.sendMail({
        to: "test@example.com",
        subject: "Seu código OTP é 123456",
        text: "Código confidencial 123456",
        html: "<p>Código confidencial 123456</p>",
      });
    } finally {
      console.log = originalConsoleLog;
    }

    if (logsPrinted > 0) {
      throw new Error(`MockAdapter imprimiu ${logsPrinted} mensagens no console em modo production!`);
    }
    console.log("  ✓ MockAdapter não vazou dados ou OTPs no console em produção");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = oldEnv;
  }

  console.log("\n=== TODOS OS TESTES DA TASK 301 PASSARAM COM SUCESSO! ===");
}

runTests().catch((err) => {
  console.error("ERRO nos testes da Task 301:", err);
  process.exit(1);
});
