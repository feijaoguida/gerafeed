-- Phase 5: Auth, Workspace & Multi-tenant
-- Migração customizada com backfill para preservar dados existentes.

-- ===========================================================================
-- STEP 1: Criar tabelas novas (sem dependências das tabelas existentes ainda)
-- ===========================================================================

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable: User (NextAuth)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Account (NextAuth)
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable: Session (NextAuth)
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable: VerificationToken (NextAuth)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable: Workspace
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "asaasCustomerId" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkspaceUser
CREATE TABLE "WorkspaceUser" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceUser_pkey" PRIMARY KEY ("id")
);

-- ===========================================================================
-- STEP 2: Criar workspace padrão para backfill dos dados existentes
-- ===========================================================================

INSERT INTO "Workspace" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('default-workspace', 'Default', 'default', NOW(), NOW());

-- ===========================================================================
-- STEP 3: Adicionar workspaceId como NULLABLE nas tabelas de domínio
--         (necessário para backfill antes de tornar NOT NULL)
-- ===========================================================================

ALTER TABLE "Source" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Article" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Configuration" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "WordPressCategory" ADD COLUMN "workspaceId" TEXT;

-- ===========================================================================
-- STEP 4: Backfill — associar todos os registros existentes ao workspace padrão
-- ===========================================================================

UPDATE "Source" SET "workspaceId" = 'default-workspace' WHERE "workspaceId" IS NULL;
UPDATE "Article" SET "workspaceId" = 'default-workspace' WHERE "workspaceId" IS NULL;
UPDATE "Configuration" SET "workspaceId" = 'default-workspace' WHERE "workspaceId" IS NULL;
UPDATE "WordPressCategory" SET "workspaceId" = 'default-workspace' WHERE "workspaceId" IS NULL;

-- ===========================================================================
-- STEP 5: Tornar workspaceId NOT NULL após o backfill
-- ===========================================================================

ALTER TABLE "Source" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Article" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Configuration" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "WordPressCategory" ALTER COLUMN "workspaceId" SET NOT NULL;

-- ===========================================================================
-- STEP 6: Remover constraints/índices antigos incompatíveis com o novo schema
-- ===========================================================================

-- Configuration: a chave única era (key) global, agora é (workspaceId, key)
DROP INDEX "Configuration_key_key";

-- WordPressCategory: o índice era (wordpressId) global, agora é (workspaceId, wordpressId)
DROP INDEX "WordPressCategory_wordpressId_key";

-- ===========================================================================
-- STEP 7: Adicionar índices únicos novos
-- ===========================================================================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "WorkspaceUser_workspaceId_userId_key" ON "WorkspaceUser"("workspaceId", "userId");
CREATE UNIQUE INDEX "Configuration_workspaceId_key_key" ON "Configuration"("workspaceId", "key");
CREATE UNIQUE INDEX "WordPressCategory_workspaceId_wordpressId_key" ON "WordPressCategory"("workspaceId", "wordpressId");

-- ===========================================================================
-- STEP 8: Adicionar Foreign Keys
-- ===========================================================================

-- NextAuth FKs
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WorkspaceUser FKs
ALTER TABLE "WorkspaceUser" ADD CONSTRAINT "WorkspaceUser_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceUser" ADD CONSTRAINT "WorkspaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain table FKs
ALTER TABLE "Source" ADD CONSTRAINT "Source_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WordPressCategory" ADD CONSTRAINT "WordPressCategory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
