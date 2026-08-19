import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isSuperAdminUser } from "@/lib/superadmin";
import { BackofficeSidebar } from "@/components/backoffice/backoffice-sidebar";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased flex flex-col lg:flex-row">
      <BackofficeSidebar userEmail={session.user.email} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-zinc-900/40">
        {children}
      </div>
    </div>
  );
}

