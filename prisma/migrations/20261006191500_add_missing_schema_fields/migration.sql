-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- AlterTable Workspace
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "website" TEXT;

-- AlterTable Article
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "generatedImageUrl" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "imagePrompt" TEXT;

-- CreateTable SystemErrorLog
CREATE TABLE IF NOT EXISTS "SystemErrorLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "screen" TEXT,
    "path" TEXT NOT NULL,
    "method" TEXT DEFAULT 'GET',
    "query" JSONB,
    "module" TEXT NOT NULL DEFAULT 'GENERAL',
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "statusCode" INTEGER DEFAULT 500,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable SystemSetting
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- Indexes for SystemErrorLog
CREATE INDEX IF NOT EXISTS "SystemErrorLog_workspaceId_idx" ON "SystemErrorLog"("workspaceId");
CREATE INDEX IF NOT EXISTS "SystemErrorLog_module_idx" ON "SystemErrorLog"("module");
CREATE INDEX IF NOT EXISTS "SystemErrorLog_createdAt_idx" ON "SystemErrorLog"("createdAt");
CREATE INDEX IF NOT EXISTS "SystemErrorLog_userId_idx" ON "SystemErrorLog"("userId");

-- Unique index for SystemSetting
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SystemErrorLog_workspaceId_fkey'
  ) THEN
    ALTER TABLE "SystemErrorLog" ADD CONSTRAINT "SystemErrorLog_workspaceId_fkey" 
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
