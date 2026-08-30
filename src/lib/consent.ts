/**
 * Estrutura de preferências de consentimento de privacidade e cookies.
 */
export interface ConsentPreferences {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

export const CONSENT_STORAGE_KEY = "gerafeed_consent_preferences";
export const CURRENT_CONSENT_VERSION = 1;

/**
 * Lê as preferências salvas no localStorage (client-side only).
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.analytics === "boolean") {
      return parsed as ConsentPreferences;
    }
  } catch {
    // Tratamento resiliente caso localStorage esteja corrompido
  }
  return null;
}

/**
 * Persiste as preferências de consentimento e notifica a aplicação e o GTM.
 */
export function saveConsent(analytics: boolean): ConsentPreferences {
  const preferences: ConsentPreferences = {
    version: CURRENT_CONSENT_VERSION,
    necessary: true,
    analytics,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(preferences)
      );
      window.dispatchEvent(
        new CustomEvent("consent-updated", { detail: preferences })
      );
    } catch {
      // Ignora restrições estritas de localStorage
    }

    updateGtmConsent(analytics);
  }

  return preferences;
}

/**
 * Atualiza o Google Consent Mode no dataLayer sem enviar PII.
 */
export function updateGtmConsent(analytics: boolean) {
  if (typeof window === "undefined") return;

  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

  w.dataLayer = w.dataLayer || [];

  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  } else {
    w.dataLayer.push([
      "consent",
      "update",
      {
        analytics_storage: analytics ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
  }

  w.dataLayer.push({
    event: "consent_status_update",
    analytics_consent: analytics ? "granted" : "denied",
  });
}
