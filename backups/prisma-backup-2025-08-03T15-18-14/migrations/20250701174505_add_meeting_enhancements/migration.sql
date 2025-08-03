-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "action_items" TEXT,
ADD COLUMN     "agenda" TEXT,
ADD COLUMN     "calendar_integration" TEXT,
ADD COLUMN     "decisions" TEXT,
ADD COLUMN     "is_continuation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meeting_type" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "parent_meeting_id" INTEGER,
ADD COLUMN     "repeat_type" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_parent_meeting_id_fkey" FOREIGN KEY ("parent_meeting_id") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
