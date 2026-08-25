import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  createWordPressSite,
  getWordPressSites,
  sanitizeWordPressSite,
} from "@/lib/wordpress-sites";
import { BillingService } from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const sites = await getWordPressSites(workspaceId);
    const sanitized = sites.map((s: Parameters<typeof sanitizeWordPressSite>[0]) => sanitizeWordPressSite(s));

    return NextResponse.json({
      success: true,
      sites: sanitized,
    });
  } catch (error) {
    console.error("GET /api/wordpress/sites error:", error);
    return NextResponse.json(
      { error: "Erro ao listar sites WordPress." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();

    // Check WordPress sites plan limit
    const limitCheck = await BillingService.checkLimit(workspaceId, "WORDPRESS_SITES");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, limitReached: true, resource: "WORDPRESS_SITES" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, url, username, applicationPassword, defaultPromptType, active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "O nome do site é obrigatório." },
        { status: 400 }
      );
    }
    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: "A URL do WordPress é obrigatória." },
        { status: 400 }
      );
    }
    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "O usuário da REST API é obrigatório." },
        { status: 400 }
      );
    }

    const created = await createWordPressSite({
      workspaceId,
      name: name.trim(),
      url: url.trim(),
      username: username.trim(),
      applicationPassword: applicationPassword || "",
      defaultPromptType: defaultPromptType || null,
      active: active !== undefined ? active : true,
    });

    return NextResponse.json({
      success: true,
      message: "Site WordPress criado com sucesso!",
      site: sanitizeWordPressSite(created),
    });
  } catch (error: unknown) {
    console.error("POST /api/wordpress/sites error:", error);
    const message = error instanceof Error ? error.message : "Erro ao criar site WordPress.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
