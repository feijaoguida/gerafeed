import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingProfileService, maskCpfCnpj } from "@/lib/billing-profile";

const FORBIDDEN_CARD_KEYS = [
  "cardNumber",
  "cardCvv",
  "cvv",
  "expiryMonth",
  "expiryYear",
  "cardHolder",
  "creditCard",
  "cardToken",
];

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Não autenticado ou workspace não selecionado." }, { status: 401 });
    }

    const profile = await BillingProfileService.getProfile(workspaceId);
    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        maskedCpfCnpj: maskCpfCnpj(profile.cpfCnpj),
      },
    });
  } catch (error) {
    console.error("GET /api/billing/profile error:", error);
    return NextResponse.json({ error: "Erro ao consultar perfil de cobrança." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Não autenticado ou workspace não selecionado." }, { status: 401 });
    }

    const body = await request.json();

    // Security check: Never accept credit card fields
    const bodyKeys = Object.keys(body || {});
    const hasCardField = bodyKeys.some((k) =>
      FORBIDDEN_CARD_KEYS.some((fk) => k.toLowerCase().includes(fk.toLowerCase()))
    );

    if (hasCardField) {
      return NextResponse.json(
        { error: "Dados de cartão de crédito não são permitidos nesta operação." },
        { status: 400 }
      );
    }

    const profile = await BillingProfileService.upsertProfile(workspaceId, body);

    return NextResponse.json({
      success: true,
      message: "Dados de cobrança salvos com sucesso!",
      profile: {
        ...profile,
        maskedCpfCnpj: maskCpfCnpj(profile.cpfCnpj),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar dados de cobrança.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
