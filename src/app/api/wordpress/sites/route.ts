import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  createWordPressSite,
  getWordPressSites,
  sanitizeWordPressSite,
} from "@/lib/wordpress-sites";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const [sites, canConfigureWooCommerce] = await Promise.all([
      getWordPressSites(workspaceId),
      BillingService.hasFeature(workspaceId, AFFILIATE_FEATURES.MODULE),
    ]);
    const sanitized = sites.map((s: Parameters<typeof sanitizeWordPressSite>[0]) => sanitizeWordPressSite(s));

    return NextResponse.json({
      success: true,
      sites: sanitized,
      canConfigureWooCommerce,
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
    const {
      name,
      url,
      username,
      applicationPassword,
      defaultPromptType,
      active,
      isDefault,
      woocommerceConsumerKey,
      woocommerceConsumerSecret,
    } = body;

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

    // Se informou chaves do WooCommerce, validar se o plano do workspace possui o módulo de afiliados
    const hasWcKeyInput = Boolean(
      (woocommerceConsumerKey && woocommerceConsumerKey.trim()) ||
      (woocommerceConsumerSecret && woocommerceConsumerSecret.trim())
    );

    if (hasWcKeyInput) {
      await BillingService.assertFeature(
        workspaceId,
        AFFILIATE_FEATURES.MODULE,
        "A configuração do WooCommerce está disponível apenas para planos com o módulo de Afiliados ativado."
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
      isDefault: isDefault === true,
      woocommerceConsumerKey: woocommerceConsumerKey ? woocommerceConsumerKey.trim() : null,
      woocommerceConsumerSecret: woocommerceConsumerSecret ? woocommerceConsumerSecret.trim() : null,
    });

    return NextResponse.json({
      success: true,
      message: "Site WordPress criado com sucesso!",
      site: sanitizeWordPressSite(created),
    });
  } catch (error: unknown) {
    console.error("POST /api/wordpress/sites error:", error);
    const message = error instanceof Error ? error.message : "Erro ao criar site WordPress.";
    const status = message.includes("módulo de Afiliados") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
