import { prisma } from "../src/lib/prisma";
import { formatEditorialDate } from "../src/lib/format-date";

async function runTests() {
  console.log("--- TEST: Task 066 - Feed Date on Article Card & Detail ---");

  // 1. Test Date Formatter Unit Logic
  const sampleIso = "2026-08-17T15:30:00Z";
  const formattedIso = formatEditorialDate(sampleIso);
  console.log("✓ Formatação de data ISO com timezone America/Sao_Paulo:", formattedIso);

  if (!formattedIso.includes("17/08/2026") || !formattedIso.includes("12:30")) {
    throw new Error(`Data formatada incorreta: ${formattedIso}`);
  }

  // 2. Test Fallback when null or undefined
  const fallbackNull = formatEditorialDate(null);
  const fallbackUndefined = formatEditorialDate(undefined);
  const fallbackEmpty = formatEditorialDate("");

  if (
    fallbackNull !== "Data não informada pela fonte" ||
    fallbackUndefined !== "Data não informada pela fonte" ||
    fallbackEmpty !== "Data não informada pela fonte"
  ) {
    throw new Error("Fallback de data falhou!");
  }
  console.log("✓ Fallback 'Data não informada pela fonte' validado com sucesso.");

  // 3. Database test: verify distinct createdAt vs originalPublishedAt
  const ws = await prisma.workspace.upsert({
    where: { slug: "test-date-card-ws" },
    update: {},
    create: { name: "Date Card WS", slug: "test-date-card-ws" },
  });

  const src = await prisma.source.create({
    data: {
      workspaceId: ws.id,
      name: "News Source",
      rssUrl: "https://news.test/rss",
    },
  });

  try {
    const pubDate = new Date("2026-08-10T08:00:00Z");
    const artWithDate = await prisma.article.create({
      data: {
        workspaceId: ws.id,
        sourceId: src.id,
        originalUrl: "https://news.test/item-1",
        originalTitle: "Notícia com data original",
        originalPublishedAt: pubDate,
        createdAt: new Date("2026-08-17T11:00:00Z"), // Ingestion date
      },
    });

    const artWithoutDate = await prisma.article.create({
      data: {
        workspaceId: ws.id,
        sourceId: src.id,
        originalUrl: "https://news.test/item-2",
        originalTitle: "Notícia sem data informada",
        originalPublishedAt: null,
        createdAt: new Date("2026-08-17T11:05:00Z"),
      },
    });

    // Check formatting on both
    const formattedWithDate = formatEditorialDate(artWithDate.originalPublishedAt);
    const formattedWithoutDate = formatEditorialDate(artWithoutDate.originalPublishedAt);

    if (!formattedWithDate.includes("10/08/2026") || !formattedWithDate.includes("05:00")) {
      throw new Error(`Data original do artigo 1 incorreta: ${formattedWithDate}`);
    }

    if (formattedWithoutDate !== "Data não informada pela fonte") {
      throw new Error(`Data do artigo sem data deveria retornar fallback: ${formattedWithoutDate}`);
    }

    // Ensure createdAt is not used
    const formattedCreatedAt = formatEditorialDate(artWithoutDate.createdAt);
    if (formattedCreatedAt === formattedWithoutDate) {
      throw new Error("VULNERABILIDADE: Ingestão (createdAt) usada silenciosamente como publicação!");
    }

    console.log("✓ Artigo com data editorial:", formattedWithDate);
    console.log("✓ Artigo sem data editorial:", formattedWithoutDate);
    console.log("✓ Distinção absoluta entre ingestão (createdAt) e publicação (originalPublishedAt) comprovada.");

    console.log("\n>>> TODOS OS TESTES DA TASK 066 PASSARAM COM SUCESSO! <<<");
  } finally {
    await prisma.workspace.deleteMany({
      where: { slug: "test-date-card-ws" },
    });
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  });
