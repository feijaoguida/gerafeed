/**
 * Layout para rotas públicas (landing page, login).
 * Sem sidebar nem autenticação requerida.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
