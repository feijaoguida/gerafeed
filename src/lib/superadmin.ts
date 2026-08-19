import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface SuperAdminSeedResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
  };
  reason?: string;
}

/**
 * Idempotently seeds or updates the SuperAdmin user from environment variables.
 * Never prints or leaks passwords in logs.
 */
export async function seedSuperAdmin(): Promise<SuperAdminSeedResult> {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    return {
      success: false,
      reason: "SUPERADMIN_EMAIL_OR_PASSWORD_NOT_CONFIGURED",
    };
  }

  // Idempotently create or update User with isSuperAdmin: true
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      isSuperAdmin: true,
      name: "Super Admin",
    },
    create: {
      email,
      name: "Super Admin",
      isSuperAdmin: true,
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
    },
  };
}

/**
 * Validates whether a specific userId is a registered SuperAdmin in DB.
 */
export async function isSuperAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  return Boolean(user?.isSuperAdmin);
}

/**
 * Server-side authorization guard for Backoffice APIs and actions.
 * Throws 403 / Error if the user is not an authenticated SuperAdmin.
 */
export async function requireSuperAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Não autenticado. Faça login para acessar.");
  }

  const isSuper = await isSuperAdminUser(session.user.id);
  if (!isSuper) {
    throw new Error("Acesso negado: Requer privilégios de SuperAdmin.");
  }

  return {
    userId: session.user.id,
    user: session.user,
    session,
  };
}
