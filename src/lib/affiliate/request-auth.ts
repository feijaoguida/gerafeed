import { auth } from '@/auth';
import { AffiliateContentError } from './block-contract';
export async function requireAffiliateWorkspace(): Promise<string> {
  const session = await auth();
  const workspaceId = session?.user?.workspaceId || session?.workspaceId;
  if (!session?.user || !workspaceId) throw new AffiliateContentError('Faça login para continuar.',401);
  return workspaceId;
}
