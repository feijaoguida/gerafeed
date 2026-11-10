import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Rotas públicas exatas que não requerem autenticação.
 */
const PUBLIC_EXACT_ROUTES = new Set([
  "",
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/como-funciona",
  "/automacao-wordpress",
  "/rss-para-wordpress",
  "/curadoria-de-conteudo-com-ia",
  "/para-agencias",
  "/para-portais-de-noticias",
  "/blog",
  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",
]);

/**
 * Prefixos de rotas públicas.
 */
const PUBLIC_PREFIXES = [
  "/blog/",
  "/api/auth/",
  "/api/billing/coupons/validate",
  "/api/webhooks/",
  "/_next/",
];

/**
 * Verifica se um caminho de URL é de acesso público.
 */
export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_ROUTES.has(pathname)) {
    return true;
  }
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }
  // Arquivos estáticos comuns (extensões de mídia/código/estilo)
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|css|js|map)$/i.test(pathname)) {
    return true;
  }
  return false;
}

/**
 * Proxy de segurança do Next.js 16.
 * Bloqueia requisições não autenticadas em rotas protegidas:
 * - Em rotas /api/*: responde HTTP 401 JSON.
 * - Em rotas de páginas: redireciona para /login com callbackUrl.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user?.id) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
