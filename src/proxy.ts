import { auth as proxy } from "@/auth";

export { proxy };

/**
 * Next.js 16 proxy — substitui o middleware.ts do Edge runtime.
 * Roda no Node.js runtime nativo, sem restrições de compatibilidade com Prisma/DB.
 *
 * Rotas protegidas: qualquer rota que NÃO seja pública.
 * Rotas públicas: /, /login e assets estáticos.
 */
export const config = {
  matcher: [
    /*
     * Protege tudo, exceto:
     * - / (landing page pública)
     * - /login (página de login)
     * - /register (página de cadastro)
     * - /api/auth/* (rotas internas do Auth.js)
     * - _next/static, _next/image, favicon.ico, assets estáticos
     */
    "/((?!$|login|register|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};


