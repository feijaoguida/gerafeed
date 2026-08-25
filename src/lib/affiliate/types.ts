export interface AffiliateProviderCapabilities {
  automaticAffiliateLinkGeneration: boolean;
  affiliateLinkImport: boolean;
  productMetadataImport: boolean;
  supportsTrackingLabel: boolean;
}

export interface AffiliateUrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

export interface ResolvedAffiliateLink {
  affiliateUrl: string;
  resolvedUrl?: string;
  canonicalUrl?: string;
  externalProductId?: string;
  provider: string;
}

export interface ProductMetadataInput {
  affiliateUrl: string;
  resolvedUrl?: string;
  externalProductId?: string;
}

export type ProductImportStatus = "COMPLETE" | "PARTIAL" | "FAILED";

export type CommercialArticleType =
  | "PRODUCT_REVIEW"
  | "COMPARISON"
  | "BEST_PRODUCTS"
  | "BUYING_GUIDE"
  | "PROBLEM_SOLUTION"
  | "DEALS"
  | "SEASONAL";


export interface ReviewSample {
  rating?: number;
  title?: string;
  text: string;
  authorName?: string;
  sourceUrl?: string;
  capturedAt?: Date;
}

export interface NormalizedProductImport {
  status: ProductImportStatus;
  externalProductId?: string;
  affiliateUrl: string;
  resolvedUrl?: string;
  canonicalUrl?: string;
  name?: string;
  brand?: string;
  description?: string;
  sourceDescription?: string;
  marketplaceCategoryId?: string;
  marketplaceCategoryName?: string;
  imageUrl?: string;
  images?: string[];
  specs?: Record<string, string>;
  sourceSpecs?: Record<string, string>;
  sourceRating?: number;
  sourceReviewCount?: number;
  reviewSamples?: ReviewSample[];
  seller?: string;
  price?: number;
  oldPrice?: number;
  currency?: string;
  metadataSource: string;
  targetProductUrl?: string;
  fetchedAt: Date;
  warnings: string[];
}

export interface AffiliateProvider {
  readonly code: string;
  readonly name: string;
  capabilities(): AffiliateProviderCapabilities;
  validateAffiliateUrl(url: string): Promise<AffiliateUrlValidationResult>;
  resolveAffiliateUrl(url: string): Promise<ResolvedAffiliateLink>;
  fetchProductMetadata(input: ProductMetadataInput): Promise<NormalizedProductImport>;
}
