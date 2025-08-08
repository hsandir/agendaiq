/*
  Warnings:

  - You are about to drop the column `uploaded_at` on the `agenda_item_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_by` on the `agenda_item_attachments` table. All the data in the column will be lost.
  - Added the required column `content_type` to the `agenda_item_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `agenda_item_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaded_by_id` to the `agenda_item_attachments` table without a default value. This is not possible if the table is not empty.
  - Made the column `file_size` on table `agenda_item_attachments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."agenda_item_attachments" DROP CONSTRAINT "agenda_item_attachments_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "public"."agenda_item_attachments" DROP COLUMN "uploaded_at",
DROP COLUMN "uploaded_by",
ADD COLUMN     "content_type" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploaded_by_id" INTEGER NOT NULL,
ALTER COLUMN "file_size" SET NOT NULL;

-- CreateIndex
CREATE INDEX "agenda_item_attachments_uploaded_by_id_idx" ON "public"."agenda_item_attachments"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "public"."agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
