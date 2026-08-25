import {
  extractProductMetadata,
} from "@/lib/affiliate";

async function run() {
  console.log("=== TEST: Task 150 - Affiliate Import Enrichment ===");

  try {
    // 1. Check 1: Enriched JSON-LD with Specs, AggregateRating, Category and OldPrice (COMPLETE)
    console.log("\n--- Check 1: Fixture Enriquecida JSON-LD (Specs, Rating, Categoria, OldPrice) ---");
    const jsonLdEnrichedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monitor Gamer Curvo 34 OLED - Mercado Livre</title>
        <link rel="canonical" href="https://produto.mercadolivre.com.br/MLB-9988776655-monitor-oled" />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Monitor Gamer Curvo 34 Polegadas OLED WQHD 175Hz",
          "image": "https://http2.mlstatic.com/monitor-oled.webp",
          "description": "Experiência imersiva definitiva com painel QD-OLED, 0.03ms e cores vibrantes.",
          "brand": {
            "@type": "Brand",
            "name": "Alienware"
          },
          "sku": "MLB9988776655",
          "category": "Monitores Gamers",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "240",
            "ratingCount": "240"
          },
          "additionalProperty": [
            {
              "@type": "PropertyValue",
              "name": "Tamanho da tela",
              "value": "34 polegadas"
            },
            {
              "@type": "PropertyValue",
              "name": "Taxa de atualização",
              "value": "175 Hz"
            },
            {
              "@type": "PropertyValue",
              "name": "Resolução",
              "value": "3440 x 1440 WQHD"
            }
          ],
          "offers": {
            "@type": "Offer",
            "price": "6499.00",
            "highPrice": "7999.00",
            "priceCurrency": "BRL",
            "seller": {
              "@type": "Organization",
              "name": "Loja Oficial Dell"
            },
            "availability": "https://schema.org/InStock"
          }
        }
        </script>
      </head>
      <body>
        <h1>Monitor Gamer Curvo 34 Polegadas OLED WQHD 175Hz</h1>
      </body>
      </html>
    `;

    const result1 = extractProductMetadata(jsonLdEnrichedHtml, {
      affiliateUrl: "https://mercadolivre.com/sec/monitor-oled",
      resolvedUrl: "https://produto.mercadolivre.com.br/MLB-9988776655-monitor-oled",
    });

    if (result1.status !== "COMPLETE") {
      throw new Error(`FAIL Check 1: Status esperado COMPLETE, obtido ${result1.status}`);
    }
    if (result1.name !== "Monitor Gamer Curvo 34 Polegadas OLED WQHD 175Hz") {
      throw new Error(`FAIL Check 1: Nome incorreto: ${result1.name}`);
    }
    if (result1.sourceDescription !== "Experiência imersiva definitiva com painel QD-OLED, 0.03ms e cores vibrantes.") {
      throw new Error(`FAIL Check 1: sourceDescription incorreto: ${result1.sourceDescription}`);
    }
    if (result1.brand !== "Alienware") {
      throw new Error(`FAIL Check 1: brand incorreto: ${result1.brand}`);
    }
    if (result1.marketplaceCategoryName !== "Monitores Gamers") {
      throw new Error(`FAIL Check 1: marketplaceCategoryName incorreto: ${result1.marketplaceCategoryName}`);
    }
    if (result1.sourceRating !== 4.9 || result1.sourceReviewCount !== 240) {
      throw new Error(`FAIL Check 1: Rating/Count incorretos: ${result1.sourceRating} (${result1.sourceReviewCount})`);
    }
    if (!result1.sourceSpecs || result1.sourceSpecs["Tamanho da tela"] !== "34 polegadas" || result1.sourceSpecs["Taxa de atualização"] !== "175 Hz") {
      throw new Error(`FAIL Check 1: sourceSpecs incorretos: ${JSON.stringify(result1.sourceSpecs)}`);
    }
    if (result1.price !== 6499.0 || result1.oldPrice !== 7999.0) {
      throw new Error(`FAIL Check 1: Preço/OldPrice incorretos: ${result1.price} / ${result1.oldPrice}`);
    }
    if (result1.seller !== "Loja Oficial Dell") {
      throw new Error(`FAIL Check 1: Seller incorreto: ${result1.seller}`);
    }
    if (result1.externalProductId !== "MLB9988776655") {
      throw new Error(`FAIL Check 1: externalProductId incorreto: ${result1.externalProductId}`);
    }

    console.log("✓ Check 1 PASS: Extração enriquecida de JSON-LD validada com sucesso (descrição, specs, rating, categoria, seller, preços).");

    // 2. Check 2: HTML Fallbacks for Specs Table, Breadcrumb Category & Review Rating
    console.log("\n--- Check 2: Fixture HTML Fallbacks (Tabela de Specs, Breadcrumb, Rating e Reviews) ---");
    const htmlEnrichedDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cadeira Ergonômica Pro - Mercado Livre</title>
        <meta property="og:title" content="Cadeira Ergonômica Presidente Mesh Com Braços 3D" />
        <meta property="og:image" content="https://http2.mlstatic.com/cadeira-pro.jpg" />
        <meta property="product:price:amount" content="1299.90" />
        <meta property="product:price:currency" content="BRL" />
        <meta property="product:brand" content="ErgoPlus" />
      </head>
      <body>
        <nav class="andes-breadcrumb">
          <ol>
            <li><a href="/moveis">Móveis</a></li>
            <li><a href="/escritorio">Escritório</a></li>
            <li><a href="/cadeiras-presidente">Cadeiras Presidente</a></li>
          </ol>
        </nav>

        <span class="ui-pdp-review__rating">4.7</span>
        <span class="ui-pdp-review__amount">(85)</span>

        <div class="ui-pdp-description__content">
          Cadeira ergonômica premium com suporte lombar ajustável e encosto de cabeça.
        </div>

        <table class="andes-table">
          <tr class="andes-table__row">
            <th class="andes-table__header">Material do encosto</th>
            <td class="andes-table__column">Mesh respirável</td>
          </tr>
          <tr class="andes-table__row">
            <th class="andes-table__header">Peso máximo suportado</th>
            <td class="andes-table__column">150 kg</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const result2 = extractProductMetadata(htmlEnrichedDoc, {
      affiliateUrl: "https://meli.la/cadeira-pro",
      resolvedUrl: "https://produto.mercadolivre.com.br/MLB-7766554433-cadeira-pro",
    });

    if (result2.status !== "COMPLETE") {
      throw new Error(`FAIL Check 2: Status esperado COMPLETE, obtido ${result2.status}`);
    }
    if (result2.marketplaceCategoryName !== "Cadeiras Presidente") {
      throw new Error(`FAIL Check 2: Categoria por breadcrumb incorreta: ${result2.marketplaceCategoryName}`);
    }
    if (result2.sourceRating !== 4.7 || result2.sourceReviewCount !== 85) {
      throw new Error(`FAIL Check 2: Rating/Review count incorretos: ${result2.sourceRating} (${result2.sourceReviewCount})`);
    }
    if (!result2.sourceSpecs || result2.sourceSpecs["Material do encosto"] !== "Mesh respirável" || result2.sourceSpecs["Peso máximo suportado"] !== "150 kg") {
      throw new Error(`FAIL Check 2: Specs HTML incorretas: ${JSON.stringify(result2.sourceSpecs)}`);
    }
    if (!result2.sourceDescription || !result2.sourceDescription.includes("suporte lombar")) {
      throw new Error(`FAIL Check 2: sourceDescription HTML incorreto: ${result2.sourceDescription}`);
    }

    console.log("✓ Check 2 PASS: Extração de enriquecimentos HTML (specs, breadcrumb, rating) validada com sucesso.");

    // 3. Check 3: Partial and Failed classification consistency
    console.log("\n--- Check 3: Validação de Classificação de Status (PARTIAL e FAILED) ---");
    const partialDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mouse Sem Fio Básico - Mercado Livre</title>
      </head>
      <body>
        <h1>Mouse Sem Fio Básico</h1>
      </body>
      </html>
    `;
    const result3 = extractProductMetadata(partialDoc, {
      affiliateUrl: "https://mercadolivre.com/sec/mouse",
    });
    if (result3.status !== "PARTIAL") {
      throw new Error(`FAIL Check 3: Status esperado PARTIAL, obtido ${result3.status}`);
    }

    const failedDoc = `
      <!DOCTYPE html>
      <html><body><div>Sem produto</div></body></html>
    `;
    const result4 = extractProductMetadata(failedDoc, {
      affiliateUrl: "https://mercadolivre.com/sec/nada",
    });
    if (result4.status !== "FAILED") {
      throw new Error(`FAIL Check 3: Status esperado FAILED, obtido ${result4.status}`);
    }

    console.log("✓ Check 3 PASS: Status PARTIAL e FAILED classificados corretamente.");

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DA TASK 150 PASSARAM COM SUCESSO!");
    console.log("=======================================================");
  } catch (error) {
    console.error("\n❌ ERRO NA EXECUÇÃO DOS TESTES DA TASK 150:", error);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
