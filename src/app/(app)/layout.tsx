import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";

/**
 * Layout da área autenticada.
 * Renderiza a Sidebar apenas para rotas protegidas e provê o container com transição de tema claro/escuro.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <Suspense
        fallback={
          <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
