import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isSuperAdminUser } from "@/lib/superadmin";
import { BackofficeSidebar } from "@/components/backoffice/backoffice-sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isSuper = await isSuperAdminUser(session.user.id);
  if (!isSuper) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col lg:flex-row">
      <BackofficeSidebar userEmail={session.user.email} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-surface-muted/30">
        {children}
      </div>
    </div>
  );
}

