import { PublisherAdapter } from "./types";
import { WordPressPublisherAdapter, WordPressAdapterOptions } from "./wordpress-adapter";
import { getWordPressConfig } from "@/lib/wordpress";
import { getWordPressSiteConfig } from "@/lib/wordpress-sites";

type CustomAdapterResolver = (workspaceId: string, wordpressSiteId?: string | null) => Promise<PublisherAdapter | null> | PublisherAdapter | null;

export class PublisherFactory {
  private static customResolver: CustomAdapterResolver | null = null;

  /**
   * Sets a custom adapter resolver (useful for mocking during integration tests or plugin extensions).
   */
  static setCustomResolver(resolver: CustomAdapterResolver | null) {
    this.customResolver = resolver;
  }

  /**
   * Instantiates a PublisherAdapter directly from provided connection credentials.
   */
  static create(type: string = "wordpress", options: WordPressAdapterOptions): PublisherAdapter {
    switch (type.toLowerCase()) {
      case "wordpress":
        return new WordPressPublisherAdapter(options);
      default:
        throw new Error(`Tipo de publisher não suportado: ${type}`);
    }
  }

  /**
   * Resolves and returns the configured PublisherAdapter for a specific workspace (and optional target site).
   */
  static async forWorkspace(
    workspaceId: string,
    wordpressSiteId?: string | null
  ): Promise<PublisherAdapter> {
    if (this.customResolver) {
      const custom = await this.customResolver(workspaceId, wordpressSiteId);
      if (custom) return custom;
    }

    let config: { url: string; username: string; applicationPassword: string } | null = null;

    if (wordpressSiteId) {
      config = await getWordPressSiteConfig(workspaceId, wordpressSiteId);
    }

    if (!config) {
      config = await getWordPressConfig(workspaceId);
    }

    if (!config) {
      throw new Error("Nenhum destino de publicação configurado para este workspace.");
    }

    return new WordPressPublisherAdapter(config);
  }
}
