import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const DEFAULT_WORKSPACE_ID = "default-workspace";

/**
 * Ensures the user has a Workspace assigned in DB and returns the workspaceId.
 */
async function ensureUserWorkspace(userId: string): Promise<string> {
  const existingMember = await prisma.workspaceUser.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });

  if (existingMember) {
    return existingMember.workspaceId;
  }

  // Ensure default workspace exists
  await prisma.workspace.upsert({
    where: { id: DEFAULT_WORKSPACE_ID },
    update: {},
    create: {
      id: DEFAULT_WORKSPACE_ID,
      name: "Default",
      slug: "default",
    },
  });

  // Assign user to default workspace as OWNER
  const newMember = await prisma.workspaceUser.create({
    data: {
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId,
      role: "OWNER",
    },
  });

  return newMember.workspaceId;
}

/**
 * Auth.js v5 central configuration.
 *
 * Task 032 — Multi-tenant Session Isolation:
 * Injects workspaceId into JWT and Session.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          console.error(
            "[auth] ADMIN_EMAIL ou ADMIN_PASSWORD não configurados no ambiente."
          );
          return null;
        }

        if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
          // Find or create user in DB
          const dbUser = await prisma.user.upsert({
            where: { email: adminEmail },
            update: { name: "Admin" },
            create: {
              name: "Admin",
              email: adminEmail,
            },
          });

          const workspaceId = await ensureUserWorkspace(dbUser.id);

          return {
            id: dbUser.id,
            name: dbUser.name || "Admin",
            email: dbUser.email,
            workspaceId,
          };
        }

        // Check if standard registered user exists in DB
        const regularUser = await prisma.user.findUnique({
          where: { email },
        });

        if (regularUser) {
          const workspaceId = await ensureUserWorkspace(regularUser.id);
          return {
            id: regularUser.id,
            name: regularUser.name || "Usuário",
            email: regularUser.email,
            workspaceId,
          };
        }

        return null;
      },
    }),
  ],


  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = user.workspaceId;
      }

      // If token missing workspaceId, resolve from DB
      if (token.id && !token.workspaceId) {
        token.workspaceId = await ensureUserWorkspace(token.id as string);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.workspaceId) {
          session.user.workspaceId = token.workspaceId as string;
          session.workspaceId = token.workspaceId as string;
        }
      }
      return session;
    },
  },
});

