import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/config";
import { encrypt } from "@/lib/crypto";
import { getSessionWorkspaceId } from "@/lib/workspace";

export interface WordPressConfigStored {
  url: string;
  username: string;
  applicationPassword?: string;
}

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const config = await getConfig<WordPressConfigStored>("wordpressConnection", workspaceId);

    if (!config) {
      // Fallback to env info if no DB config
      const envUrl = process.env.WORDPRESS_URL || "";
      const envUsername = process.env.WORDPRESS_USERNAME || "";
      const envHasPass = Boolean(process.env.WORDPRESS_APPLICATION_PASSWORD);

      return NextResponse.json({
        url: envUrl,
        username: envUsername,
        isConfigured: Boolean(envUrl && envUsername && envHasPass),
        hasApplicationPassword: envHasPass,
        isFromEnv: true,
      });
    }

    return NextResponse.json({
      url: config.url || "",
      username: config.username || "",
      isConfigured: Boolean(config.url && config.username && config.applicationPassword),
      hasApplicationPassword: Boolean(config.applicationPassword),
      isFromEnv: false,
    });
  } catch (error) {
    console.error("GET /api/wordpress/config error:", error);
    return NextResponse.json({ error: "Erro ao buscar configuração do WordPress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();
    const { url, username, applicationPassword } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "A URL do WordPress é obrigatória." }, { status: 400 });
    }

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ error: "O Nome de Usuário do WordPress é obrigatório." }, { status: 400 });
    }

    const existing = await getConfig<WordPressConfigStored>("wordpressConnection", workspaceId);
    let encryptedPassword = existing?.applicationPassword || "";

    // If new password is provided, encrypt it
    if (typeof applicationPassword === "string" && applicationPassword.trim()) {
      encryptedPassword = encrypt(applicationPassword.trim());
    }

    if (!encryptedPassword) {
      return NextResponse.json(
        { error: "A Application Password do WordPress é obrigatória para nova configuração." },
        { status: 400 }
      );
    }

    const newConfigData: WordPressConfigStored = {
      url: url.trim().replace(/\/+$/, ""),
      username: username.trim(),
      applicationPassword: encryptedPassword,
    };

    await setConfig("wordpressConnection", newConfigData, workspaceId);

    return NextResponse.json({
      success: true,
      message: "Configuração do WordPress salva com sucesso!",
      config: {
        url: newConfigData.url,
        username: newConfigData.username,
        isConfigured: true,
        hasApplicationPassword: true,
        isFromEnv: false,
      },
    });
  } catch (error) {
    console.error("POST /api/wordpress/config error:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração do WordPress" }, { status: 500 });
  }
}

