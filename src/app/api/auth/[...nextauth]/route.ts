import { handlers } from "@/auth";
import { NextRequest } from "next/server";

/**
 * NextAuth catch-all route handler.
 * Auth.js v5 — handles GET (session) and POST (sign-in/sign-out).
 * Gracefully handles HEAD requests to avoid UnknownAction errors.
 */
const { GET: authGET, POST: authPOST } = handlers;

export async function GET(request: NextRequest) {
  if (request.method === "HEAD") {
    return new Response(null, { status: 200 });
  }
  return authGET(request);
}

export const POST = authPOST;
