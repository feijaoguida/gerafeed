import {
  AffiliateProvider,
  AffiliateProviderCapabilities,
  AffiliateUrlValidationResult,
  ResolvedAffiliateLink,
  ProductMetadataInput,
  NormalizedProductImport,
} from "./types";
import { SafeUrlResolver } from "./resolver";
import { extractProductMetadata } from "./metadata-extractor";

export const MERCADO_LIVRE_HOSTS = [
  "mercadolivre.com.br",
  "www.mercadolivre.com.br",
  "produto.mercadolivre.com.br",
  "mercadolivre.com",
  "www.mercadolivre.com",
  "mercadolibre.com",
  "www.mercadolibre.com",
  "meli.la",
  "mpago.li",
  "mercadopago.com.br",
  "www.mercadopago.com.br",
];

export class MercadoLivreAffiliateProvider implements AffiliateProvider {
  readonly code = "MERCADO_LIVRE";
  readonly name = "Mercado Livre";

  capabilities(): AffiliateProviderCapabilities {
    return {
      automaticAffiliateLinkGeneration: false,
      affiliateLinkImport: true,
      productMetadataImport: true,
      supportsTrackingLabel: true,
    };
  }

  async validateAffiliateUrl(rawUrl: string): Promise<AffiliateUrlValidationResult> {
    if (!rawUrl || typeof rawUrl !== "string") {
      return { valid: false, error: "URL inválida ou ausente." };
    }

    const trimmed = rawUrl.trim();
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { valid: false, error: "Formato de URL inválido." };
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Protocolo não suportado. Utilize HTTP ou HTTPS." };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isMeliHost = MERCADO_LIVRE_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );

    if (!isMeliHost) {
      return {
        valid: false,
        error: `O domínio ${hostname} não é um domínio reconhecido do Mercado Livre.`,
      };
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
    };
  }

  async resolveAffiliateUrl(rawUrl: string): Promise<ResolvedAffiliateLink> {
    const validation = await this.validateAffiliateUrl(rawUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      throw new Error(validation.error || "URL de afiliado inválida para o Mercado Livre.");
    }

    const initialUrl = validation.normalizedUrl;

    // Check if it is a shortlink or redirect-needed URL (e.g. meli.la, /sec/)
    const parsed = new URL(initialUrl);
    const isShortOrRedirect =
      parsed.hostname.toLowerCase().includes("meli.la") ||
      parsed.hostname.toLowerCase().includes("mpago.li") ||
      parsed.pathname.startsWith("/sec/");

    let finalResolvedUrl = initialUrl;
    if (isShortOrRedirect) {
      try {
        const resolveResult = await SafeUrlResolver.resolve(initialUrl, {
          allowedHosts: MERCADO_LIVRE_HOSTS,
          maxRedirects: 5,
          method: "GET",
        });
        finalResolvedUrl = resolveResult.finalUrl;
      } catch (err) {
        // If network request fails in disconnected/test environment without mocking, fallback to initialUrl with logged warning
        console.warn(`[MercadoLivreAffiliateProvider] Aviso ao resolver link seguro: ${(err as Error).message}`);
      }
    }

    // Extract external product ID if MLB-XXXXXX pattern is in pathname or search params
    let externalProductId: string | undefined;
    const mlbMatch = (finalResolvedUrl + " " + initialUrl).match(/(MLB-?\d+)/i);
    if (mlbMatch) {
      externalProductId = mlbMatch[1].replace("-", "").toUpperCase();
    }

    return {
      affiliateUrl: initialUrl,
      resolvedUrl: finalResolvedUrl,
      externalProductId,
      provider: this.code,
    };
  }

  async fetchProductMetadata(input: ProductMetadataInput): Promise<NormalizedProductImport> {
    const validation = await this.validateAffiliateUrl(input.affiliateUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      return {
        status: "FAILED",
        affiliateUrl: input.affiliateUrl,
        metadataSource: "VALIDATION_FAILED",
        fetchedAt: new Date(),
        warnings: [validation.error || "URL de afiliado inválida para o Mercado Livre."],
      };
    }

    try {
      const resolveResult = await SafeUrlResolver.resolve(validation.normalizedUrl, {
        allowedHosts: MERCADO_LIVRE_HOSTS,
        maxRedirects: 5,
        method: "GET",
      });

      if (resolveResult.body) {
        const metadata = extractProductMetadata(resolveResult.body, {
          affiliateUrl: input.affiliateUrl,
          resolvedUrl: resolveResult.finalUrl,
          externalProductId: input.externalProductId,
        });

        const rawMlbId = metadata.externalProductId ? metadata.externalProductId.replace(/^MLB-?/i, "") : undefined;
        const pdpUrl = rawMlbId
          ? `https://produto.mercadolivre.com.br/MLB-${rawMlbId}`
          : metadata.targetProductUrl;

        if (pdpUrl) {
          try {
            const targetResolve = await SafeUrlResolver.resolve(pdpUrl, {
              allowedHosts: MERCADO_LIVRE_HOSTS,
              maxRedirects: 5,
              method: "GET",
            });
            if (targetResolve.body) {
              const pdpMetadata = extractProductMetadata(targetResolve.body, {
                affiliateUrl: input.affiliateUrl,
                resolvedUrl: targetResolve.finalUrl,
                externalProductId: metadata.externalProductId || input.externalProductId,
              });

              if (pdpMetadata.status === "COMPLETE" || pdpMetadata.specs || pdpMetadata.description) {
                return {
                  ...metadata,
                  brand: metadata.brand || pdpMetadata.brand,
                  description:
                    pdpMetadata.description && pdpMetadata.description.length > 20 && !pdpMetadata.description.includes("Achadinho do Mercado")
                      ? pdpMetadata.description
                      : metadata.description,
                  sourceDescription:
                    pdpMetadata.sourceDescription && pdpMetadata.sourceDescription.length > 20 && !pdpMetadata.sourceDescription.includes("Achadinho do Mercado")
                      ? pdpMetadata.sourceDescription
                      : metadata.sourceDescription,
                  specs: { ...(pdpMetadata.specs || {}), ...(metadata.specs || {}) },
                  sourceSpecs: { ...(pdpMetadata.sourceSpecs || {}), ...(metadata.sourceSpecs || {}) },
                  sourceRating: pdpMetadata.sourceRating ?? metadata.sourceRating,
                  sourceReviewCount: pdpMetadata.sourceReviewCount ?? metadata.sourceReviewCount,
                  reviewSamples:
                    pdpMetadata.reviewSamples && pdpMetadata.reviewSamples.length > 0
                      ? pdpMetadata.reviewSamples
                      : metadata.reviewSamples,
                  status: "COMPLETE",
                };
              }
            }
          } catch (targetErr) {
            console.warn(`[MercadoLivreAffiliateProvider] Aviso na resolução secundária de PDP: ${(targetErr as Error).message}`);
          }
        }

        return metadata;
      }

      return {
        status: "PARTIAL",
        externalProductId: input.externalProductId,
        affiliateUrl: input.affiliateUrl,
        resolvedUrl: resolveResult.finalUrl,
        metadataSource: "MERCADO_LIVRE_NO_BODY",
        fetchedAt: new Date(),
        warnings: ["Resposta sem conteúdo HTML para extração de metadados."],
      };
    } catch (err) {
      return {
        status: "FAILED",
        affiliateUrl: input.affiliateUrl,
        externalProductId: input.externalProductId,
        metadataSource: "FETCH_ERROR",
        fetchedAt: new Date(),
        warnings: [`Falha ao consultar metadados do produto: ${(err as Error).message}`],
      };
    }
  }
}


