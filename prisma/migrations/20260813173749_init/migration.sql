-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('PENDING', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rssUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordPressCategory" (
    "id" TEXT NOT NULL,
    "wordpressId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "originalTitle" TEXT NOT NULL,
    "originalDescription" TEXT,
    "originalImageUrl" TEXT,
    "originalPublishedAt" TIMESTAMP(3),
    "title" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "suggestedCategoryId" TEXT,
    "categoryId" TEXT,
    "tags" TEXT[],
    "seoFocusKeyword" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "aiScore" DOUBLE PRECISION,
    "status" "ArticleStatus" NOT NULL DEFAULT 'PENDING',
    "wordpressPostId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordPressCategory_wordpressId_key" ON "WordPressCategory"("wordpressId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_originalUrl_key" ON "Article"("originalUrl");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "WordPressCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WordPressCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
