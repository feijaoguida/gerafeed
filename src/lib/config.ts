import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DEFAULT_WORKSPACE_ID } from "@/auth";

export { DEFAULT_WORKSPACE_ID };

/**
 * Retrieves a configuration value by key and workspaceId.
 * Returns null if the configuration key does not exist.
 */
export async function getConfig<T = unknown>(
  key: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<T | null> {
  const config = await prisma.configuration.findUnique({
    where: {
      workspaceId_key: { workspaceId, key },
    },
  });

  if (!config) return null;
  return config.value as T;
}

/**
 * Upserts a configuration entry by key and workspaceId.
 * Overwrites existing configuration or creates a new entry if key does not exist.
 */
export async function setConfig<T = unknown>(
  key: string,
  value: T,
  workspaceId: string = DEFAULT_WORKSPACE_ID
) {
  const jsonValue = value as Prisma.InputJsonValue;

  const result = await prisma.configuration.upsert({
    where: {
      workspaceId_key: { workspaceId, key },
    },
    update: {
      value: jsonValue,
    },
    create: {
      workspaceId,
      key,
      value: jsonValue,
    },
  });

  return result;
}

/**
 * Returns all stored configuration entries for a specific workspace.
 */
export async function getAllConfigs(workspaceId: string = DEFAULT_WORKSPACE_ID) {
  return await prisma.configuration.findMany({
    where: { workspaceId },
    orderBy: { key: "asc" },
  });
}

/**
 * Removes a configuration entry by key and workspaceId.
 */
export async function deleteConfig(
  key: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID
): Promise<boolean> {
  try {
    await prisma.configuration.delete({
      where: {
        workspaceId_key: { workspaceId, key },
      },
    });
    return true;
  } catch {
    return false;
  }
}

