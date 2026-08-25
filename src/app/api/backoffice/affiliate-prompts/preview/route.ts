import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superadmin";
import { AffiliatePromptTemplateService } from "@/lib/affiliate/prompt-template-service";

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const { userPromptTemplate, context } = body;

    if (!userPromptTemplate || typeof userPromptTemplate !== "string") {
      return NextResponse.json({ error: "userPromptTemplate é obrigatório." }, { status: 400 });
    }

    const sampleContext = (context && typeof context === "object") ? context : {
      product: {
        name: "Apple iPhone 15 Pro 128GB",
        brand: "Apple",
        description: "Smartphone com chip A17 Pro e estrutura em titânio.",
        price: "R$ 6.499,00",
        specs: "- Tela: Super Retina XDR 6.1\n- Chip: A17 Pro\n- Câmera: 48MP",
        pros: "- Acabamento premium em titânio\n- Excelente desempenho",
        cons: "- Preço elevado",
        rating: "4.9",
        reviews: "- [Nota: 5] Câmeras espetaculares e bateria ótima.",
        referenceSources: "- TechReview Lab: Desempenho líder em benchmarks.",
      },
      category: {
        name: "Smartphones",
      },
      customInstructions: "Destaque o acabamento em titânio aeroespacial.",
    };

    const rendered = AffiliatePromptTemplateService.renderPrompt(userPromptTemplate, sampleContext);
    return NextResponse.json({ rendered });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao testar prévia do prompt";
    const status = message.includes("Não autenticado") ? 401 : message.includes("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
