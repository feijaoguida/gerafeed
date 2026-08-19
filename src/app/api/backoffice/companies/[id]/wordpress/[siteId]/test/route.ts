import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { getWordPressSiteConfig } from "@/lib/wordpress-sites";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: workspaceId, siteId } = await params;
    const body = await request.json().catch(() => ({}));
    const { url: overrideUrl, username: overrideUsername, applicationPassword: overridePassword } = body;

    let targetUrl = overrideUrl;
    let targetUsername = overrideUsername;
    let targetPassword = overridePassword;

    if (!targetUrl || !targetUsername || !targetPassword) {
      const config = await getWordPressSiteConfig(workspaceId, siteId);
      if (!config) {
        return NextResponse.json({ error: "Site WordPress não encontrado na empresa." }, { status: 404 });
      }
      targetUrl = targetUrl || config.url;
      targetUsername = targetUsername || config.username;
      targetPassword = targetPassword || config.applicationPassword;
    }

    if (!targetUrl || !targetUsername || !targetPassword) {
      return NextResponse.json(
        { error: "Credenciais incompletas para teste de conexão." },
        { status: 400 }
      );
    }

    const credentials = `${targetUsername.trim()}:${targetPassword.trim()}`;
    const base64Auth = Buffer.from(credentials).toString("base64");
    const cleanUrl = targetUrl.trim().replace(/\/+$/, "");

    const res = await fetch(`${cleanUrl}/wp-json/wp/v2/users/me`, {
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
          success: false,
          error: `Falha na autenticação do WordPress (${res.status}): ${errorText.substring(0, 150)}`,
        },
        { status: 400 }
      );
    }

    const user = await res.json();
    return NextResponse.json({
      success: true,
      message: `Conexão bem-sucedida! Autenticado como ${user.name || user.slug || targetUsername}.`,
      user: {
        id: user.id,
        name: user.name,
        slug: user.slug,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao testar conexão com WordPress.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
