import sharp from "sharp";

const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp"]);
export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface ValidatedUploadedImageResult {
  imageUrl: string;
  modifiedImageUrl: string | null;
  width: number;
  height: number;
  format: string;
}

/**
 * Escapes HTML special characters to prevent XSS in attributes and captions.
 */
export function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validates image binary buffer magic bytes/structure via sharp, strips metadata (CDR),
 * resizes to safe dimensions, and encodes as Data URI.
 */
export async function validateAndOptimizeUploadedImage(
  inputBuffer: Buffer,
  options?: { generateModified?: boolean; maxWidth?: number }
): Promise<ValidatedUploadedImageResult> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error("Arquivo de imagem vazio.");
  }

  if (inputBuffer.length > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error("A imagem excede o limite máximo permitido de 8MB.");
  }

  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch {
    throw new Error("Arquivo inválido: não foi possível reconhecer o formato binário da imagem.");
  }

  const format = (metadata.format || "").toLowerCase();
  if (!ALLOWED_IMAGE_FORMATS.has(format)) {
    throw new Error(
      "Formato de imagem não permitido. Envie apenas arquivos JPG, PNG ou WEBP."
    );
  }

  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width < 1 ||
    metadata.height < 1 ||
    metadata.width > 8000 ||
    metadata.height > 8000
  ) {
    throw new Error("Dimensões da imagem inválidas ou superiores ao limite de segurança (8000x8000px).");
  }

  const maxWidth = options?.maxWidth || 1600;

  // Re-encode via sharp (strips EXIF/active metadata by default for CDR security)
  const pipelineResult = await sharp(inputBuffer)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const base64 = pipelineResult.data.toString("base64");
  const imageUrl = `data:image/jpeg;base64,${base64}`;

  let modifiedImageUrl: string | null = null;
  if (options?.generateModified) {
    const modifiedBuffer = await sharp(pipelineResult.data)
      .flop()
      .modulate({
        brightness: 1.02,
        saturation: 1.05,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    modifiedImageUrl = `data:image/jpeg;base64,${modifiedBuffer.toString("base64")}`;
  }

  return {
    imageUrl,
    modifiedImageUrl,
    width: pipelineResult.info.width,
    height: pipelineResult.info.height,
    format: "jpeg",
  };
}

/**
 * Downloads an image from imageUrl (or decodes a Data URI), applies horizontal flip (.flop())
 * and subtle contrast/color modulation, and returns the processed image
 * as a Data URI string (`data:image/jpeg;base64,...`).
 *
 * This approach works on serverless environments (Vercel) where the
 * filesystem is read-only at runtime.
 *
 * Returns the Data URI string or `null` if processing or downloading fails.
 */
export async function processAndStoreImage(
  imageUrl: string,
  _articleId: string
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
    return null;
  }

  const trimmed = imageUrl.trim();

  try {
    let inputBuffer: Buffer;

    if (trimmed.startsWith("data:image/")) {
      const match = trimmed.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
      if (!match || !match[1]) {
        return null;
      }
      inputBuffer = Buffer.from(match[1], "base64");
    } else {
      const response = await fetch(trimmed, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        console.warn(`Failed to fetch image from ${imageUrl}: HTTP ${response.status}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    }

    // Apply sharp transformations: horizontal flip (flop) and slight modulation
    const processedBuffer = await sharp(inputBuffer)
      .flop()
      .modulate({
        brightness: 1.02,
        saturation: 1.05,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Return as Data URI (works on both local and serverless environments)
    const base64 = processedBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error(`Error processing image for article ${_articleId}:`, error);
    return null;
  }
}

/**
 * Builds a safe, semantic HTML figure block for an inline article image.
 */
export function buildInlineImageHtml(
  imageUrl: string,
  caption?: string | null,
  alt?: string | null
): string {
  const trimmedUrl = imageUrl.trim();
  const isSafeUrl =
    trimmedUrl.startsWith("data:image/") ||
    trimmedUrl.startsWith("https://") ||
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("/");

  if (!isSafeUrl) {
    throw new Error("URL de imagem inválida.");
  }

  const safeUrl = escapeHtmlText(trimmedUrl);
  const safeAlt = escapeHtmlText((alt || caption || "Imagem da matéria").trim());
  const safeCaption = caption?.trim() ? escapeHtmlText(caption.trim()) : "";

  return `<figure class="wp-block-image"><img src="${safeUrl}" alt="${safeAlt}" />${
    safeCaption ? `<figcaption>${safeCaption}</figcaption>` : ""
  }</figure>`;
}

/**
 * Distributes inline images across paragraph boundaries in an HTML article body.
 */
export function distributeImagesInHtmlContent(
  htmlContent: string,
  images: Array<{ imageUrl: string; caption?: string | null; alt?: string | null }>
): string {
  if (!images || images.length === 0) {
    return htmlContent;
  }

  const validFigures: string[] = [];
  for (const img of images) {
    if (img.imageUrl?.trim()) {
      try {
        validFigures.push(buildInlineImageHtml(img.imageUrl, img.caption, img.alt));
      } catch {
        // Ignore invalid image URLs
      }
    }
  }

  if (validFigures.length === 0) {
    return htmlContent;
  }

  // Split by closing </p> tags to insert between paragraphs without breaking HTML
  const paragraphEndRegex = /<\/p>/gi;
  const matches = Array.from(htmlContent.matchAll(paragraphEndRegex));

  if (matches.length === 0) {
    return `${htmlContent}\n\n${validFigures.join("\n\n")}`;
  }

  // Distribute evenly after paragraphs
  const totalParagraphs = matches.length;
  const step = Math.max(1, Math.floor(totalParagraphs / (validFigures.length + 1)));

  let result = "";
  let lastIndex = 0;
  let figureIdx = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const endOfP = (match.index ?? 0) + match[0].length;

    const shouldInsertHere =
      figureIdx < validFigures.length &&
      ((i + 1) % step === 0 || i === matches.length - 1);

    if (shouldInsertHere) {
      result += htmlContent.slice(lastIndex, endOfP);
      result += `\n\n${validFigures[figureIdx]}\n\n`;
      figureIdx++;
      lastIndex = endOfP;
    }
  }

  result += htmlContent.slice(lastIndex);

  // Append any remaining figures at the end
  while (figureIdx < validFigures.length) {
    result += `\n\n${validFigures[figureIdx]}`;
    figureIdx++;
  }

  return result.trim();
}
