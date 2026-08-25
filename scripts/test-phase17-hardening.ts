import { SafeUrlResolver } from "@/lib/affiliate/resolver";
import { validateHostForSSRF, SSRFSecurityError } from "@/lib/affiliate/ssrf";
import { extractProductMetadata } from "@/lib/affiliate/metadata-extractor";
import { ProductReviewService } from "@/lib/affiliate/review-service";
import { ProductReferenceSourceService } from "@/lib/affiliate/reference-source-service";

async function run() {
  console.log("=== AUDIT & HARDENING TEST: Phase 17 ===");

  try {
    // 1. SSRF & Protocol Hardening Audit
    console.log("\n--- Check 1: Auditoria de Proteção SSRF e Protocolos ---");

    const dangerousHosts = [
      "127.0.0.1",
      "localhost",
      "10.0.0.1",
      "192.168.0.1",
      "172.16.0.1",
      "169.254.169.254", // Cloud metadata IP
      "0.0.0.0",
      "::1",
    ];

    for (const host of dangerousHosts) {
      let blocked = false;
      try {
        await validateHostForSSRF(host);
      } catch (err) {
        if (err instanceof SSRFSecurityError || (err as Error).message.includes("bloqueado") || (err as Error).message.includes("privado") || (err as Error).message.includes("inválido")) {
          blocked = true;
        }
      }
      if (!blocked) {
        throw new Error(`FAIL Check 1: Host perigoso '${host}' NÃO foi bloqueado por SSRF!`);
      }
    }
    console.log("✓ Check 1.1: Todos os IPs privados, loopback e metadados de nuvem foram bloqueados.");

    const dangerousUrls = [
      "file:///etc/passwd",
      "ftp://ftp.example.com/file",
      "gopher://gopher.example.com",
      "javascript:alert(1)",
      "data:text/html,<h1>test</h1>",
    ];

    for (const url of dangerousUrls) {
      let blocked = false;
      try {
        await SafeUrlResolver.resolve(url);
      } catch {
        blocked = true;
      }
      if (!blocked) {
        throw new Error(`FAIL Check 1: Protocolo perigoso '${url}' NÃO foi bloqueado!`);
      }
    }
    console.log("✓ Check 1.2: Todos os protocolos e schemas inseguros foram rejeitados.");

    // 2. Privacy & PII Sanitization + Max 5 Reviews Audit
    console.log("\n--- Check 2: Auditoria de Privacidade (Sem PII) e Limite Max 5 de Reviews ---");
    const mockHtmlReviews = `
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Teste Hardening",
          "review": [
            { "@type": "Review", "reviewRating": { "ratingValue": 5 }, "reviewBody": "Rev 1", "author": { "name": "João da Silva joao.silva@empresa.com.br (11) 98765-4321" } },
            { "@type": "Review", "reviewRating": { "ratingValue": 4 }, "reviewBody": "Rev 2", "author": "Maria Souza maria@teste.com" },
            { "@type": "Review", "reviewRating": { "ratingValue": 5 }, "reviewBody": "Rev 3", "author": "Pedro Santos +55 21 99999-8888" },
            { "@type": "Review", "reviewRating": { "ratingValue": 3 }, "reviewBody": "Rev 4", "author": "Ana Lima" },
            { "@type": "Review", "reviewRating": { "ratingValue": 5 }, "reviewBody": "Rev 5", "author": "Lucas Moura" },
            { "@type": "Review", "reviewRating": { "ratingValue": 2 }, "reviewBody": "Rev 6 (Excedente)", "author": "Excedente" },
            { "@type": "Review", "reviewRating": { "ratingValue": 1 }, "reviewBody": "Rev 7 (Excedente)", "author": "Excedente 2" }
          ]
        }
        </script>
      </head>
      <body></body>
      </html>
    `;

    const extracted = extractProductMetadata(mockHtmlReviews, {
      affiliateUrl: "https://produto.mercadolivre.com.br/MLB-157001-teste",
    });

    if (!extracted.reviewSamples || extracted.reviewSamples.length !== 5) {
      throw new Error(`FAIL Check 2: Limite máximo de 5 reviews violado! Total extraído: ${extracted.reviewSamples?.length}`);
    }

    for (const rev of extracted.reviewSamples) {
      if (rev.authorName) {
        if (rev.authorName.includes("@") || rev.authorName.includes("98765") || rev.authorName.includes("99999")) {
          throw new Error(`FAIL Check 2: PII (e-mail ou telefone) vazou no nome do autor: '${rev.authorName}'`);
        }
        // Name should be formatted as "First Initial."
        const parts = rev.authorName.trim().split(" ");
        if (parts.length > 2) {
          throw new Error(`FAIL Check 2: Nome do autor não foi abreviado corretamente: '${rev.authorName}'`);
        }
      }
    }
    console.log("✓ Check 2 PASS: PII 100% sanitizada e teto de 5 amostras estritamente respeitado.");

    // 3. AI Grounding Disclaimer & Anti-False-Statistics Audit
    console.log("\n--- Check 3: Auditoria de Grounding sem Falsa Agregação Estatística ---");
    const reviewGrounding = ProductReviewService.formatReviewsForAiGrounding(extracted.reviewSamples);

    if (!reviewGrounding.includes("amostra qualitativa") || !reviewGrounding.includes("NÃO devem ser tratadas como estatística")) {
      throw new Error("FAIL Check 3: Grounding de reviews não possui disclaimer explícito contra falsa estatística!");
    }

    const refSourcesGrounding = ProductReferenceSourceService.formatReferenceSourcesForAiGrounding([
      {
        title: "Artigo Especializado Tech",
        url: "https://tech.example.com/review",
        summary: "Resumo do produto.",
        status: "READY",
      },
    ]);

    if (!refSourcesGrounding.includes("Pesquisa e Fontes Especializadas de Referência")) {
      throw new Error("FAIL Check 3: Grounding de fontes de referência ausente.");
    }

    console.log("✓ Check 3 PASS: Disclaimers de amostragem qualitativa e fontes de referência íntegros.");

    console.log("\n=======================================================");
    console.log("AUDITORIA E HARDENING DA FASE 17 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA AUDITORIA DA FASE 17:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
