-- CreateTable
CREATE TABLE "WordPressSite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedApplicationPassword" TEXT NOT NULL,
    "defaultPromptType" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressSite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordPressSite_workspaceId_name_key" ON "WordPressSite"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "WordPressSite_workspaceId_idx" ON "WordPressSite"("workspaceId");

-- AddForeignKey
ALTER TABLE "WordPressSite" ADD CONSTRAINT "WordPressSite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
