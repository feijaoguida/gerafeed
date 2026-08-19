-- AlterTable
ALTER TABLE "Source" ADD COLUMN "defaultPromptType" TEXT;

-- CreateTable
CREATE TABLE "WordPressSiteSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "wordpressSiteId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "promptTypeOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressSiteSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordPressSiteSource_wordpressSiteId_sourceId_key" ON "WordPressSiteSource"("wordpressSiteId", "sourceId");

-- CreateIndex
CREATE INDEX "WordPressSiteSource_workspaceId_idx" ON "WordPressSiteSource"("workspaceId");

-- CreateIndex
CREATE INDEX "WordPressSiteSource_wordpressSiteId_idx" ON "WordPressSiteSource"("wordpressSiteId");

-- CreateIndex
CREATE INDEX "WordPressSiteSource_sourceId_idx" ON "WordPressSiteSource"("sourceId");

-- AddForeignKey
ALTER TABLE "WordPressSiteSource" ADD CONSTRAINT "WordPressSiteSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressSiteSource" ADD CONSTRAINT "WordPressSiteSource_wordpressSiteId_fkey" FOREIGN KEY ("wordpressSiteId") REFERENCES "WordPressSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressSiteSource" ADD CONSTRAINT "WordPressSiteSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
