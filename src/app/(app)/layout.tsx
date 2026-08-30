import { Suspense } from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Layout da área autenticada.
 * Renderiza a Sidebar apenas para rotas protegidas e provê o container com transição de tema claro/escuro.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin);
  const workspaceId =
    session?.user?.workspaceId || session?.workspaceId || DEFAULT_WORKSPACE_ID;

  let hasAffiliateModule = false;
  try {
    hasAffiliateModule = await BillingService.hasFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE
    );
  } catch {
    hasAffiliateModule = false;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      <Suspense
        fallback={
          <div className="w-64 bg-surface border-r border-border shrink-0" />
        }
      >
        <Sidebar
          isSuperAdmin={isSuperAdmin}
          hasAffiliateModule={hasAffiliateModule}
        />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
