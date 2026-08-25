import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/config";
import { PromptSettings, DEFAULT_PROMPT_SETTINGS } from "@/lib/ai";
import { getSessionWorkspaceId } from "@/lib/workspace";
import {
  BillingService,
  AI_FEATURES,
  ALLOWED_NICHES_RESTRICTED,
  ALLOWED_STYLES_RESTRICTED,
} from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const config = await getConfig<PromptSettings>("aiPromptSettings", workspaceId);

    if (!config) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_PROMPT_SETTINGS,
        isDefault: true,
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        portalArea: config.portalArea || DEFAULT_PROMPT_SETTINGS.portalArea,
        customPortalArea: config.customPortalArea || "",
        writingStyles: Array.isArray(config.writingStyles) ? config.writingStyles : DEFAULT_PROMPT_SETTINGS.writingStyles,
        customWritingStyle: config.customWritingStyle || "",
      },
      isDefault: false,
    });
  } catch (error) {
    console.error("GET /api/ai/prompt-settings error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações do prompt editorial." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();
    const { portalArea, customPortalArea, writingStyles, customWritingStyle } = body;

    // Plan restriction: validate portalArea against allowed niches
    if (typeof portalArea === "string") {
      const hasUnlimitedNiches = await BillingService.hasFeature(workspaceId, AI_FEATURES.UNLIMITED_NICHES);
      if (!hasUnlimitedNiches) {
        const allowedNiches: readonly string[] = ALLOWED_NICHES_RESTRICTED;
        if (!allowedNiches.includes(portalArea)) {
          return NextResponse.json(
            {
              error: `A área de atuação "${portalArea}" não está disponível no seu plano. As opções disponíveis são: ${ALLOWED_NICHES_RESTRICTED.join(", ")}. Faça upgrade para acessar todos os nichos.`,
              limitReached: true,
              resource: "AI_NICHES",
            },
            { status: 403 }
          );
        }
      }
    }

    // Validation: writingStyles must be an array with max 3 items
    if (writingStyles !== undefined) {
      if (!Array.isArray(writingStyles)) {
        return NextResponse.json(
          { error: "O campo writingStyles deve ser um array." },
          { status: 400 }
        );
      }

      if (writingStyles.length > 3) {
        return NextResponse.json(
          { error: "É permitido selecionar no máximo 3 estilos de escrita." },
          { status: 400 }
        );
      }

      for (const style of writingStyles) {
        if (typeof style !== "string") {
          return NextResponse.json(
            { error: "Todos os estilos de escrita devem ser strings." },
            { status: 400 }
          );
        }
      }

      // Plan restriction: validate writing styles against allowed list
      const hasUnlimitedStyles = await BillingService.hasFeature(workspaceId, AI_FEATURES.UNLIMITED_STYLES);
      if (!hasUnlimitedStyles) {
        const allowedStyles: readonly string[] = ALLOWED_STYLES_RESTRICTED;
        const invalidStyles = writingStyles.filter((s: string) => !allowedStyles.includes(s));
        if (invalidStyles.length > 0) {
          return NextResponse.json(
            {
              error: `Os estilos "${invalidStyles.join(", ")}" não estão disponíveis no seu plano. Os estilos disponíveis são: ${ALLOWED_STYLES_RESTRICTED.join(", ")}. Faça upgrade para acessar todos os estilos.`,
              limitReached: true,
              resource: "AI_STYLES",
            },
            { status: 403 }
          );
        }
      }
    }

    // Validation: customPortalArea max 100 chars
    if (typeof customPortalArea === "string" && customPortalArea.length > 100) {
      return NextResponse.json(
        { error: "O campo personalizado da área do portal deve ter no máximo 100 caracteres." },
        { status: 400 }
      );
    }

    // Validation: customWritingStyle max 100 chars
    if (typeof customWritingStyle === "string" && customWritingStyle.length > 100) {
      return NextResponse.json(
        { error: "O campo personalizado do estilo de escrita deve ter no máximo 100 caracteres." },
        { status: 400 }
      );
    }

    // Validation: portalArea max 100 chars
    if (typeof portalArea === "string" && portalArea.length > 100) {
      return NextResponse.json(
        { error: "O campo da área do portal deve ter no máximo 100 caracteres." },
        { status: 400 }
      );
    }

    const cleanedSettings: PromptSettings = {
      portalArea: typeof portalArea === "string" ? portalArea.trim() : DEFAULT_PROMPT_SETTINGS.portalArea,
      customPortalArea: typeof customPortalArea === "string" ? customPortalArea.trim() : "",
      writingStyles: Array.isArray(writingStyles)
        ? writingStyles.map((s: string) => s.trim()).filter(Boolean)
        : DEFAULT_PROMPT_SETTINGS.writingStyles,
      customWritingStyle: typeof customWritingStyle === "string" ? customWritingStyle.trim() : "",
    };

    await setConfig("aiPromptSettings", cleanedSettings, workspaceId);

    return NextResponse.json({
      success: true,
      message: "Configurações do prompt editorial salvas com sucesso!",
      settings: cleanedSettings,
    });
  } catch (error) {
    console.error("POST /api/ai/prompt-settings error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações do prompt editorial." },
      { status: 500 }
    );
  }
}
