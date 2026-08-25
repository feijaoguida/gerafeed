import { NormalizedProductImport, ProductImportStatus, ReviewSample } from "./types";

export interface RawExtractedMetadata {
  name?: string;
  brand?: string;
  description?: string;
  sourceDescription?: string;
  imageUrl?: string;
  specs?: Record<string, string>;
  sourceSpecs?: Record<string, string>;
  marketplaceCategoryId?: string;
  marketplaceCategoryName?: string;
  sourceRating?: number;
  sourceReviewCount?: number;
  reviewSamples?: ReviewSample[];
  seller?: string;
  price?: number;
  oldPrice?: number;
  currency?: string;
  canonicalUrl?: string;
  externalProductId?: string;
  source: string;
}

/**
 * Strips HTML tags and decodes common HTML entities.
 */
function cleanText(text?: string | null): string | undefined {
  if (!text) return undefined;
  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0 ? stripped : undefined;
}

/**
 * Normalizes price number from strings or numbers.
 */
function parsePrice(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val) && val > 0) return val;
  if (typeof val === "string") {
    // Handle formats like "R$ 1.299,90", "1299.90", "1,299.90"
    const cleaned = val
      .replace(/[^\d.,]/g, "")
      .replace(/\.(?=\d{3}(?:[.,]|$))/g, "") // remove thousand dots
      .replace(",", "."); // convert comma decimal to dot
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

/**
 * Normalizes rating number (e.g. 4.8 out of 5).
 */
function parseRating(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val) && val >= 0 && val <= 5) return val;
  if (typeof val === "string") {
    const cleaned = val.replace(",", ".").replace(/[^\d.]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) return parsed;
  }
  return undefined;
}

/**
 * Normalizes integer count (e.g. review count).
 */
function parseCount(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val) && val >= 0) return Math.floor(val);
  if (typeof val === "string") {
    const cleaned = val.replace(/[^\d]/g, "");
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

/**
 * Sanitizes author names to prevent collecting unnecessary PII.
 * Strips emails, phone numbers, and truncates to first name/initials.
 */
function sanitizeAuthorName(raw?: string | null): string | undefined {
  const cleaned = cleanText(raw);
  if (!cleaned) return undefined;
  // Remove emails, phone numbers, and long numeric sequences
  const noEmail = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/g, "");
  const noPhone = noEmail.replace(/\+?\d[\d -]{7,}\d/g, "");
  const parts = noPhone.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return undefined;
  const firstName = parts[0];
  const initial = parts.length > 1 && parts[1] ? ` ${parts[1][0].toUpperCase()}.` : "";
  return (firstName + initial).slice(0, 30);
}

/**
 * Extracts JSON-LD structured data from HTML.
 */
function extractJsonLd(html: string): RawExtractedMetadata | null {
  const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  let productResult: RawExtractedMetadata | null = null;
  let breadcrumbCategory: { id?: string; name?: string } | null = null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const rawContent = match[1].trim();
      const data = JSON.parse(rawContent);

      const items = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const itemType = item["@type"];

        // Handle BreadcrumbList for Category
        if (itemType === "BreadcrumbList" && Array.isArray(item.itemListElement)) {
          const elements = item.itemListElement;
          if (elements.length > 0) {
            // Get the deepest category breadcrumb
            const lastBreadcrumb = elements[elements.length - 1];
            const candidateName =
              typeof lastBreadcrumb.name === "string"
                ? cleanText(lastBreadcrumb.name)
                : typeof lastBreadcrumb.item === "object" && lastBreadcrumb.item?.name
                ? cleanText(lastBreadcrumb.item.name)
                : undefined;

            const candidateUrl =
              typeof lastBreadcrumb.item === "string"
                ? lastBreadcrumb.item
                : typeof lastBreadcrumb.item === "object" && lastBreadcrumb.item?.["@id"]
                ? lastBreadcrumb.item["@id"]
                : undefined;

            if (candidateName) {
              const catIdMatch = candidateUrl ? candidateUrl.match(/MLB\d+/i) : null;
              breadcrumbCategory = {
                name: candidateName,
                id: catIdMatch ? catIdMatch[0].toUpperCase() : undefined,
              };
            }
          }
        }

        const isProduct =
          itemType === "Product" ||
          itemType === "IndividualProduct" ||
          (Array.isArray(itemType) && itemType.includes("Product"));

        if (isProduct && !productResult) {
          const name = cleanText(item.name);
          const description = cleanText(item.description);

          // Image extraction
          let imageUrl: string | undefined;
          if (typeof item.image === "string") {
            imageUrl = item.image;
          } else if (Array.isArray(item.image) && typeof item.image[0] === "string") {
            imageUrl = item.image[0];
          } else if (item.image && typeof item.image === "object" && item.image.url) {
            imageUrl = item.image.url;
          }

          // Brand extraction
          let brand: string | undefined;
          if (typeof item.brand === "string") {
            brand = cleanText(item.brand);
          } else if (item.brand && typeof item.brand === "object" && item.brand.name) {
            brand = cleanText(item.brand.name);
          }

          // Offers extraction
          let price: number | undefined;
          let oldPrice: number | undefined;
          let currency: string | undefined;
          let seller: string | undefined;

          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offer && typeof offer === "object") {
            price = parsePrice(offer.price || offer.lowPrice);
            if (offer.highPrice) {
              oldPrice = parsePrice(offer.highPrice);
            } else if (offer.priceSpecification && typeof offer.priceSpecification === "object") {
              oldPrice = parsePrice(offer.priceSpecification.price);
            }
            if (offer.priceCurrency) currency = String(offer.priceCurrency).toUpperCase();
            if (typeof offer.seller === "string") {
              seller = cleanText(offer.seller);
            } else if (offer.seller && typeof offer.seller === "object" && offer.seller.name) {
              seller = cleanText(offer.seller.name);
            }
          }

          // Ratings extraction
          let sourceRating: number | undefined;
          let sourceReviewCount: number | undefined;
          if (item.aggregateRating && typeof item.aggregateRating === "object") {
            sourceRating = parseRating(item.aggregateRating.ratingValue);
            sourceReviewCount = parseCount(
              item.aggregateRating.reviewCount || item.aggregateRating.ratingCount
            );
          }

          // Specs (additionalProperty) extraction
          let sourceSpecs: Record<string, string> | undefined;
          if (Array.isArray(item.additionalProperty)) {
            const specsMap: Record<string, string> = {};
            for (const prop of item.additionalProperty) {
              if (prop && typeof prop === "object" && prop.name && prop.value) {
                const key = cleanText(String(prop.name));
                const val = cleanText(String(prop.value));
                if (key && val) {
                  specsMap[key] = val;
                }
              }
            }
            if (Object.keys(specsMap).length > 0) {
              sourceSpecs = specsMap;
            }
          }

          // Category from product schema
          let marketplaceCategoryName: string | undefined;
          let marketplaceCategoryId: string | undefined;
          if (typeof item.category === "string") {
            marketplaceCategoryName = cleanText(item.category);
          } else if (item.category && typeof item.category === "object" && item.category.name) {
            marketplaceCategoryName = cleanText(item.category.name);
            if (item.category.identifier || item.category["@id"]) {
              marketplaceCategoryId = cleanText(item.category.identifier || item.category["@id"]);
            }
          }

          // Reviews extraction (max 5 samples)
          let reviewSamples: ReviewSample[] | undefined;
          const reviewsRaw = Array.isArray(item.review)
            ? item.review
            : item.review && typeof item.review === "object"
            ? [item.review]
            : [];

          if (reviewsRaw.length > 0) {
            const parsedReviews: ReviewSample[] = [];
            for (const r of reviewsRaw) {
              if (!r || typeof r !== "object") continue;
              const text = cleanText(r.reviewBody || r.description || r.comment);
              if (!text || text.length < 5) continue;

              const title = cleanText(r.name || r.headline);
              const rating = parseRating(r.reviewRating?.ratingValue || r.ratingValue);
              const authorName = sanitizeAuthorName(
                typeof r.author === "string" ? r.author : r.author?.name
              );

              parsedReviews.push({
                rating,
                title,
                text,
                authorName,
                capturedAt: new Date(),
              });

              if (parsedReviews.length >= 5) break;
            }

            if (parsedReviews.length > 0) {
              reviewSamples = parsedReviews;
            }
          }

          const externalProductId = item.sku || item.mpn || item.productID;

          productResult = {
            name,
            brand,
            description,
            sourceDescription: description,
            imageUrl,
            specs: sourceSpecs,
            sourceSpecs,
            marketplaceCategoryId,
            marketplaceCategoryName,
            sourceRating,
            sourceReviewCount,
            reviewSamples,
            seller,
            price,
            oldPrice,
            currency: currency || "BRL",
            externalProductId: typeof externalProductId === "string" ? externalProductId : undefined,
            source: "JSON_LD",
          };
        }
      }
    } catch {
      // Ignore JSON parse errors in invalid scripts
    }
  }

  if (productResult) {
    if (!productResult.marketplaceCategoryName && breadcrumbCategory) {
      productResult.marketplaceCategoryName = breadcrumbCategory.name;
      productResult.marketplaceCategoryId = breadcrumbCategory.id;
    }
    return productResult;
  }

  return null;
}

/**
 * Extracts OpenGraph and HTML Meta tags from HTML.
 */
function extractMetaTags(html: string): RawExtractedMetadata {
  const getMeta = (prop: string): string | undefined => {
    const reg = new RegExp(`<meta\\s+[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
    const match = reg.exec(html);
    if (match) return cleanText(match[1]);

    const regReverse = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
    const matchReverse = regReverse.exec(html);
    if (matchReverse) return cleanText(matchReverse[1]);

    return undefined;
  };

  const name =
    getMeta("og:title") ||
    getMeta("twitter:title") ||
    (() => {
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
      return titleMatch ? cleanText(titleMatch[1]) : undefined;
    })();

  const description = getMeta("og:description") || getMeta("description") || getMeta("twitter:description");
  const imageUrl = getMeta("og:image") || getMeta("twitter:image");
  const brand = getMeta("product:brand") || getMeta("og:brand");
  const seller = getMeta("og:site_name");
  const price = parsePrice(getMeta("product:price:amount") || getMeta("og:price:amount"));
  const oldPrice = parsePrice(getMeta("product:original_price:amount") || getMeta("product:old_price:amount"));
  const currency = getMeta("product:price:currency") || getMeta("og:price:currency") || "BRL";
  const marketplaceCategoryName = getMeta("product:category") || getMeta("og:category");

  // Rating and review count from meta tags
  const sourceRating = parseRating(getMeta("product:rating:average") || getMeta("rating") || getMeta("twitter:data1"));
  const sourceReviewCount = parseCount(getMeta("product:rating:count") || getMeta("review_count"));

  // Canonical link
  let canonicalUrl: string | undefined;
  const canonicalMatch = /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i.exec(html);
  if (canonicalMatch) {
    canonicalUrl = canonicalMatch[1].trim();
  }

  return {
    name,
    description,
    sourceDescription: description,
    imageUrl,
    brand,
    seller,
    price,
    oldPrice,
    currency,
    marketplaceCategoryName,
    sourceRating,
    sourceReviewCount,
    canonicalUrl,
    source: "OPEN_GRAPH",
  };
}

/**
 * Extracts additional enrichments directly from HTML elements (tables, breadcrumbs, rating containers, seller, price, highlights).
 */
function extractHtmlEnrichments(html: string): Partial<RawExtractedMetadata> {
  const result: Partial<RawExtractedMetadata> = {};
  const specs: Record<string, string> = {};

  // 1. HTML Specs extraction from standard Mercado Livre tables and spec containers
  const rowRegex = /<tr[^>]*>[\s\S]*?<t[hd][^>]*>([\s\S]*?)<\/t[hd]>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const key = cleanText(rowMatch[1]);
    const val = cleanText(rowMatch[2]);
    if (key && val && key.length < 100 && val.length < 500) {
      specs[key] = val;
    }
  }

  // Fallback for specs in div pairs (e.g. andes-table or ui-pdp-specs__table)
  const divSpecRegex = /<div[^>]*class=["'][^"']*(?:ui-pdp-specs__table__row|andes-table__row|ui-vpp-specs__attribute)[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*(?:title|key)[^"']*["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*class=["'][^"']*(?:value|val)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
  let divSpecMatch: RegExpExecArray | null;
  while ((divSpecMatch = divSpecRegex.exec(html)) !== null) {
    const key = cleanText(divSpecMatch[1]);
    const val = cleanText(divSpecMatch[2]);
    if (key && val && key.length < 100 && val.length < 500 && !specs[key]) {
      specs[key] = val;
    }
  }

  // 2. Color / Variation extraction (ex: "Cor: Azul-escuro")
  const colorMatch = /class=["'][^"']*(?:ui-pdp-variations__selected-label|color-picker__title|variations__label)[^"']*["'][^>]*>([\s\S]*?)<\//i.exec(html);
  if (colorMatch) {
    const colorText = cleanText(colorMatch[1]);
    if (colorText) {
      if (colorText.toLowerCase().includes("cor:")) {
        const parts = colorText.split(":");
        if (parts[1]?.trim()) specs["Cor"] = parts[1].trim();
      } else {
        specs["Cor"] = colorText;
      }
    }
  }

  // 3. Bloco "O que você precisa saber sobre este produto" (Highlights list)
  const highlightsListMatch = /class=["'][^"']*(?:ui-pdp-highlights__list|ui-vpp-highlight-specs__list|ui-pdp-features__highlight-list)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html);
  if (highlightsListMatch) {
    const liMatches = [...highlightsListMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    const items = liMatches.map((m) => cleanText(m[1])).filter((t): t is string => !!t && t.length > 2);
    if (items.length > 0) {
      specs["O que você precisa saber"] = items.map((it) => `• ${it}`).join("\n");
    }
  }

  if (Object.keys(specs).length > 0) {
    result.sourceSpecs = specs;
    result.specs = specs;
    if (specs["Marca"]) {
      result.brand = specs["Marca"];
    }
  }

  // 4. Seller / Loja Oficial extraction
  const sellerMatch =
    /class=["'][^"']*(?:ui-pdp-seller__link-trigger|official-store-info|ui-seller-info|ui-pdp-seller__header__title)[^"']*["'][^>]*>([\s\S]*?)<\//i.exec(html) ||
    /<a[^>]*href=["'][^"']*(?:\/loja\/|\/perfil\/)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i.exec(html);
  if (sellerMatch) {
    let rawSeller = cleanText(sellerMatch[1]);
    if (rawSeller) {
      rawSeller = rawSeller.replace(/^Acesse a Loja Oficial de\s+/i, "").replace(/^Loja Oficial\s+/i, "").trim();
      if (rawSeller) result.seller = rawSeller;
    }
  }

  // 5. Price & Old Price extraction
  const mainPriceMatch = /class=["'][^"']*(?:ui-pdp-price__part--medium|ui-pdp-price__second-line|price-tag-amount)[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*andes-money-amount__fraction[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(html);
  if (mainPriceMatch) {
    const priceVal = parsePrice(mainPriceMatch[1]);
    if (priceVal !== undefined) result.price = priceVal;
  }

  const oldPriceMatch = /class=["'][^"']*(?:ui-pdp-price__original-value|price-tag-del)[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["'][^"']*andes-money-amount__fraction[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(html);
  if (oldPriceMatch) {
    const oldPriceVal = parsePrice(oldPriceMatch[1]);
    if (oldPriceVal !== undefined) result.oldPrice = oldPriceVal;
  }

  // 6. HTML Breadcrumb Category extraction
  const breadcrumbMatch = /<nav[^>]*class=["'][^"']*andes-breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i.exec(html);
  if (breadcrumbMatch) {
    const itemMatches = [...breadcrumbMatch[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)];
    if (itemMatches.length > 0) {
      const lastItem = itemMatches[itemMatches.length - 1];
      const catName = cleanText(lastItem[1]);
      if (catName) {
        result.marketplaceCategoryName = catName;
      }
    }
  }

  // 7. HTML Rating extraction
  const ratingMatch = /class=["'][^"']*(?:ui-pdp-review__rating|ui-review-capability__rating__average)[^"']*["'][^>]*>([\s\S]*?)<\//i.exec(html);
  if (ratingMatch) {
    const ratingVal = parseRating(ratingMatch[1]);
    if (ratingVal !== undefined) {
      result.sourceRating = ratingVal;
    }
  }

  // 8. HTML Review count extraction
  const reviewCountMatch = /class=["'][^"']*(?:ui-pdp-review__amount|ui-review-capability__rating__label)[^"']*["'][^>]*>([\s\S]*?)<\//i.exec(html);
  if (reviewCountMatch) {
    const countVal = parseCount(reviewCountMatch[1]);
    if (countVal !== undefined) {
      result.sourceReviewCount = countVal;
    }
  }

  // 9. HTML Description extraction
  const descMatch =
    /id=["']description-section["'][^>]*>[\s\S]*?class=["'][^"']*(?:ui-pdp-description__content|item-description__text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
    /class=["'][^"']*(?:ui-pdp-description__content|item-description__text)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/i.exec(html);
  if (descMatch) {
    const descVal = cleanText(descMatch[1]);
    if (descVal && descVal.length > 10) {
      result.description = descVal;
      result.sourceDescription = descVal;
    }
  }

  // 10. AI Review summary & Review samples extraction
  const aiReviewSummaryMatch = /class=["'][^"']*(?:ui-review-capability__summary__content|ui-review-capability__summary)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i.exec(html);
  const aiReviewSummaryText = aiReviewSummaryMatch ? cleanText(aiReviewSummaryMatch[1]) : undefined;

  const htmlReviews: ReviewSample[] = [];
  if (aiReviewSummaryText) {
    htmlReviews.push({
      title: "Resumo de opiniões (IA)",
      text: aiReviewSummaryText,
      capturedAt: new Date(),
    });
  }

  const reviewCommentRegex = /class=["'][^"']*(?:ui-review-capability-comments__comment|ui-pdp-reviews__comment__content)[^"']*["'][^>]*>([\s\S]*?)<\//gi;
  let reviewCommentMatch: RegExpExecArray | null;
  while ((reviewCommentMatch = reviewCommentRegex.exec(html)) !== null && htmlReviews.length < 5) {
    const text = cleanText(reviewCommentMatch[1]);
    if (text && text.length > 5 && !htmlReviews.some((r) => r.text === text)) {
      htmlReviews.push({
        text,
        capturedAt: new Date(),
      });
    }
  }
  if (htmlReviews.length > 0) {
    result.reviewSamples = htmlReviews;
  }

  return result;
}

/**
 * Extracts embedded JSON states (such as Mercado Livre Social Showcase state `_n.ctx.r` or `window.__PRELOADED_STATE__`).
 */
function extractEmbeddedStateJson(html: string): Partial<RawExtractedMetadata> & { targetProductUrl?: string } {
  const result: Partial<RawExtractedMetadata> & { targetProductUrl?: string } = {};

  // 1. Check for Mercado Livre Social Showcase State (_n.ctx.r)
  const marker = "_n.ctx.r=";
  const startIdx = html.indexOf(marker);
  if (startIdx !== -1) {
    const jsonStart = startIdx + marker.length;
    const assetsIdx = html.indexOf(";_n.ctx.r.assets", jsonStart);
    const scriptEndIdx = html.indexOf(";</script>", jsonStart);
    let endIdx = assetsIdx !== -1 ? assetsIdx : scriptEndIdx;
    if (endIdx === -1) endIdx = html.indexOf("</script>", jsonStart);

    const rawJson = html.substring(jsonStart, endIdx);
    try {
      const data = JSON.parse(rawJson);
      const components = data.appProps?.pageProps?.data?.components || [];

      for (const comp of components) {
        const polycards =
          comp.recommendation_data?.recommendation_info?.polycards ||
          comp.recommendation_data?.polycards ||
          [];

        if (polycards.length > 0) {
          const card = polycards[0];

          if (card.pictures?.pictures?.[0]?.id) {
            result.imageUrl = `https://http2.mlstatic.com/D_NQ_NP_${card.pictures.pictures[0].id}-O.webp`;
          }

          if (card.metadata?.category_id) {
            result.marketplaceCategoryId = card.metadata.category_id;
          }

          if (card.metadata?.url) {
            let fullUrl = card.metadata.url;
            if (!fullUrl.startsWith("http")) fullUrl = `https://${fullUrl}`;
            result.targetProductUrl = fullUrl;
          }

          if (card.metadata?.id) {
            result.externalProductId = card.metadata.id;
          }

          if (Array.isArray(card.components)) {
            for (const subComp of card.components) {
              if (subComp.type === "title" && subComp.title?.text) {
                result.name = cleanText(subComp.title.text);
              } else if (subComp.type === "seller" && subComp.seller?.text) {
                let sellerText = cleanText(subComp.seller.text);
                if (sellerText) {
                  sellerText = sellerText.replace(/^Por\s+/i, "").replace(/\{icon_cockade\}/g, "").trim();
                  if (sellerText) result.seller = sellerText;
                }
              } else if (subComp.type === "price" && subComp.price) {
                if (subComp.price.current_price?.value) {
                  result.price = parsePrice(subComp.price.current_price.value);
                }
                if (subComp.price.previous_price?.value) {
                  result.oldPrice = parsePrice(subComp.price.previous_price.value);
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // 2. Check for standard Mercado Livre PRELOADED_STATE or NEXT_DATA
  const preloadedMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
  if (preloadedMatch) {
    try {
      const data = JSON.parse(preloadedMatch[1]);
      if (data.initialState?.components) {
        for (const key of Object.keys(data.initialState.components)) {
          const comp = data.initialState.components[key];
          if (comp.seller?.name) result.seller = cleanText(comp.seller.name);
          if (comp.price?.price) result.price = parsePrice(comp.price.price);
          if (comp.price?.original_price) result.oldPrice = parsePrice(comp.price.original_price);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return result;
}

/**
 * Extracts product metadata from raw HTML and normalizes into NormalizedProductImport.
 */
export function extractGalleryImages(html: string): string[] {
  const images: string[] = [];

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const script of jsonLdMatch) {
      const content = script.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
      try {
        const data = JSON.parse(content);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item && item["@type"] === "Product" && item.image) {
            const rawImgs = Array.isArray(item.image) ? item.image : [item.image];
            rawImgs.forEach((img: unknown) => {
              const url = typeof img === "string" ? img : (img as { url?: string })?.url;
              if (url && typeof url === "string" && !images.includes(url)) {
                images.push(url);
              }
            });
          }
        }
      } catch {}
    }
  }

  const mlStaticMatches = html.match(/https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[A-Za-z0-9_-]+/g) || [];
  for (const raw of mlStaticMatches) {
    const baseMatch = raw.match(/https:\/\/http2\.mlstatic\.com\/D_NQ_NP_(\d+-[A-Z0-9]+_\d+)/i);
    if (baseMatch) {
      const highRes = `https://http2.mlstatic.com/D_NQ_NP_${baseMatch[1]}-O.webp`;
      if (!images.includes(highRes)) {
        images.push(highRes);
      }
    }
  }

  return images.slice(0, 10);
}

export function extractProductMetadata(
  html: string,
  context: { affiliateUrl: string; resolvedUrl?: string; externalProductId?: string }
): NormalizedProductImport {
  const jsonLd = extractJsonLd(html);
  const embeddedState = extractEmbeddedStateJson(html);
  const metaTags = extractMetaTags(html);
  const htmlEnriched = extractHtmlEnrichments(html);

  // Combine specs from all sources
  const mergedSpecs: Record<string, string> = {
    ...(htmlEnriched.specs || {}),
    ...(metaTags.specs || {}),
    ...(jsonLd?.specs || {}),
  };

  const mergedSourceSpecs: Record<string, string> = {
    ...(htmlEnriched.sourceSpecs || {}),
    ...(metaTags.sourceSpecs || {}),
    ...(jsonLd?.sourceSpecs || {}),
  };

  // Combine data prioritizing JSON-LD > Embedded State > HTML Enriched > Meta Tags
  const name = jsonLd?.name || embeddedState.name || metaTags.name;
  const sourceDescription = jsonLd?.sourceDescription || htmlEnriched.sourceDescription || metaTags.sourceDescription;
  const description = jsonLd?.description || htmlEnriched.description || metaTags.description;
  const imageUrl = jsonLd?.imageUrl || embeddedState.imageUrl || metaTags.imageUrl;
  const brand = jsonLd?.brand || htmlEnriched.brand || metaTags.brand;
  const seller = jsonLd?.seller || embeddedState.seller || htmlEnriched.seller || metaTags.seller;
  const price =
    jsonLd?.price !== undefined
      ? jsonLd.price
      : embeddedState.price !== undefined
      ? embeddedState.price
      : htmlEnriched.price !== undefined
      ? htmlEnriched.price
      : metaTags.price;
  const oldPrice =
    jsonLd?.oldPrice !== undefined
      ? jsonLd.oldPrice
      : embeddedState.oldPrice !== undefined
      ? embeddedState.oldPrice
      : htmlEnriched.oldPrice !== undefined
      ? htmlEnriched.oldPrice
      : metaTags.oldPrice;
  const currency = jsonLd?.currency || metaTags.currency || "BRL";
  const canonicalUrl = metaTags.canonicalUrl;
  const sourceSpecs = Object.keys(mergedSourceSpecs).length > 0 ? mergedSourceSpecs : undefined;
  const specs = Object.keys(mergedSpecs).length > 0 ? mergedSpecs : undefined;
  const marketplaceCategoryId = jsonLd?.marketplaceCategoryId || embeddedState.marketplaceCategoryId || htmlEnriched.marketplaceCategoryId;
  const marketplaceCategoryName =
    jsonLd?.marketplaceCategoryName || htmlEnriched.marketplaceCategoryName || metaTags.marketplaceCategoryName;
  const sourceRating = jsonLd?.sourceRating ?? htmlEnriched.sourceRating ?? metaTags.sourceRating;
  const sourceReviewCount = jsonLd?.sourceReviewCount ?? htmlEnriched.sourceReviewCount ?? metaTags.sourceReviewCount;
  const reviewSamples = (jsonLd?.reviewSamples && jsonLd.reviewSamples.length > 0)
    ? jsonLd.reviewSamples.slice(0, 5)
    : htmlEnriched.reviewSamples?.slice(0, 5);

  const metadataSource = jsonLd ? "JSON_LD" : embeddedState.name ? "EMBEDDED_STATE" : metaTags.name ? "OPEN_GRAPH" : "HTML_FALLBACK";

  // Extract externalProductId if present in MLB format
  let externalProductId = context.externalProductId || jsonLd?.externalProductId || embeddedState.externalProductId;
  if (!externalProductId) {
    const allUrls = `${context.resolvedUrl || ""} ${context.affiliateUrl} ${canonicalUrl || ""}`;
    const mlbMatch = allUrls.match(/(MLB-?\d+)/i);
    if (mlbMatch) {
      externalProductId = mlbMatch[1].replace("-", "").toUpperCase();
    }
  }

  // Determine status
  let status: ProductImportStatus = "FAILED";
  const warnings: string[] = [];

  if (name && name.length > 3) {
    if (imageUrl && (price !== undefined || oldPrice !== undefined || brand || description || sourceSpecs)) {
      status = "COMPLETE";
    } else {
      status = "PARTIAL";
      if (!imageUrl) warnings.push("Imagem principal do produto não identificada automaticamente.");
      if (price === undefined) warnings.push("Preço não identificado automaticamente.");
    }
  } else {
    status = "FAILED";
    warnings.push("Não foi possível identificar o título/nome do produto a partir da URL.");
  }

  if (price !== undefined) {
    warnings.push("O preço importado é um snapshot pontual e pode variar no marketplace.");
  }

  const extractedImages = extractGalleryImages(html);
  const galleryImages = extractedImages.length > 0 ? extractedImages : imageUrl ? [imageUrl] : undefined;

  return {
    status,
    externalProductId,
    affiliateUrl: context.affiliateUrl,
    resolvedUrl: context.resolvedUrl,
    canonicalUrl,
    name,
    brand,
    description,
    sourceDescription,
    marketplaceCategoryId,
    marketplaceCategoryName,
    imageUrl: galleryImages?.[0] || imageUrl,
    images: galleryImages,
    specs,
    sourceSpecs,
    sourceRating,
    sourceReviewCount,
    reviewSamples,
    seller,
    price,
    oldPrice,
    currency,
    metadataSource,
    targetProductUrl: embeddedState.targetProductUrl,
    fetchedAt: new Date(),
    warnings,
  };
}
