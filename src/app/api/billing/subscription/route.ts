import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { BillingService } from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const subscription = await BillingService.getWorkspaceSubscription(workspaceId);

    const articlesCheck = await BillingService.checkLimit(workspaceId, "ARTICLES");
    const sourcesCheck = await BillingService.checkLimit(workspaceId, "SOURCES");

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        validUntil: subscription.validUntil,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      usage: {
        articles: {
          current: articlesCheck.current,
          limit: articlesCheck.limit,
          allowed: articlesCheck.allowed,
        },
        sources: {
          current: sourcesCheck.current,
          limit: sourcesCheck.limit,
          allowed: sourcesCheck.allowed,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/billing/subscription error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar dados da assinatura do workspace" },
      { status: 500 }
    );
  }
}
