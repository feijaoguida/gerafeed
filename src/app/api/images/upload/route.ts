import path from "path";
import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { handleApiError } from "@/lib/errors/service";
import {
  validateAndOptimizeUploadedImage,
  MAX_UPLOAD_IMAGE_BYTES,
} from "@/lib/imageProcessor";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/**
 * POST /api/images/upload
 * Validates, sanitizes (CDR via sharp re-encoding), and converts uploaded images
 * into safe Data URIs for use as Featured Media (cover) or inline article body images.
 *
 * TODO(security): Integrate external Antivirus / Malware scanning API in production if required by enterprise policy.
 */
export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para enviar imagens." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let inputBuffer: Buffer | null = null;
    let generateModified = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const genModField = formData.get("generateModified");
      generateModified = genModField === "true" || genModField === "1";

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "Nenhum arquivo de imagem enviado." },
          { status: 400 }
        );
      }

      if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "O arquivo excede o tamanho máximo permitido de 8MB." },
          { status: 400 }
        );
      }

      // Validate MIME type against allow-list
      if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            error:
              "Tipo de arquivo não permitido. Envie apenas imagens JPG, PNG ou WEBP.",
          },
          { status: 400 }
        );
      }

      // Validate filename extension if available
      if ("name" in file && typeof file.name === "string" && file.name.trim()) {
        const safeBasename = path.basename(file.name.trim());
        const ext = path.extname(safeBasename).toLowerCase();
        if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
          return NextResponse.json(
            {
              error:
                "Extensão de arquivo não permitida. Use .jpg, .jpeg, .png ou .webp.",
            },
            { status: 400 }
          );
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await request.json().catch(() => ({}));
      const dataUri = typeof body?.dataUri === "string" ? body.dataUri.trim() : "";
      generateModified = Boolean(body?.generateModified);

      if (!dataUri) {
        return NextResponse.json(
          { error: "Nenhuma imagem fornecida para upload." },
          { status: 400 }
        );
      }

      const match = dataUri.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/
      );
      if (!match || !match[1] || !match[2]) {
        return NextResponse.json(
          { error: "Formato de Data URI de imagem inválido." },
          { status: 400 }
        );
      }

      const mime = match[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(mime)) {
        return NextResponse.json(
          {
            error:
              "Tipo de imagem não permitido. Envie apenas JPG, PNG ou WEBP.",
          },
          { status: 400 }
        );
      }

      inputBuffer = Buffer.from(match[2], "base64");
    }

    const result = await validateAndOptimizeUploadedImage(inputBuffer, {
      generateModified,
    });

    return NextResponse.json(
      {
        success: true,
        imageUrl: result.imageUrl,
        modifiedImageUrl: result.modifiedImageUrl,
        width: result.width,
        height: result.height,
        format: result.format,
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Formato de imagem") ||
        error.message.includes("excede o limite") ||
        error.message.includes("Arquivo inválido") ||
        error.message.includes("Arquivo de imagem vazio") ||
        error.message.includes("Dimensões da imagem"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return handleApiError(error, request, {
      module: "GENERAL",
      screen: "Upload de Imagens para Matéria",
      userFacingMessage: "Erro ao processar o envio da imagem",
    });
  }
}

