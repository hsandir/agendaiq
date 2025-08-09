-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "layout_preference" TEXT DEFAULT 'modern',
ALTER COLUMN "theme_preference" SET DEFAULT 'standard';
