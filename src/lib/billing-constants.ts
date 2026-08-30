export type LimitResource = "ARTICLES" | "ARTICLES_DAILY" | "SOURCES" | "WORDPRESS_SITES";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resource: LimitResource;
  planName: string;
  message?: string;
}

export interface SeedPlanFeature {
  featureKey: string;
  enabled?: boolean;
  limit?: number | null;
}

export interface SeedPlan {
  slug: string;
  name: string;
  description: string;
  price: number;
  monthlyPrice: number;
  annualDiscountPercent: number;
  periodicity?: string;
  active?: boolean;
  highlight?: boolean;
  maxArticles: number;
  maxDailyArticles: number;
  maxSources: number;
  maxWordPressSites: number;
  features?: SeedPlanFeature[];
}

export const SEED_PLANS: SeedPlan[] = [
  {
    slug: "free",
    name: "Plano Gratuito",
    description: "Conheça o GeraFeed",
    price: 0,
    monthlyPrice: 0,
    annualDiscountPercent: 0,
    periodicity: "MONTHLY",
    active: true,
    highlight: false,
    maxArticles: 10,
    maxDailyArticles: 2,
    maxSources: 1,
    maxWordPressSites: 1,
    features: [],
  },
  {
    slug: "starter",
    name: "Plano Starter",
    description: "Comece a automatizar",
    price: 39.9,
    monthlyPrice: 39.9,
    annualDiscountPercent: 16.0,
    periodicity: "MONTHLY",
    active: true,
    highlight: false,
    maxArticles: 50,
    maxDailyArticles: 3,
    maxSources: 3,
    maxWordPressSites: 1,
    features: [
      { featureKey: "ai_unlimited_styles", enabled: true },
      { featureKey: "ai_unlimited_niches", enabled: true },
      { featureKey: "ai_advanced_providers", enabled: true },
    ],
  },
  {
    slug: "influencer",
    name: "Plano Influencer",
    description: "Publique e monetize",
    price: 79.9,
    monthlyPrice: 79.9,
    annualDiscountPercent: 16.0,
    periodicity: "MONTHLY",
    active: true,
    highlight: true,
    maxArticles: 150,
    maxDailyArticles: 10,
    maxSources: 15,
    maxWordPressSites: 2,
    features: [
      { featureKey: "affiliate_analytics", enabled: true },
      { featureKey: "ai_unlimited_styles", enabled: true },
      { featureKey: "affiliate_max_products", enabled: true, limit: 100 },
      { featureKey: "affiliate_max_programs", enabled: true, limit: 100 },
      { featureKey: "affiliate_module", enabled: true },
      { featureKey: "ai_unlimited_niches", enabled: true },
      { featureKey: "ai_advanced_providers", enabled: true },
    ],
  },
  {
    slug: "pro",
    name: "Plano Pro",
    description: "Escale sua operação",
    price: 149.9,
    monthlyPrice: 149.9,
    annualDiscountPercent: 16.0,
    periodicity: "MONTHLY",
    active: true,
    highlight: false,
    maxArticles: 500,
    maxDailyArticles: 25,
    maxSources: 30,
    maxWordPressSites: 5,
    features: [
      { featureKey: "affiliate_analytics", enabled: true },
      { featureKey: "ai_unlimited_styles", enabled: true },
      { featureKey: "affiliate_max_products", enabled: true, limit: 1000 },
      { featureKey: "affiliate_max_programs", enabled: true, limit: 1000 },
      { featureKey: "affiliate_module", enabled: true },
      { featureKey: "ai_unlimited_niches", enabled: true },
      { featureKey: "ai_advanced_providers", enabled: true },
    ],
  },
  {
    slug: "agencia",
    name: "Plano Agência",
    description: "Gerencie múltiplos projetos",
    price: 299.9,
    monthlyPrice: 299.9,
    annualDiscountPercent: 16.0,
    periodicity: "MONTHLY",
    active: true,
    highlight: false,
    maxArticles: 1500,
    maxDailyArticles: 50,
    maxSources: 100,
    maxWordPressSites: 20,
    features: [
      { featureKey: "affiliate_analytics", enabled: true },
      { featureKey: "ai_unlimited_styles", enabled: true },
      { featureKey: "affiliate_max_products", enabled: true, limit: 5000 },
      { featureKey: "affiliate_max_programs", enabled: true, limit: 5000 },
      { featureKey: "affiliate_module", enabled: true },
      { featureKey: "ai_unlimited_niches", enabled: true },
      { featureKey: "ai_advanced_providers", enabled: true },
    ],
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
