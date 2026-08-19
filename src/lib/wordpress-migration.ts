import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/crypto";
import { assignSourceToWordPressSite } from "@/lib/wordpress-site-sources";
import { WordPressConnectionConfigStored } from "@/lib/wordpress";

export interface MigrationResult {
  workspaceId: string;
  migrated: boolean;
  siteId?: string;
  siteName?: string;
  associatedSourcesCount: number;
  updatedCategoriesCount: number;
  updatedArticlesCount: number;
  reason?: string;
}

/**
 * Migrates legacy Configuration.wordpressConnection to WordPressSite model idempotently.
 */
export async function migrateLegacyWordPressConfig(workspaceId: string): Promise<MigrationResult> {
  const legacyConfigRow = await prisma.configuration.findFirst({
    where: {
      workspaceId,
      key: "wordpressConnection",
    },
  });

  if (!legacyConfigRow || !legacyConfigRow.value) {
    return {
      workspaceId,
      migrated: false,
      associatedSourcesCount: 0,
      updatedCategoriesCount: 0,
      updatedArticlesCount: 0,
      reason: "NO_LEGACY_CONFIG",
    };
  }

  const legacyValue = legacyConfigRow.value as unknown as WordPressConnectionConfigStored;
  if (!legacyValue.url || !legacyValue.username) {
    return {
      workspaceId,
      migrated: false,
      associatedSourcesCount: 0,
      updatedCategoriesCount: 0,
      updatedArticlesCount: 0,
      reason: "INVALID_LEGACY_DATA",
    };
  }

  const cleanUrl = legacyValue.url.replace(/\/+$/, "");

  // Decrypt password
  let plainPassword = "";
  if (legacyValue.applicationPassword) {
    try {
      plainPassword = decrypt(legacyValue.applicationPassword);
    } catch {
      // If decryption fails, password might already be encrypted or corrupted
      plainPassword = "";
    }
  }

  // Idempotency: check if WordPressSite already exists in this workspace
  let wpSite = await prisma.wordPressSite.findFirst({
    where: {
      workspaceId,
      OR: [
        { url: cleanUrl },
        { name: "Site Principal" },
      ],
    },
  });

  let createdNewSite = false;

  if (!wpSite) {
    // Encrypt password securely
    const encryptedApplicationPassword = plainPassword ? encrypt(plainPassword) : (legacyValue.applicationPassword || "");

    wpSite = await prisma.wordPressSite.create({
      data: {
        workspaceId,
        name: "Site Principal",
        url: cleanUrl,
        username: legacyValue.username,
        encryptedApplicationPassword,
        active: true,
      },
    });
    createdNewSite = true;
  }

  // Associate all existing workspace sources to this WordPress site
  const existingSources = await prisma.source.findMany({
    where: { workspaceId },
  });

  let associatedCount = 0;
  for (const source of existingSources) {
    await assignSourceToWordPressSite({
      workspaceId,
      wordpressSiteId: wpSite.id,
      sourceId: source.id,
      promptTypeOverride: null,
    });
    associatedCount++;
  }

  // Update existing categories that have no site assigned
  const updatedCategories = await prisma.wordPressCategory.updateMany({
    where: {
      workspaceId,
      wordpressSiteId: null,
    },
    data: {
      wordpressSiteId: wpSite.id,
    },
  });

  // Update existing articles that have no site assigned
  const updatedArticles = await prisma.article.updateMany({
    where: {
      workspaceId,
      wordpressSiteId: null,
    },
    data: {
      wordpressSiteId: wpSite.id,
    },
  });

  return {
    workspaceId,
    migrated: true,
    siteId: wpSite.id,
    siteName: wpSite.name,
    associatedSourcesCount: associatedCount,
    updatedCategoriesCount: updatedCategories.count,
    updatedArticlesCount: updatedArticles.count,
    reason: createdNewSite ? "CREATED_AND_ASSOCIATED" : "ALREADY_EXISTED_AND_ASSOCIATED",
  };
}

/**
 * Run migration across all workspaces with legacy configuration.
 */
export async function migrateAllWorkspacesLegacyWordPress(): Promise<MigrationResult[]> {
  const legacyConfigs = await prisma.configuration.findMany({
    where: { key: "wordpressConnection" },
  });

  const results: MigrationResult[] = [];
  for (const config of legacyConfigs) {
    const res = await migrateLegacyWordPressConfig(config.workspaceId);
    results.push(res);
  }
  return results;
}
