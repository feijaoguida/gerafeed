import { AffiliateProvider } from "./types";
import { MercadoLivreAffiliateProvider } from "./mercado-livre";

const providersRegistry: Map<string, AffiliateProvider> = new Map();

function initializeProviders() {
  if (providersRegistry.size === 0) {
    const meli = new MercadoLivreAffiliateProvider();
    providersRegistry.set(meli.code.toUpperCase(), meli);
  }
}

export class AffiliateProviderFactory {
  /**
   * Retrieves an AffiliateProvider instance by its code (e.g. MERCADO_LIVRE).
   */
  static getProvider(code: string): AffiliateProvider {
    initializeProviders();
    const normalized = code.trim().toUpperCase();
    const provider = providersRegistry.get(normalized);
    if (!provider) {
      throw new Error(`Provedor de afiliados '${code}' não encontrado ou não suportado.`);
    }
    return provider;
  }

  /**
   * Lists all registered provider instances.
   */
  static getAllProviders(): AffiliateProvider[] {
    initializeProviders();
    return Array.from(providersRegistry.values());
  }

  /**
   * Registers a custom or new provider instance.
   */
  static registerProvider(provider: AffiliateProvider) {
    providersRegistry.set(provider.code.toUpperCase(), provider);
  }
}
