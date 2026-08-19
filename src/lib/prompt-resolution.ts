import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { PromptSettings, DEFAULT_PROMPT_SETTINGS } from "@/lib/ai/types";

export type PromptSourceOrigin =
  | "OVERRIDE"
  | "SOURCE_DEFAULT"
  | "WORDPRESS_SITE_DEFAULT"
  | "WORKSPACE_DEFAULT";

export interface ResolvePromptTypeInput {
  workspaceId: string;
  sourceId?: string | null;
  wordpressSiteId?: string | null;
}

export interface PromptResolutionResult {
  promptType: string;
  origin: PromptSourceOrigin;
  workspaceSettings?: PromptSettings;
}

export const DEFAULT_PROMPT_TYPE = "INFORMATIVE";

/**
 * Centralized Prompt Resolution Service.
 *
 * Precedence Hierarchy:
 * 1. Feed ↔ WordPress Override (WordPressSiteSource.promptTypeOverride)
 * 2. Feed Default (Source.defaultPromptType)
 * 3. WordPress Site Default (WordPressSite.defaultPromptType)
 * 4. Workspace Default (Global aiPromptSettings / DEFAULT_PROMPT_TYPE)
 *
 * Validates tenant isolation for all referenced entities.
 */
export async function resolvePromptType(
  input: ResolvePromptTypeInput
): Promise<PromptResolutionResult> {
  const { workspaceId, sourceId, wordpressSiteId } = input;

  if (!workspaceId) {
    throw new Error("workspaceId é obrigatório para resolver o prompt.");
  }

  // 1. Check Feed ↔ WordPress Override (requires both sourceId and wordpressSiteId)
  if (sourceId && wordpressSiteId) {
    const assignment = await prisma.wordPressSiteSource.findFirst({
      where: {
        workspaceId,
        wordpressSiteId,
        sourceId,
        active: true,
      },
    });

    if (assignment?.promptTypeOverride && assignment.promptTypeOverride.trim()) {
      return {
        promptType: assignment.promptTypeOverride.trim(),
        origin: "OVERRIDE",
      };
    }
  }

  // 2. Check Feed Default (Source.defaultPromptType)
  if (sourceId) {
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        workspaceId,
      },
    });

    if (source?.defaultPromptType && source.defaultPromptType.trim()) {
      return {
        promptType: source.defaultPromptType.trim(),
        origin: "SOURCE_DEFAULT",
      };
    }
  }

  // 3. Check WordPress Site Default (WordPressSite.defaultPromptType)
  if (wordpressSiteId) {
    const site = await prisma.wordPressSite.findFirst({
      where: {
        id: wordpressSiteId,
        workspaceId,
      },
    });

    if (site?.defaultPromptType && site.defaultPromptType.trim()) {
      return {
        promptType: site.defaultPromptType.trim(),
        origin: "WORDPRESS_SITE_DEFAULT",
      };
    }
  }

  // 4. Fallback: Workspace Default
  const workspacePromptConfig = await getConfig<PromptSettings>(
    "aiPromptSettings",
    workspaceId
  );

  const effectiveSettings = workspacePromptConfig || DEFAULT_PROMPT_SETTINGS;
  const workspacePromptType =
    effectiveSettings.writingStyles?.[0] || DEFAULT_PROMPT_TYPE;

  return {
    promptType: workspacePromptType,
    origin: "WORKSPACE_DEFAULT",
    workspaceSettings: effectiveSettings,
  };
}
