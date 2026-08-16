import sharp from "sharp";

/**
 * Downloads an image from imageUrl, applies horizontal flip (.flop())
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

  try {
    const response = await fetch(imageUrl.trim(), {
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
    const inputBuffer = Buffer.from(arrayBuffer);

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
