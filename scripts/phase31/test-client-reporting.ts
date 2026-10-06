import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import { POST } from "../../src/app/api/error-logs/route";

async function main() {
  console.log("🧪 Testando endpoint POST /api/error-logs (Task 257)...");

  // 1. Simular chamada POST para /api/error-logs
  const mockReq = new Request("http://localhost:3000/api/error-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-agent": "AutomatedTestBrowser/2.0",
      "x-forwarded-for": "189.40.120.15",
    },
    body: JSON.stringify({
      screen: "Catálogo de Produtos Shopee",
      path: "/affiliates/products?filter=shopee",
      module: "AFFILIATES",
      query: { search: "microfone lapela", page: 1 },
      errorMessage: "Uncaught TypeError: Cannot read properties of undefined (reading 'offers')",
      errorStack: "TypeError: Cannot read properties of undefined\n    at ProductCatalogView (product-catalog.tsx:42:15)",
      statusCode: 400,
    }),
  });

  const res = await POST(mockReq);
  if (res.status !== 201) {
    const errorBody = await res.text();
    throw new Error(`Endpoint retornou status inesperado ${res.status}: ${errorBody}`);
  }

  const json = await res.json();
  if (!json.success || !json.errorId) {
    throw new Error("Resposta não retornou success=true ou errorId.");
  }
  console.log("✓ Endpoint /api/error-logs processou com sucesso e retornou ID:", json.errorId);

  // 2. Verificar no banco de dados se os dados foram salvos corretamente
  const savedLog = await prisma.systemErrorLog.findUnique({
    where: { id: json.errorId },
  });

  if (!savedLog) {
    throw new Error("Log gravado pelo client não foi encontrado no banco.");
  }

  if (savedLog.screen !== "Catálogo de Produtos Shopee") {
    throw new Error(`Tela gravada incorreta: ${savedLog.screen}`);
  }
  if (savedLog.module !== "AFFILIATES") {
    throw new Error(`Módulo gravado incorreto: ${savedLog.module}`);
  }
  if (savedLog.method !== "CLIENT") {
    throw new Error(`Método gravado incorreto: ${savedLog.method}`);
  }
  if (savedLog.ipAddress !== "189.40.120.15") {
    throw new Error(`IP gravado incorreto: ${savedLog.ipAddress}`);
  }
  if (!savedLog.errorStack?.includes("TypeError: Cannot read properties of undefined")) {
    throw new Error("Stack trace do client não foi persistido.");
  }
  console.log("✓ Registro verificado com precisão no banco de dados.");

  // 3. Limpeza
  await prisma.systemErrorLog.delete({
    where: { id: json.errorId },
  });
  console.log("✓ Log de teste limpo com sucesso.");

  console.log("🎉 Teste Task 257 PASSOU com 100% de sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Falha no teste Task 257:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
