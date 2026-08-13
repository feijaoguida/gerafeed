import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Retrieves a configuration value by key.
 * Returns null if the configuration key does not exist.
 */
export async function getConfig<T = unknown>(key: string): Promise<T | null> {
  const config = await prisma.configuration.findUnique({
    where: { key },
  });

  if (!config) return null;
  return config.value as T;
}

/**
 * Upserts a configuration entry by key.
 * Overwrites existing configuration or creates a new entry if key does not exist.
 */
export async function setConfig<T = unknown>(key: string, value: T) {
  const jsonValue = value as Prisma.InputJsonValue;

  const result = await prisma.configuration.upsert({
    where: { key },
    update: {
      value: jsonValue,
    },
    create: {
      key,
      value: jsonValue,
    },
  });

  return result;
}

/**
 * Returns all stored configuration entries.
 */
export async function getAllConfigs() {
  return await prisma.configuration.findMany({
    orderBy: { key: "asc" },
  });
}

/**
 * Removes a configuration entry by key.
 */
export async function deleteConfig(key: string): Promise<boolean> {
  try {
    await prisma.configuration.delete({
      where: { key },
    });
    return true;
  } catch {
    return false;
  }
}
