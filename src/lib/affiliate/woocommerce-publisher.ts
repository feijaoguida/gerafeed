import { prisma } from "@/lib/prisma";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { getWordPressSiteConfig, getWordPressSites } from "@/lib/wordpress-sites";
import { getWordPressConfig, uploadMediaToWordPressWithUrl } from "@/lib/wordpress";

export interface PublishToWooCommerceInput {
  wordpressSiteId?: string | null;
  offerId?: string | null;
  productType?: "external" | "simple";
  status?: "publish" | "draft";
  buttonText?: string | null;
}

export interface WooCommercePublishResult {
  success: boolean;
  woocommerceProductId: number;
  woocommerceProductUrl: string;
  wordpressSiteId: string | null;
  status: string;
  action: "created" | "updated";
}

export class WooCommercePublisherService {
  /**
   * Resolves WordPress credentials (site-specific or default workspace site).
   */
  private static async resolveWordPressCredentials(
    workspaceId: string,
    requestedSiteId?: string | null
  ): Promise<{
    config: {
      url: string;
      username: string;
      applicationPassword: string;
      woocommerceConsumerKey?: string | null;
      woocommerceConsumerSecret?: string | null;
    };
    siteId: string | null;
  }> {
    if (requestedSiteId) {
      const siteConfig = await getWordPressSiteConfig(workspaceId, requestedSiteId);
      if (siteConfig) {
        return { config: siteConfig, siteId: siteConfig.id };
      }
    }

    const sites = await getWordPressSites(workspaceId, { activeOnly: true });
    if (sites.length > 0) {
      const defaultSite = sites.find((s) => s.isDefault) || sites[0];
      const siteConfig = await getWordPressSiteConfig(workspaceId, defaultSite.id);
      if (siteConfig) {
        return { config: siteConfig, siteId: siteConfig.id };
      }
    }

    try {
      const legacyConfig = await getWordPressConfig(workspaceId);
      return { config: legacyConfig, siteId: null };
    } catch {
      throw new Error(
        "Nenhum site WordPress ativo foi encontrado para esta Empresa. Configure em Configurações > WordPress."
      );
    }
  }

  /**
   * Publishes or updates a Product in WordPress WooCommerce REST API (/wp-json/wc/v3/products)
   * with automatic fallback to WordPress REST API (/wp-json/wp/v2/product).
   */
  static async publishProductToWooCommerce(
    workspaceId: string,
    productId: string,
    options: PublishToWooCommerceInput = {}
  ): Promise<WooCommercePublishResult> {
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
      include: {
        category: true,
        offers: {
          include: { affiliateProgram: true },
          where: { status: "ACTIVE" },
          orderBy: [{ price: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!product) {
      throw new Error("Produto não encontrado no catálogo do workspace.");
    }

    const activeOffer = options.offerId
      ? product.offers.find((o) => o.id === options.offerId) || product.offers[0]
      : product.offers[0];

    const { config, siteId } = await this.resolveWordPressCredentials(
      workspaceId,
      options.wordpressSiteId || product.wordpressSiteId
    );

    const productType = options.productType || (product.woocommerceProductType as "external" | "simple") || "external";
    const postStatus = options.status || "publish";

    // 1. Upload Product Images to WordPress Media Library
    const candidateImages = [
      product.imageUrl,
      ...(Array.isArray(product.images) ? product.images : []),
    ].filter((img): img is string => typeof img === "string" && img.trim().length > 0);

    const uniqueImages = Array.from(new Set(candidateImages)).slice(0, 4);
    const mediaIdResults = await Promise.all(
      uniqueImages.map(async (imageUrl, i) => {
        try {
          const uploaded = await uploadMediaToWordPressWithUrl(
            config,
            imageUrl,
            product.id,
            `wc-${i + 1}`
          );
          return uploaded?.id || null;
        } catch (imgErr) {
          console.warn(`Aviso ao enviar imagem ${i + 1} para WooCommerce:`, imgErr);
          return null;
        }
      })
    );
    const mediaIds: number[] = Array.from(new Set(mediaIdResults.filter((id): id is number => typeof id === "number")));

    // 2. Format Pricing (regular_price and sale_price)
    let regularPriceStr: string | undefined;
    let salePriceStr: string | undefined;

    const offerPrice = activeOffer?.price ?? product.rating ?? undefined;
    const offerOldPrice = activeOffer?.oldPrice ?? undefined;

    if (offerPrice !== undefined && typeof offerPrice === "number" && offerPrice > 0) {
      if (offerOldPrice !== undefined && typeof offerOldPrice === "number" && offerOldPrice > offerPrice) {
        regularPriceStr = offerOldPrice.toFixed(2);
        salePriceStr = offerPrice.toFixed(2);
      } else {
        regularPriceStr = offerPrice.toFixed(2);
      }
    }

    // 3. Format Attributes for WooCommerce
    const attributes: Array<{
      name: string;
      visible: boolean;
      variation: boolean;
      options: string[];
    }> = [];

    if (product.brand) {
      attributes.push({
        name: "Marca",
        visible: true,
        variation: false,
        options: [product.brand],
      });
    }

    if (product.specs && typeof product.specs === "object") {
      for (const [key, val] of Object.entries(product.specs)) {
        if (key === "O que você precisa saber" || key === "Marca") continue;
        if (attributes.length >= 10) break;
        if (typeof val === "string" && val.trim().length > 0) {
          attributes.push({
            name: key.slice(0, 50),
            visible: true,
            variation: false,
            options: [val.trim().slice(0, 100)],
          });
        }
      }
    }

    // 4. Resolve Affiliate Button Text and URL
    const programCode = activeOffer?.affiliateProgram?.code?.toUpperCase();
    const defaultButtonText =
      programCode === "SHOPEE"
        ? "Comprar na Shopee"
        : programCode === "MERCADO_LIVRE"
        ? "Comprar no Mercado Livre"
        : "Ver Oferta";

    const buttonText = options.buttonText?.trim() || defaultButtonText;
    const externalUrl = activeOffer?.affiliateUrl || product.slug;

    // 5. Build Content HTML
    const shortDesc = product.shortDescription?.trim() || product.description?.slice(0, 180) || "";
    const descriptionHtml = product.description?.trim() || `<p>${product.name}</p>`;

    // 6. Basic Auth Headers
    const hasWcKeys = Boolean(
      config.woocommerceConsumerKey && config.woocommerceConsumerSecret
    );
    const wcAuthCredentials = hasWcKeys
      ? `${config.woocommerceConsumerKey}:${config.woocommerceConsumerSecret}`
      : `${config.username}:${config.applicationPassword}`;
    const base64WcAuth = Buffer.from(wcAuthCredentials).toString("base64");
    const wcHeaders = {
      Authorization: `Basic ${base64WcAuth}`,
      "Content-Type": "application/json",
    };

    const wpCredentials = `${config.username}:${config.applicationPassword}`;
    const base64WpAuth = Buffer.from(wpCredentials).toString("base64");
    const wpHeaders = {
      Authorization: `Basic ${base64WpAuth}`,
      "Content-Type": "application/json",
    };

    const isExistingSync =
      Boolean(product.woocommerceProductId) &&
      (!product.wordpressSiteId || product.wordpressSiteId === siteId);

    const existingWcId = product.woocommerceProductId;

    // 7. Try WooCommerce REST API (/wp-json/wc/v3/products)
    const wcPayload: Record<string, unknown> = {
      name: product.name,
      type: productType,
      status: postStatus,
      description: descriptionHtml,
      short_description: shortDesc ? `<p>${shortDesc}</p>` : "",
      ...(regularPriceStr ? { regular_price: regularPriceStr } : {}),
      ...(salePriceStr ? { sale_price: salePriceStr } : {}),
      ...(productType === "external"
        ? {
            external_url: externalUrl,
            button_text: buttonText,
          }
        : {}),
      ...(mediaIds.length > 0
        ? {
            images: mediaIds.map((id) => ({ id })),
          }
        : {}),
      ...(attributes.length > 0 ? { attributes } : {}),
    };

    let action: "created" | "updated" = isExistingSync ? "updated" : "created";
    let finalWcId: number | null = null;
    let finalProductUrl: string | null = null;

    try {
      const endpoint = isExistingSync
        ? `${config.url}/wp-json/wc/v3/products/${existingWcId}`
        : `${config.url}/wp-json/wc/v3/products`;

      const method = isExistingSync ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: wcHeaders,
        body: JSON.stringify(wcPayload),
        signal: AbortSignal.timeout(20000),
      });

      if (res.ok) {
        const data = await res.json();
        finalWcId = typeof data.id === "number" ? data.id : null;
        finalProductUrl =
          typeof data.permalink === "string"
            ? data.permalink
            : typeof data.link === "string"
            ? data.link
            : null;
      } else if (isExistingSync && res.status === 404) {
        // Product was deleted on WooCommerce, re-create as new
        const retryCreateRes = await fetch(`${config.url}/wp-json/wc/v3/products`, {
          method: "POST",
          headers: wcHeaders,
          body: JSON.stringify(wcPayload),
          signal: AbortSignal.timeout(20000),
        });
        if (retryCreateRes.ok) {
          const data = await retryCreateRes.json();
          finalWcId = typeof data.id === "number" ? data.id : null;
          finalProductUrl =
            typeof data.permalink === "string"
              ? data.permalink
              : typeof data.link === "string"
              ? data.link
              : null;
          action = "created";
        }
      }
    } catch (wcApiErr) {
      console.warn("WooCommerce REST API /wc/v3/products não respondeu:", wcApiErr);
    }

    // 8. Fallback to WordPress REST API (/wp-json/wp/v2/product) if /wc/v3 failed
    if (!finalWcId) {
      try {
        const wpEndpoint = isExistingSync
          ? `${config.url}/wp-json/wp/v2/product/${existingWcId}`
          : `${config.url}/wp-json/wp/v2/product`;

        const wpMethod = isExistingSync ? "POST" : "POST";

        const metaFields: Record<string, unknown> = {
          _regular_price: regularPriceStr || "",
          _sale_price: salePriceStr || "",
          _price: salePriceStr || regularPriceStr || "",
          _product_url: productType === "external" ? externalUrl : "",
          _button_text: productType === "external" ? buttonText : "",
          _sku: activeOffer?.externalProductId || "",
        };

        const wpPayload: Record<string, unknown> = {
          title: product.name,
          content: descriptionHtml,
          excerpt: shortDesc,
          status: postStatus,
          ...(mediaIds[0] ? { featured_media: mediaIds[0] } : {}),
          meta: metaFields,
        };

        const wpRes = await fetch(wpEndpoint, {
          method: wpMethod,
          headers: wpHeaders,
          body: JSON.stringify(wpPayload),
          signal: AbortSignal.timeout(20000),
        });

        if (!wpRes.ok) {
          const errText = await wpRes.text().catch(() => "");
          throw new Error(
            `Falha ao publicar produto no WordPress (${wpRes.status}): ${errText.substring(0, 200)}`
          );
        }

        const wpData = await wpRes.json();
        finalWcId = typeof wpData.id === "number" ? wpData.id : null;
        finalProductUrl =
          typeof wpData.link === "string"
            ? wpData.link
            : typeof wpData.guid?.rendered === "string"
            ? wpData.guid.rendered
            : null;
      } catch (wpFallbackErr) {
        throw new Error(
          `Não foi possível publicar no WooCommerce/WordPress: ${(wpFallbackErr as Error).message}`
        );
      }
    }

    if (!finalWcId) {
      throw new Error("A API do WordPress não retornou um ID de produto válido.");
    }

    const publicUrl = finalProductUrl || `${config.url}/?p=${finalWcId}`;

    // 9. Persist sync record in Product
    await prisma.product.update({
      where: { id: product.id },
      data: {
        wordpressSiteId: siteId,
        woocommerceProductId: finalWcId,
        woocommerceProductUrl: publicUrl,
        woocommerceProductType: productType,
        woocommerceLastSyncedAt: new Date(),
      },
    });

    return {
      success: true,
      woocommerceProductId: finalWcId,
      woocommerceProductUrl: publicUrl,
      wordpressSiteId: siteId,
      status: postStatus,
      action,
    };
  }
}

