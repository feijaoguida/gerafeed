import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillingService } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail válido é obrigatório." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === "string" && name.trim() ? name.trim() : "Usuário";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado. Faça login." }, { status: 409 });
    }

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
      },
    });

    // 2. Create dedicated Workspace
    const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20) || "workspace";
    const workspace = await prisma.workspace.create({
      data: {
        name: `Workspace de ${cleanName}`,
        slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // 3. Ensure Default Plans & Free Subscription
    await BillingService.ensureDefaultPlans();
    await BillingService.getWorkspaceSubscription(workspace.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    const message = error instanceof Error ? error.message : "Erro ao criar conta de usuário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
