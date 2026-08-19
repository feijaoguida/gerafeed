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

        // 1. SuperAdmin Credentials Check
        const superAdminEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
        const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

        if (superAdminEmail && superAdminPassword && email.toLowerCase() === superAdminEmail && password === superAdminPassword) {
          const superUser = await prisma.user.upsert({
            where: { email: superAdminEmail },
            update: {
              name: "Super Admin",
              isSuperAdmin: true,
            },
            create: {
              name: "Super Admin",
              email: superAdminEmail,
              isSuperAdmin: true,
            },
          });

          const workspaceId = await ensureUserWorkspace(superUser.id);

          return {
            id: superUser.id,
            name: superUser.name || "Super Admin",
            email: superUser.email,
            workspaceId,
            isSuperAdmin: true,
          };
        }

        // 2. Standard Admin Credentials Check (Legacy MVP admin)
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

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
            isSuperAdmin: Boolean(dbUser.isSuperAdmin),
          };
        }

        // 3. Check if standard registered user exists in DB
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
            isSuperAdmin: Boolean(regularUser.isSuperAdmin),
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
        token.isSuperAdmin = Boolean(user.isSuperAdmin);
      }

      // If token missing workspaceId or isSuperAdmin, resolve from DB
      if (token.id && (!token.workspaceId || token.isSuperAdmin === undefined)) {
        token.workspaceId = await ensureUserWorkspace(token.id as string);
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSuperAdmin: true },
        });
        token.isSuperAdmin = Boolean(dbUser?.isSuperAdmin);
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
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },
});

