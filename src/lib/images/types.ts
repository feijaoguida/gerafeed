/**
 * Contracts and types for Image Strategy and AI Image Generation (Phase 33).
 */

export type ImageStrategy = "ORIGINAL" | "MODIFIED" | "AI_GENERATED";

export type ImageStyle =
  | "REALISTIC"
  | "CARTOON"
  | "DRAWING"
  | "SATIRICAL_CARTOON"
  | "CUSTOM";

export type ImageProviderType = "openai" | "gemini" | "openrouter";

export interface ImageSettingsStored {
  defaultStrategy: ImageStrategy;
  imageStyle: ImageStyle;
  customImageStyle?: string;
  imagePromptTemplate?: string;
  imageProvider?: ImageProviderType;
  useSameKeyAsTextAi: boolean;
  customApiKey?: string;
  customModel?: string;
}

export const DEFAULT_IMAGE_PROMPT_TEMPLATE =
  "Create an image illustrating the following news event: {{title}}. Key subjects/characters: {{characters}}. Scene and context: {{context}}. Setting: {{scene}}. Visual style: {{style}}.";

export const DEFAULT_IMAGE_SETTINGS: ImageSettingsStored = {
  defaultStrategy: "ORIGINAL",
  imageStyle: "REALISTIC",
  customImageStyle: "",
  imagePromptTemplate: DEFAULT_IMAGE_PROMPT_TEMPLATE,
  useSameKeyAsTextAi: true,
};

export const IMAGE_STYLE_DEFINITIONS: Record<
  ImageStyle,
  { label: string; description: string; promptModifier: string }
> = {
  REALISTIC: {
    label: "Realista / Fotojornalismo",
    description: "Estilo fotográfico realista, iluminação natural de imprensa e alta definição.",
    promptModifier:
      "photorealistic, photojournalism style, authentic news photography, natural lighting, highly detailed, 8k resolution",
  },
  CARTOON: {
    label: "Cartoon / 3D",
    description: "Estilo animação 3D moderna, personagens expressivos e cores vibrantes.",
    promptModifier:
      "modern 3D animation cartoon style, expressive characters, vibrant lighting, smooth textures, Pixar-inspired aesthetic",
  },
  DRAWING: {
    label: "Desenho / Ilustração",
    description: "Ilustração editorial artística, traços estilizados e paleta sofisticada.",
    promptModifier:
      "artistic editorial illustration, elegant hand-drawn linework, textured background, sophisticated color palette, vector graphic aesthetic",
  },
  SATIRICAL_CARTOON: {
    label: "Sátira Cartoon / Charge",
    description: "Charge humorística e caricatura editorial satírica para jornais e revistas.",
    promptModifier:
      "editorial political cartoon, humorous caricature style, satirical newspaper comic art, expressive facial features, bold ink outlines",
  },
  CUSTOM: {
    label: "Personalizado",
    description: "Defina livremente o estilo visual no campo de prompt customizado.",
    promptModifier: "",
  },
};

export interface GenerateImageInput {
  prompt: string;
  articleId?: string;
  workspaceId: string;
  style?: ImageStyle;
  customStyle?: string;
  originalImageUrl?: string | null;
}

export interface GeneratedImageResult {
  imageUrl: string; // Base64 Data URI or permanent URL
  promptUsed: string;
  provider: string;
  model: string;
}

export interface ImageCredentialsResolved {
  provider: ImageProviderType;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  isInheritedFromTextAi: boolean;
  inheritedTextProvider?: string;
}

export interface ImageGeneratorProvider {
  name: string;
  defaultModel: string;
  generateImage(
    prompt: string,
    options?: { model?: string }
  ): Promise<{ imageUrl: string; model: string }>;
}

