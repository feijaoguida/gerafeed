export type PublishStatus = "draft" | "publish" | "pending";

export interface PublishArticlePayload {
  title: string;
  content: string;
  summary?: string | null;
  status?: PublishStatus;
  categories?: number[];
  tags?: string[];
  featuredMediaId?: number | null;
  featuredImageUrl?: string | null;
  articleId?: string;
  slug?: string;
  meta?: Record<string, unknown>;
}

export interface PublisherResult {
  success: boolean;
  postId: string | number;
  postUrl?: string;
  status: string;
  errorMessage?: string;
  raw?: unknown;
}

export interface PublisherConnectionTestResult {
  connected: boolean;
  message?: string;
  siteName?: string;
  siteUrl?: string;
}

export interface PublisherAdapter {
  readonly name: string;
  readonly type: string;
  testConnection(): Promise<PublisherConnectionTestResult>;
  createDraft(payload: PublishArticlePayload): Promise<PublisherResult>;
  publish(payload: PublishArticlePayload): Promise<PublisherResult>;
  update(postId: string | number, payload: Partial<PublishArticlePayload>): Promise<PublisherResult>;
  uploadMedia?(imageUrl: string, articleId: string): Promise<number | null>;
}
