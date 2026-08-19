-- AlterTable
ALTER TABLE "Article" ADD COLUMN "wordpressSiteId" TEXT;

-- CreateIndex
CREATE INDEX "Article_workspaceId_idx" ON "Article"("workspaceId");

-- CreateIndex
CREATE INDEX "Article_sourceId_idx" ON "Article"("sourceId");

-- CreateIndex
CREATE INDEX "Article_wordpressSiteId_idx" ON "Article"("wordpressSiteId");

-- CreateIndex
CREATE INDEX "Article_originalPublishedAt_idx" ON "Article"("originalPublishedAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_wordpressSiteId_fkey" FOREIGN KEY ("wordpressSiteId") REFERENCES "WordPressSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
