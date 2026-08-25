import {
  PublisherAdapter,
  PublishArticlePayload,
  PublisherResult,
  PublisherConnectionTestResult,
} from "./types";
import {
  uploadMediaToWordPress,
  getOrCreateWordPressTagIds,
} from "@/lib/wordpress";

export interface WordPressAdapterOptions {
  url: string;
  username: string;
  applicationPassword: string;
}

export class WordPressPublisherAdapter implements PublisherAdapter {
  readonly name = "WordPress";
  readonly type = "wordpress";

  private config: WordPressAdapterOptions;

  constructor(config: WordPressAdapterOptions) {
    if (!config.url || !config.username || !config.applicationPassword) {
      throw new Error("Configurações inválidas para WordPressPublisherAdapter (url, username, applicationPassword são obrigatórios).");
    }
    this.config = {
      url: config.url.replace(/\/+$/, ""),
      username: config.username,
      applicationPassword: config.applicationPassword,
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const credentials = `${this.config.username}:${this.config.applicationPassword}`;
    const base64Auth = Buffer.from(credentials).toString("base64");
    return {
      Authorization: `Basic ${base64Auth}`,
      "Content-Type": "application/json",
    };
  }

  async testConnection(): Promise<PublisherConnectionTestResult> {
    const headers = this.getAuthHeaders();
    try {
      const res = await fetch(`${this.config.url}/wp-json/wp/v2/users/me`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        return {
          connected: false,
          message: `Falha na autenticação com o WordPress (${res.status}): ${errorText.substring(0, 200)}`,
        };
      }

      const user = await res.json();
      return {
        connected: true,
        siteUrl: this.config.url,
        siteName: user.name || "WordPress Site",
        message: "Conexão estabelecida com sucesso.",
      };
    } catch (err) {
      return {
        connected: false,
        message: err instanceof Error ? err.message : "Erro desconhecido ao conectar ao WordPress.",
      };
    }
  }

  async createDraft(payload: PublishArticlePayload): Promise<PublisherResult> {
    return this.postOrUpdatePost(undefined, { ...payload, status: "draft" });
  }

  async publish(payload: PublishArticlePayload): Promise<PublisherResult> {
    return this.postOrUpdatePost(undefined, { ...payload, status: "publish" });
  }

  async update(postId: string | number, payload: Partial<PublishArticlePayload>): Promise<PublisherResult> {
    return this.postOrUpdatePost(postId, payload);
  }

  async uploadMedia(imageUrl: string, articleId: string): Promise<number | null> {
    return uploadMediaToWordPress(this.config, imageUrl, articleId);
  }

  private async postOrUpdatePost(
    postId?: string | number,
    payload?: Partial<PublishArticlePayload>
  ): Promise<PublisherResult> {
    const headers = this.getAuthHeaders();
    const isUpdate = postId !== undefined && postId !== null;

    let featuredMediaId = payload?.featuredMediaId || null;
    if (!featuredMediaId && payload?.featuredImageUrl && payload?.articleId) {
      featuredMediaId = await this.uploadMedia(payload.featuredImageUrl, payload.articleId);
    }

    let tagIds: number[] = [];
    if (payload?.tags && payload.tags.length > 0) {
      tagIds = await getOrCreateWordPressTagIds(this.config, headers, payload.tags);
    }

    const postData: Record<string, unknown> = {};
    if (payload?.title !== undefined) postData.title = payload.title;
    if (payload?.content !== undefined) postData.content = payload.content;
    if (payload?.summary !== undefined) postData.excerpt = payload.summary;
    if (payload?.status !== undefined) postData.status = payload.status;
    if (payload?.categories && payload.categories.length > 0) postData.categories = payload.categories;
    if (payload?.slug !== undefined) postData.slug = payload.slug;

    if (featuredMediaId) {
      postData.featured_media = featuredMediaId;
    }
    if (tagIds.length > 0) {
      postData.tags = tagIds;
    }
    if (payload?.meta && Object.keys(payload.meta).length > 0) {
      postData.meta = payload.meta;
    }

    const endpoint = isUpdate
      ? `${this.config.url}/wp-json/wp/v2/posts/${postId}`
      : `${this.config.url}/wp-json/wp/v2/posts`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Erro na API do WordPress (${res.status}): ${errorText.substring(0, 250)}`);
    }

    const json = await res.json();
    return {
      success: true,
      postId: json.id,
      postUrl: json.link || `${this.config.url}/?p=${json.id}`,
      status: json.status || payload?.status || "publish",
      raw: json,
    };
  }
}
