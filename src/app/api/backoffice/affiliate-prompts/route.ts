import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";
import { CommercialArticleType } from "@/lib/affiliate/types";

export async function GET() {
  try {
    await requireSuperAdmin();
    const templates = await AffiliatePromptTemplateService.listAllGlobalTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar prompts globais";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const {
      type,
      name,
      description,
      systemPrompt,
      userPromptTemplate,
      selectionMode,
      minProducts,
      maxProducts,
      requiresCategory,
      allowsSuggestedTitle,
      variables,
      active,
    } = body;

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Tipo de template comercial (type) é obrigatório." }, { status: 400 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nome do template é obrigatório." }, { status: 400 });
    }

    if (!systemPrompt || typeof systemPrompt !== "string" || !systemPrompt.trim()) {
      return NextResponse.json({ error: "System prompt é obrigatório." }, { status: 400 });
    }

    if (!userPromptTemplate || typeof userPromptTemplate !== "string" || !userPromptTemplate.trim()) {
      return NextResponse.json({ error: "Template de prompt do usuário é obrigatório." }, { status: 400 });
    }

    const created = await AffiliatePromptTemplateService.createGlobalVersion(
      type as CommercialArticleType,
      {
        name,
        description,
        systemPrompt,
        userPromptTemplate,
        selectionMode,
        minProducts: minProducts ? Number(minProducts) : null,
        maxProducts: maxProducts ? Number(maxProducts) : null,
        requiresCategory: Boolean(requiresCategory),
        allowsSuggestedTitle: allowsSuggestedTitle !== false,
        variables: Array.isArray(variables) ? variables : [],
        active: active !== false,
      }
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar versão global do template";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
