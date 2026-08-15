import { handlers } from "@/auth";

/**
 * NextAuth catch-all route handler.
 * Auth.js v5 — handles GET (session) and POST (sign-in/sign-out).
 */
export const { GET, POST } = handlers;
