import {
  extractProductMetadata,
  MercadoLivreAffiliateProvider,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 104 - Mercado Livre Product Importer & Metadata Extractor ===");

  try {
    // 1. Fixture 1: JSON-LD Product (COMPLETE)
    console.log("\n--- Check 1: Fixture 1 - JSON-LD Completo (COMPLETE) ---");
    const jsonLdHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Smartphone Galaxy Ultra - Mercado Livre</title>
        <link rel="canonical" href="https://produto.mercadolivre.com.br/MLB-1234567890-galaxy-ultra-_JM" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Smartphone Galaxy Ultra 256GB 5G",
          "image": "https://http2.mlstatic.com/D_NQ_NP_123456-MLB1234567890_012024-O.webp",
          "description": "O melhor smartphone para fotografia e performance com tela AMOLED.",
          "brand": {
            "@type": "Brand",
            "name": "Samsung"
          },
          "sku": "MLB1234567890",
          "offers": {
            "@type": "Offer",
            "price": "3999.00",
            "priceCurrency": "BRL",
            "seller": {
              "@type": "Organization",
              "name": "Loja Oficial Samsung"
            },
            "availability": "https://schema.org/InStock"
          }
        }
        </script>
      </head>
      <body>
        <h1>Smartphone Galaxy Ultra 256GB 5G</h1>
      </body>
      </html>
    `;

    const result1 = extractProductMetadata(jsonLdHtml, {
      affiliateUrl: "https://mercadolivre.com/sec/galaxy-ultra",
      resolvedUrl: "https://produto.mercadolivre.com.br/MLB-1234567890-galaxy-ultra-_JM",
    });

    if (result1.status !== "COMPLETE") {
      throw new Error(`FAIL Fixture 1: Status esperado COMPLETE, obtido ${result1.status}`);
    }
    if (result1.name !== "Smartphone Galaxy Ultra 256GB 5G") {
      throw new Error(`FAIL Fixture 1: Nome incorreto: ${result1.name}`);
    }
    if (result1.price !== 3999.0 || result1.currency !== "BRL") {
      throw new Error(`FAIL Fixture 1: Preço/Moeda incorretos: ${result1.price} ${result1.currency}`);
    }
    if (result1.brand !== "Samsung" || result1.seller !== "Loja Oficial Samsung") {
      throw new Error(`FAIL Fixture 1: Brand/Seller incorretos: ${result1.brand} / ${result1.seller}`);
    }
    if (result1.externalProductId !== "MLB1234567890") {
      throw new Error(`FAIL Fixture 1: externalProductId incorreto: ${result1.externalProductId}`);
    }
    if (result1.metadataSource !== "JSON_LD") {
      throw new Error(`FAIL Fixture 1: metadataSource incorreto: ${result1.metadataSource}`);
    }
    if (!result1.fetchedAt || !(result1.fetchedAt instanceof Date)) {
      throw new Error("FAIL Fixture 1: fetchedAt inválido.");
    }
    if (!result1.warnings.some((w) => w.includes("snapshot"))) {
      throw new Error("FAIL Fixture 1: Aviso de preço snapshot ausente.");
    }
    console.log("✓ Check 1 PASS: Fixture JSON-LD extraída com sucesso (status COMPLETE, snapshot e MLB ID).");

    // 2. Fixture 2: OpenGraph & Meta Tags (COMPLETE)
    console.log("\n--- Check 2: Fixture 2 - OpenGraph / Meta Tags (COMPLETE) ---");
    const ogHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fone Sem Fio Pro - Mercado Livre</title>
        <link rel="canonical" href="https://produto.mercadolivre.com.br/MLB-888999111-fone-sem-fio" />
        <meta property="og:title" content="Fone De Ouvido Sem Fio Bluetooth Noise Cancelling" />
        <meta property="og:description" content="Fone premium com autonomia de 40 horas e microfone integrado." />
        <meta property="og:image" content="https://http2.mlstatic.com/fone-img.jpg" />
        <meta property="product:price:amount" content="249.90" />
        <meta property="product:price:currency" content="BRL" />
        <meta property="product:brand" content="AudioTech" />
        <meta property="og:site_name" content="Mercado Livre" />
      </head>
      <body></body>
      </html>
    `;

    const result2 = extractProductMetadata(ogHtml, {
      affiliateUrl: "https://meli.la/fone-pro",
      resolvedUrl: "https://produto.mercadolivre.com.br/MLB-888999111-fone-sem-fio",
    });

    if (result2.status !== "COMPLETE") {
      throw new Error(`FAIL Fixture 2: Status esperado COMPLETE, obtido ${result2.status}`);
    }
    if (result2.name !== "Fone De Ouvido Sem Fio Bluetooth Noise Cancelling") {
      throw new Error(`FAIL Fixture 2: Nome incorreto: ${result2.name}`);
    }
    if (result2.price !== 249.9) {
      throw new Error(`FAIL Fixture 2: Preço incorreto: ${result2.price}`);
    }
    if (result2.brand !== "AudioTech" || result2.metadataSource !== "OPEN_GRAPH") {
      throw new Error(`FAIL Fixture 2: Metadados OpenGraph incorretos.`);
    }
    if (result2.externalProductId !== "MLB888999111") {
      throw new Error(`FAIL Fixture 2: externalProductId incorreto: ${result2.externalProductId}`);
    }
    console.log("✓ Check 2 PASS: Fixture OpenGraph extraída com sucesso (status COMPLETE).");

    // 3. Fixture 3: Partial Content (PARTIAL)
    console.log("\n--- Check 3: Fixture 3 - Conteúdo Parcial sem Preço/Imagem (PARTIAL) ---");
    const partialHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teclado Mecânico Gamer RGB - Mercado Livre</title>
        <meta name="description" content="Teclado switch blue para jogos e digitação rápida." />
      </head>
      <body>
        <h1>Teclado Mecânico Gamer RGB</h1>
      </body>
      </html>
    `;

    const result3 = extractProductMetadata(partialHtml, {
      affiliateUrl: "https://mercadolivre.com/sec/teclado-rgb",
      externalProductId: "MLB555444333",
    });

    if (result3.status !== "PARTIAL") {
      throw new Error(`FAIL Fixture 3: Status esperado PARTIAL, obtido ${result3.status}`);
    }
    if (!result3.name || result3.imageUrl !== undefined || result3.price !== undefined) {
      throw new Error("FAIL Fixture 3: Inconsistência nos campos parciais.");
    }
    if (result3.warnings.length === 0) {
      throw new Error("FAIL Fixture 3: Warnings devem indicar dados ausentes.");
    }
    console.log("✓ Check 3 PASS: Conteúdo parcial classificado como PARTIAL com warnings claros.");

    // 4. Fixture 4: Empty / Ineligible HTML (FAILED)
    console.log("\n--- Check 4: Fixture 4 - Página Bloqueada / Sem Título (FAILED) ---");
    const failedHtml = `
      <!DOCTYPE html>
      <html>
      <head><title></title></head>
      <body><div>Erro 404 - Página não encontrada</div></body>
      </html>
    `;

    const result4 = extractProductMetadata(failedHtml, {
      affiliateUrl: "https://mercadolivre.com/sec/link-invalido",
    });

    if (result4.status !== "FAILED") {
      throw new Error(`FAIL Fixture 4: Status esperado FAILED, obtido ${result4.status}`);
    }
    console.log("✓ Check 4 PASS: Página inválida classificada como FAILED com segurança.");

    // 5. Provider End-to-End Validation
    console.log("\n--- Check 5: Provider fetchProductMetadata Validação de Entrada Inválida ---");
    const meliProvider = new MercadoLivreAffiliateProvider();
    const badUrlResult = await meliProvider.fetchProductMetadata({
      affiliateUrl: "https://site-malicioso.com/item",
    });

    if (badUrlResult.status !== "FAILED") {
      throw new Error("FAIL: fetchProductMetadata aceitou domínio fora da allowlist.");
    }
    console.log("✓ Check 5 PASS: Provider rejeita URLs fora da allowlist como status FAILED com segurança.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 104 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 104:", error);
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
