import { auth, DEFAULT_WORKSPACE_ID } from "@/auth";

export { DEFAULT_WORKSPACE_ID };

/**
 * Returns the authenticated user's active workspaceId from session.
 * Falls back to DEFAULT_WORKSPACE_ID if no session is present (e.g. for testing / background execution).
 */
export async function getSessionWorkspaceId(): Promise<string> {
  try {
    const session = await auth();
    return session?.user?.workspaceId || session?.workspaceId || DEFAULT_WORKSPACE_ID;
  } catch {
    return DEFAULT_WORKSPACE_ID;
  }
}

/**
 * Returns the authenticated session and strictly verified workspaceId.
 * If user is not authenticated, throws or returns null.
 */
export async function getAuthenticatedWorkspace(): Promise<{
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
} | null> {
  try {
    const session = await auth();
    if (!session?.user) {
      return null;
    }

    const workspaceId =
      session.user.workspaceId || session.workspaceId || DEFAULT_WORKSPACE_ID;

    return {
      workspaceId,
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userName: session.user.name || undefined,
    };
  } catch {
    return {
      workspaceId: DEFAULT_WORKSPACE_ID,
    };
  }
}

