import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      workspaceId?: string;
      isSuperAdmin?: boolean;
    } & DefaultSession["user"];
    workspaceId?: string;
    isSuperAdmin?: boolean;
  }

  interface User {
    id?: string;
    workspaceId?: string;
    isSuperAdmin?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    workspaceId?: string;
    isSuperAdmin?: boolean;
  }
}

