/**
 * Helper central de medição de conversão e eventos analíticos via dataLayer.
 * - Segurança estrita contra vazamento de PII (Personally Identifiable Information).
 * - Tolerante a falhas: nunca interrompe operações de domínio ou de UI se o analytics falhar.
 */

export type ConversionEventName =
  | "cta_click"
  | "sign_up_completed"
  | "wordpress_connected"
  | "rss_source_added"
  | "article_generated"
  | "article_published"
  | "begin_checkout";

export interface EventPropertiesMap {
  cta_click: {
    cta_location: string;
    page_path?: string;
  };
  sign_up_completed: {
    page_path?: string;
    source_channel?: string;
  };
  wordpress_connected: {
    site_type?: string;
  };
  rss_source_added: {
    category?: string;
  };
  article_generated: {
    content_type?: string;
  };
  article_published: {
    destination_type?: string;
  };
  begin_checkout: {
    plan_code_public: string;
    cycle?: string;
  };
}

const FORBIDDEN_PII_KEYS = new Set([
  "email",
  "name",
  "password",
  "cpf",
  "cnpj",
  "cpfcnpj",
  "userid",
  "workspaceid",
  "token",
  "secret",
  "content",
  "body",
  "articlecontent",
  "affiliateurl",
  "applicationpassword",
]);

/**
 * Remove chaves proibidas ou sensíveis que possam conter PII por design.
 */
export function sanitizeProperties<T extends Record<string, unknown>>(props?: T): Record<string, unknown> {
  if (!props || typeof props !== "object") return {};

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_PII_KEYS.has(normalizedKey)) {
      continue;
    }
    // Apenas tipos primitivos seguros
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Dispara evento estruturado para o dataLayer do Google Tag Manager.
 */
export function trackEvent<E extends ConversionEventName>(
  eventName: E,
  properties?: EventPropertiesMap[E]
): void {
  if (typeof window === "undefined") return;

  try {
    const w = window as unknown as {
      dataLayer?: unknown[];
    };

    w.dataLayer = w.dataLayer || [];

    const sanitized = sanitizeProperties(properties);

    w.dataLayer.push({
      event: eventName,
      ...sanitized,
      timestamp: Date.now(),
    });
  } catch {
    // Falha silenciosa para assegurar que telemetria nunca impeça o fluxo do usuário
  }
}
