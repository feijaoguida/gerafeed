import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export interface CreateWordPressSiteInput {
  workspaceId: string;
  name: string;
  url: string;
  username: string;
  applicationPassword?: string;
  encryptedApplicationPassword?: string;
  defaultPromptType?: string | null;
  active?: boolean;
  isDefault?: boolean;
}

export interface UpdateWordPressSiteInput {
  name?: string;
  url?: string;
  username?: string;
  applicationPassword?: string;
  encryptedApplicationPassword?: string;
  defaultPromptType?: string | null;
  active?: boolean;
  isDefault?: boolean;
}

export interface WordPressSiteClientSafe {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  username: string;
  hasPassword: boolean;
  defaultPromptType: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordPressSiteDecryptedConfig {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
  defaultPromptType: string | null;
  active: boolean;
}

/**
 * Sanitizes WordPressSite record for safe return to clients/UI without exposing encrypted secrets.
 */
export function sanitizeWordPressSite(site: {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  username: string;
  encryptedApplicationPassword: string;
  defaultPromptType: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): WordPressSiteClientSafe {
  return {
    id: site.id,
    workspaceId: site.workspaceId,
    name: site.name,
    url: site.url,
    username: site.username,
    hasPassword: !!site.encryptedApplicationPassword,
    defaultPromptType: site.defaultPromptType,
    active: site.active,
    isDefault: site.isDefault,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  };
}

/**
 * Creates a new WordPressSite for a workspace with encrypted application password.
 */
export async function createWordPressSite(input: CreateWordPressSiteInput) {
  if (!input.workspaceId) {
    throw new Error("workspaceId é obrigatório.");
  }
  if (!input.name || !input.name.trim()) {
    throw new Error("Nome do site WordPress é obrigatório.");
  }
  if (!input.url || !input.url.trim()) {
    throw new Error("URL do WordPress é obrigatória.");
  }
  if (!input.username || !input.username.trim()) {
    throw new Error("Usuário do WordPress é obrigatório.");
  }

  let encryptedPassword = input.encryptedApplicationPassword || "";
  if (input.applicationPassword) {
    encryptedPassword = encrypt(input.applicationPassword);
  }

  const site = await prisma.wordPressSite.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name.trim(),
      url: input.url.trim().replace(/\/+$/, ""),
      username: input.username.trim(),
      encryptedApplicationPassword: encryptedPassword,
      defaultPromptType: input.defaultPromptType || null,
      active: input.active !== undefined ? input.active : true,
      isDefault: input.isDefault || false,
    },
  });

  if (input.isDefault) {
    await prisma.wordPressSite.updateMany({
      where: { workspaceId: input.workspaceId, id: { not: site.id } },
      data: { isDefault: false },
    });
  }

  return site;
}

/**
 * Lists all WordPress sites for a workspace.
 */
export async function getWordPressSites(
  workspaceId: string,
  options?: { activeOnly?: boolean }
) {
  if (!workspaceId) {
    throw new Error("workspaceId é obrigatório.");
  }

  const where: { workspaceId: string; active?: boolean } = { workspaceId };
  if (options?.activeOnly) {
    where.active = true;
  }

  const sites = await prisma.wordPressSite.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return sites;
}

/**
 * Retrieves a WordPressSite by ID strictly scoped to workspace.
 */
export async function getWordPressSiteById(workspaceId: string, siteId: string) {
  if (!workspaceId || !siteId) {
    throw new Error("workspaceId e siteId são obrigatórios.");
  }

  const site = await prisma.wordPressSite.findFirst({
    where: {
      id: siteId,
      workspaceId,
    },
  });

  return site;
}

/**
 * Retrieves decrypted WordPress configuration for server-side API interactions.
 */
export async function getWordPressSiteConfig(
  workspaceId: string,
  siteId: string
): Promise<WordPressSiteDecryptedConfig | null> {
  const site = await getWordPressSiteById(workspaceId, siteId);
  if (!site) return null;

  let plainPassword = "";
  if (site.encryptedApplicationPassword) {
    try {
      plainPassword = decrypt(site.encryptedApplicationPassword);
    } catch (err) {
      console.error(`Erro ao descriptografar senha do WordPressSite ${siteId}:`, err);
    }
  }

  return {
    id: site.id,
    workspaceId: site.workspaceId,
    name: site.name,
    url: site.url,
    username: site.username,
    applicationPassword: plainPassword,
    defaultPromptType: site.defaultPromptType,
    active: site.active,
  };
}

/**
 * Updates a WordPressSite strictly scoped to workspace.
 */
export async function updateWordPressSite(
  workspaceId: string,
  siteId: string,
  input: UpdateWordPressSiteInput
) {
  if (!workspaceId || !siteId) {
    throw new Error("workspaceId e siteId são obrigatórios.");
  }

  // Ensure site exists and belongs to workspace
  const existing = await getWordPressSiteById(workspaceId, siteId);
  if (!existing) {
    throw new Error(`WordPressSite ${siteId} não encontrado no Workspace.`);
  }

  const data: {
    name?: string;
    url?: string;
    username?: string;
    encryptedApplicationPassword?: string;
    defaultPromptType?: string | null;
    active?: boolean;
    isDefault?: boolean;
  } = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.url !== undefined) data.url = input.url.trim().replace(/\/+$/, "");
  if (input.username !== undefined) data.username = input.username.trim();
  if (input.defaultPromptType !== undefined) data.defaultPromptType = input.defaultPromptType;
  if (input.active !== undefined) data.active = input.active;
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;

  if (input.applicationPassword !== undefined) {
    data.encryptedApplicationPassword = encrypt(input.applicationPassword);
  } else if (input.encryptedApplicationPassword !== undefined) {
    data.encryptedApplicationPassword = input.encryptedApplicationPassword;
  }

  const updated = await prisma.wordPressSite.update({
    where: { id: siteId },
    data,
  });

  if (input.isDefault === true) {
    await prisma.wordPressSite.updateMany({
      where: { workspaceId, id: { not: siteId } },
      data: { isDefault: false },
    });
  }

  return updated;
}

/**
 * Deletes a WordPressSite strictly scoped to workspace.
 */
export async function deleteWordPressSite(workspaceId: string, siteId: string) {
  if (!workspaceId || !siteId) {
    throw new Error("workspaceId e siteId são obrigatórios.");
  }

  const existing = await getWordPressSiteById(workspaceId, siteId);
  if (!existing) {
    throw new Error(`WordPressSite ${siteId} não encontrado no Workspace.`);
  }

  return await prisma.wordPressSite.delete({
    where: { id: siteId },
  });
}
