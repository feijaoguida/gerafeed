import {
  ImageStyle,
  IMAGE_STYLE_DEFINITIONS,
  DEFAULT_IMAGE_PROMPT_TEMPLATE,
} from "./types";

export interface ImagePromptInput {
  title: string;
  summary?: string | null;
  content?: string | null;
  originalTitle?: string | null;
  originalImageUrl?: string | null;
  style: ImageStyle;
  customStyle?: string;
  promptTemplate?: string;
}

/**
 * Extracts named entities, subjects, and key actors from news text.
 */
export function extractKeyEntities(text: string): string[] {
  if (!text) return [];

  // Match capitalized words that typically represent names, companies, or titles
  const cleanText = text.replace(/<[^>]*>/g, " "); // Strip HTML
  const properNouns = cleanText.match(/\b[A-ZÀ-Ú][a-zà-ú]{2,}(?:\s+[A-ZÀ-Ú][a-zà-ú]{2,})*\b/g) || [];

  // Common stop words to ignore in news context
  const stopWords = new Set([
    "Segundo",
    "Após",
    "Para",
    "Como",
    "Com",
    "Durante",
    "Nesta",
    "Neste",
    "Entre",
    "Sobre",
    "Ainda",
    "Também",
    "De acordo",
    "O",
    "A",
    "Os",
    "As",
    "Um",
    "Uma",
    "Na",
    "No",
    "Por",
  ]);

  const unique = Array.from(
    new Set(properNouns.filter((n) => !stopWords.has(n) && n.length > 3))
  );

  return unique.slice(0, 4); // Top 4 key entities
}

/**
 * Extracts a concise scene description and setting from news content.
 */
export function extractSceneContext(title: string, summary?: string | null): {
  context: string;
  scene: string;
} {
  const baseText = summary?.trim() || title;
  const lower = baseText.toLowerCase();

  // Detect setting environment
  let scene = "professional editorial news environment";
  if (lower.includes("tribunal") || lower.includes("stf") || lower.includes("justiça") || lower.includes("juiz")) {
    scene = "courtroom or legal hall";
  } else if (lower.includes("congresso") || lower.includes("senado") || lower.includes("governo") || lower.includes("planalto")) {
    scene = "government press conference or parliamentary assembly room";
  } else if (lower.includes("estádio") || lower.includes("jogo") || lower.includes("futebol") || lower.includes("campeonato")) {
    scene = "stadium or sports arena";
  } else if (lower.includes("laboratório") || lower.includes("ciência") || lower.includes("saúde") || lower.includes("vacina")) {
    scene = "modern high-tech research laboratory";
  } else if (lower.includes("rua") || lower.includes("avenida") || lower.includes("protesto") || lower.includes("cidade")) {
    scene = "vibrant city street or urban public square";
  } else if (lower.includes("bolsa") || lower.includes("mercado") || lower.includes("empresa") || lower.includes("investimento")) {
    scene = "financial exchange floor or modern executive boardroom";
  }

  // Sanitize summary to act as context without markup
  const context = baseText.replace(/<[^>]*>/g, "").substring(0, 180).trim();

  return { context, scene };
}

/**
 * Builds an optimized, visual prompt for AI image generation models
 * (DALL-E 3, Google Imagen 3, OpenRouter FLUX.1) based on the news article context.
 */
export async function buildImagePrompt(input: ImagePromptInput): Promise<string> {
  const effectiveTitle = input.title || input.originalTitle || "News Story";
  const entities = extractKeyEntities(
    `${effectiveTitle} ${input.summary || ""} ${input.content || ""}`
  );
  const charactersStr = entities.length > 0 ? entities.join(", ") : "relevant news subjects";

  const { context, scene } = extractSceneContext(effectiveTitle, input.summary);

  // 1. Resolve style modifier
  let styleModifier = "";
  if (input.style === "CUSTOM") {
    styleModifier = input.customStyle?.trim() || "artistic editorial style";
  } else {
    styleModifier =
      IMAGE_STYLE_DEFINITIONS[input.style]?.promptModifier ||
      IMAGE_STYLE_DEFINITIONS.REALISTIC.promptModifier;
  }

  // 2. Select template
  const template =
    input.promptTemplate && input.promptTemplate.trim()
      ? input.promptTemplate.trim()
      : DEFAULT_IMAGE_PROMPT_TEMPLATE;

  // 3. Interpolate variables
  let finalPrompt = template
    .replace(/\{\{title\}\}/g, effectiveTitle)
    .replace(/\{\{characters\}\}/g, charactersStr)
    .replace(/\{\{context\}\}/g, context)
    .replace(/\{\{scene\}\}/g, scene)
    .replace(/\{\{style\}\}/g, styleModifier);

  // 4. Source image reference enhancement
  if (input.originalImageUrl) {
    finalPrompt += " In visual composition, align with the journalistic coverage perspective of the news event.";
  }

  // 5. Append universal quality and moderation constraints
  finalPrompt += " No text, no typography, no watermarks, no distorted faces.";

  return finalPrompt.trim();
}
