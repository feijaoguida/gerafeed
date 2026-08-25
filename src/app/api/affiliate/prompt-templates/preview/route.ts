import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { AffiliatePromptTemplateService, CommercialArticleType } from "@/lib/affiliate";

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O módulo de afiliados não está habilitado no seu plano."
    );

    const body = await request.json();
    const type = (body.type || "PRODUCT_REVIEW") as CommercialArticleType;
    const customUserPrompt = body.userPromptTemplate;
    const customSystemPrompt = body.systemPrompt;
    const context = body.context || {
      product: {
        name: "Smartphone Galaxy S24 Ultra 512GB",
        brand: "Samsung",
        description: "Flagship premium com Galaxy AI, câmera de 200MP e tela Dynamic AMOLED 2X.",
        price: "R$ 6.499,00",
        oldPrice: "R$ 8.999,00",
        seller: "Loja Oficial Samsung",
        rating: "4.9",
        specs: "- Processador: Snapdragon 8 Gen 3\n- Tela: 6.8 polegadas QHD+ 120Hz\n- Bateria: 5000mAh",
        pros: "- Desempenho absurdo\n- Câmeras líderes de mercado\n- Construção em titânio",
        cons: "- Preço muito elevado no lançamento\n- Aparelho pesado",
      },
      category: {
        name: "Smartphones Top de Linha",
      },
      customInstructions: "Adicione uma seção comparando com o modelo da geração anterior.",
      productsList: "1. Galaxy S24 Ultra (R$ 6.499) - Melhor Geral\n2. iPhone 15 Pro Max (R$ 7.299) - Melhor em Vídeo\n3. Xiaomi 14 Ultra (R$ 5.999) - Melhor Câmera Manual",
    };

    let templateToRender = customUserPrompt;
    let systemPromptToRender = customSystemPrompt;

    if (!templateToRender) {
      const effective = await AffiliatePromptTemplateService.getEffectiveTemplate(workspaceId, type);
      templateToRender = effective.userPromptTemplate;
      systemPromptToRender = effective.systemPrompt;
    }

    const renderedUserPrompt = AffiliatePromptTemplateService.renderPrompt(templateToRender, context);

    return NextResponse.json({
      type,
      systemPrompt: systemPromptToRender,
      renderedPrompt: renderedUserPrompt,
      contextUsed: context,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao gerar preview de prompt";
    const status = msg.includes("não está habilitado") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
