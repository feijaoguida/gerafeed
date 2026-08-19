import { auth } from "@/auth";

export default async function BackofficePage() {
  const session = await auth();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Backoffice Superadmin</h1>
          <p className="text-sm text-zinc-400">
            Painel de administração global do sistema. Conectado como {session?.user?.email}
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full uppercase tracking-wider">
          Superadmin Ativo
        </span>
      </div>
      <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
        <p className="text-zinc-300 text-sm">
          Ambiente protegido. Apenas usuários com a flag global <code className="text-indigo-400">isSuperAdmin: true</code> possuem acesso.
        </p>
      </div>
    </div>
  );
}
