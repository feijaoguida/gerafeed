export type LimitResource = "ARTICLES" | "ARTICLES_DAILY" | "SOURCES" | "WORDPRESS_SITES";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resource: LimitResource;
  planName: string;
  message?: string;
}

export const SEED_PLANS = [
  {
    slug: "free",
    name: "Plano Gratuito",
    price: 0,
    monthlyPrice: 0,
    annualDiscountPercent: 0,
    maxArticles: 50,
    maxDailyArticles: 5,
    maxSources: 3,
    maxWordPressSites: 1,
  },
  {
    slug: "starter",
    name: "Plano Starter",
    price: 47.0,
    monthlyPrice: 47.0,
    annualDiscountPercent: 16.42,
    maxArticles: 200,
    maxDailyArticles: 20,
    maxSources: 10,
    maxWordPressSites: 3,
  },
  {
    slug: "pro",
    name: "Plano Pro",
    price: 97.0,
    monthlyPrice: 97.0,
    annualDiscountPercent: 16.42,
    maxArticles: 1000,
    maxDailyArticles: 100,
    maxSources: 30,
    maxWordPressSites: 10,
  },
];

export const AFFILIATE_FEATURES = {
  MODULE: "affiliate_module",
  ANALYTICS: "affiliate_analytics",
  MAX_PRODUCTS: "affiliate_max_products",
  MAX_PROGRAMS: "affiliate_max_programs",
} as const;

export const AI_FEATURES = {
  UNLIMITED_NICHES: "ai_unlimited_niches",
  UNLIMITED_STYLES: "ai_unlimited_styles",
  ADVANCED_PROVIDERS: "ai_advanced_providers",
} as const;

/** Areas allowed when ai_unlimited_niches is false */
export const ALLOWED_NICHES_RESTRICTED = ["Política", "Negócios", "Meio Ambiente"] as const;

/** Styles allowed when ai_unlimited_styles is false */
export const ALLOWED_STYLES_RESTRICTED = ["Sério", "Informativo", "Alegre", "Atraente"] as const;

/** Providers allowed when ai_advanced_providers is false */
export const ALLOWED_PROVIDERS_RESTRICTED = ["openai", "openai-compatible"] as const;
