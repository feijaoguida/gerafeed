import { prisma } from "@/lib/prisma";

export interface AssignSourceToWordPressSiteInput {
  workspaceId: string;
  wordpressSiteId: string;
  sourceId: string;
  promptTypeOverride?: string | null;
  active?: boolean;
}

export interface UpdateWordPressSiteSourceInput {
  promptTypeOverride?: string | null;
  active?: boolean;
}

/**
 * Assigns a Source/Feed to a WordPressSite with strict workspace isolation.
 * Validates that both the WordPressSite and the Source belong to the specified workspaceId.
 */
export async function assignSourceToWordPressSite(input: AssignSourceToWordPressSiteInput) {
  if (!input.workspaceId || !input.wordpressSiteId || !input.sourceId) {
    throw new Error("workspaceId, wordpressSiteId e sourceId são obrigatórios.");
  }

  // Validate WordPressSite belongs to Workspace
  const site = await prisma.wordPressSite.findFirst({
    where: {
      id: input.wordpressSiteId,
      workspaceId: input.workspaceId,
    },
  });
  if (!site) {
    throw new Error("WordPressSite não encontrado no Workspace especificado.");
  }

  // Validate Source belongs to Workspace
  const source = await prisma.source.findFirst({
    where: {
      id: input.sourceId,
      workspaceId: input.workspaceId,
    },
  });
  if (!source) {
    throw new Error("Source/Feed não encontrado no Workspace especificado.");
  }

  // Upsert assignment
  const assignment = await prisma.wordPressSiteSource.upsert({
    where: {
      wordpressSiteId_sourceId: {
        wordpressSiteId: input.wordpressSiteId,
        sourceId: input.sourceId,
      },
    },
    update: {
      active: input.active !== undefined ? input.active : true,
      promptTypeOverride: input.promptTypeOverride !== undefined ? input.promptTypeOverride : undefined,
    },
    create: {
      workspaceId: input.workspaceId,
      wordpressSiteId: input.wordpressSiteId,
      sourceId: input.sourceId,
      active: input.active !== undefined ? input.active : true,
      promptTypeOverride: input.promptTypeOverride || null,
    },
    include: {
      source: true,
      wordpressSite: true,
    },
  });

  return assignment;
}

/**
 * Updates an existing WordPressSiteSource assignment with strict workspace verification.
 */
export async function updateWordPressSiteSource(
  workspaceId: string,
  assignmentId: string,
  input: UpdateWordPressSiteSourceInput
) {
  if (!workspaceId || !assignmentId) {
    throw new Error("workspaceId e assignmentId são obrigatórios.");
  }

  const existing = await prisma.wordPressSiteSource.findFirst({
    where: {
      id: assignmentId,
      workspaceId,
    },
  });
  if (!existing) {
    throw new Error("Vínculo Feed ↔ WordPress não encontrado no Workspace.");
  }

  const data: {
    promptTypeOverride?: string | null;
    active?: boolean;
  } = {};

  if (input.promptTypeOverride !== undefined) data.promptTypeOverride = input.promptTypeOverride;
  if (input.active !== undefined) data.active = input.active;

  const updated = await prisma.wordPressSiteSource.update({
    where: { id: assignmentId },
    data,
    include: {
      source: true,
      wordpressSite: true,
    },
  });

  return updated;
}

/**
 * Removes an assignment between a WordPressSite and a Source strictly scoped to workspace.
 */
export async function removeSourceFromWordPressSite(
  workspaceId: string,
  wordpressSiteId: string,
  sourceId: string
) {
  if (!workspaceId || !wordpressSiteId || !sourceId) {
    throw new Error("workspaceId, wordpressSiteId e sourceId são obrigatórios.");
  }

  const existing = await prisma.wordPressSiteSource.findFirst({
    where: {
      workspaceId,
      wordpressSiteId,
      sourceId,
    },
  });
  if (!existing) {
    throw new Error("Vínculo Feed ↔ WordPress não encontrado no Workspace.");
  }

  return await prisma.wordPressSiteSource.delete({
    where: { id: existing.id },
  });
}

/**
 * Lists all Source assignments for a specific WordPressSite.
 */
export async function getSourcesForWordPressSite(
  workspaceId: string,
  wordpressSiteId: string,
  options?: { activeOnly?: boolean }
) {
  if (!workspaceId || !wordpressSiteId) {
    throw new Error("workspaceId e wordpressSiteId são obrigatórios.");
  }

  const where: {
    workspaceId: string;
    wordpressSiteId: string;
    active?: boolean;
  } = {
    workspaceId,
    wordpressSiteId,
  };

  if (options?.activeOnly) {
    where.active = true;
  }

  return await prisma.wordPressSiteSource.findMany({
    where,
    include: {
      source: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Lists all WordPressSite assignments for a specific Source.
 */
export async function getWordPressSitesForSource(
  workspaceId: string,
  sourceId: string,
  options?: { activeOnly?: boolean }
) {
  if (!workspaceId || !sourceId) {
    throw new Error("workspaceId e sourceId são obrigatórios.");
  }

  const where: {
    workspaceId: string;
    sourceId: string;
    active?: boolean;
  } = {
    workspaceId,
    sourceId,
  };

  if (options?.activeOnly) {
    where.active = true;
  }

  return await prisma.wordPressSiteSource.findMany({
    where,
    include: {
      wordpressSite: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
