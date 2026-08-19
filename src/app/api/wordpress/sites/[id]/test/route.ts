import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { getWordPressSiteConfig } from "@/lib/wordpress-sites";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = await getSessionWorkspaceId();

    const config = await getWordPressSiteConfig(workspaceId, id);
    if (!config) {
      return NextResponse.json(
        { error: "Site WordPress não encontrado no Workspace." },
        { status: 404 }
      );
    }

    if (!config.url || !config.username || !config.applicationPassword) {
      return NextResponse.json(
        { error: "Credenciais incompletas. Verifique URL, usuário e Application Password." },
        { status: 400 }
      );
    }

    const credentials = `${config.username}:${config.applicationPassword}`;
    const base64Auth = Buffer.from(credentials).toString("base64");

    const res = await fetch(`${config.url}/wp-json/wp/v2/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${base64Auth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Falha na conexão com o WordPress (${res.status} ${res.statusText}): ${errorText.substring(0, 200)}`,
        },
        { status: 400 }
      );
    }

    const user = await res.json();
    return NextResponse.json({
      success: true,
      connected: true,
      wordpressUrl: config.url,
      user: {
        id: user.id,
        name: user.name,
        slug: user.slug,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/wordpress/sites/[id]/test error:", error);
    const message = error instanceof Error ? error.message : "Erro ao testar conexão com o WordPress.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
