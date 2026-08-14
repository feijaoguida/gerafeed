import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Downloads an image from imageUrl, applies horizontal flip (.flop())
 * and subtle contrast/color modulation, saving the resulting image
 * to `public/media/modified-${articleId}.jpg`.
 *
 * Returns the public relative URL string `/media/modified-${articleId}.jpg`
 * or `null` if processing or downloading fails.
 */
export async function processAndStoreImage(
  imageUrl: string,
  articleId: string
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

    // Ensure public/media directory exists
    const mediaDir = path.join(process.cwd(), "public", "media");
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const fileName = `modified-${articleId}.jpg`;
    const filePath = path.join(mediaDir, fileName);

    await fs.promises.writeFile(filePath, processedBuffer);

    return `/media/${fileName}`;
  } catch (error) {
    console.error(`Error processing image for article ${articleId}:`, error);
    return null;
  }
}
