-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "modifiedImageUrl" TEXT,
ADD COLUMN     "selectedImage" TEXT DEFAULT 'ORIGINAL';
