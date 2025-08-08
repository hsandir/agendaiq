/*
  Warnings:

  - The `status` column on the `meeting_action_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."ActionItemStatus" AS ENUM ('Pending', 'InProgress', 'Completed', 'Cancelled', 'Deferred', 'Overdue');

-- AlterEnum
ALTER TYPE "public"."AgendaItemStatus" ADD VALUE 'CarriedForward';

-- AlterTable
ALTER TABLE "public"."Meeting" ADD COLUMN     "is_series_master" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repeat_end_date" TIMESTAMP(3),
ADD COLUMN     "repeat_end_type" TEXT,
ADD COLUMN     "repeat_exceptions" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
ADD COLUMN     "repeat_interval" INTEGER,
ADD COLUMN     "repeat_month_day" INTEGER,
ADD COLUMN     "repeat_month_week" INTEGER,
ADD COLUMN     "repeat_month_weekday" INTEGER,
ADD COLUMN     "repeat_occurrences" INTEGER,
ADD COLUMN     "repeat_pattern" TEXT,
ADD COLUMN     "repeat_weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "series_id" TEXT,
ADD COLUMN     "series_position" INTEGER;

-- AlterTable
ALTER TABLE "public"."meeting_action_items" ADD COLUMN     "assigned_to_role" INTEGER,
ADD COLUMN     "carry_forward_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completed_by" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "parent_action_id" INTEGER,
ADD COLUMN     "priority" "public"."Priority" NOT NULL DEFAULT 'Medium',
DROP COLUMN "status",
ADD COLUMN     "status" "public"."ActionItemStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "public"."meeting_agenda_items" ADD COLUMN     "carried_forward" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "carry_forward_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_item_id" INTEGER,
ADD COLUMN     "responsible_role_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "theme_preference" TEXT DEFAULT 'classic-light';

-- CreateTable
CREATE TABLE "public"."meeting_transcripts" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "full_text" TEXT,
    "summary" TEXT,
    "key_points" TEXT[],
    "ai_summary" TEXT,
    "speakers" JSONB,
    "timestamps" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_search" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "search_text" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_transitions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "from_staff_id" INTEGER NOT NULL,
    "to_staff_id" INTEGER NOT NULL,
    "transition_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pending_tasks" JSONB,
    "transferred_items" JSONB,
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "role_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_transcripts_meeting_id_key" ON "public"."meeting_transcripts"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_transcripts_meeting_id_idx" ON "public"."meeting_transcripts"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_search_meeting_id_idx" ON "public"."meeting_search"("meeting_id");

-- CreateIndex
CREATE INDEX "role_transitions_role_id_idx" ON "public"."role_transitions"("role_id");

-- CreateIndex
CREATE INDEX "role_transitions_from_staff_id_idx" ON "public"."role_transitions"("from_staff_id");

-- CreateIndex
CREATE INDEX "role_transitions_to_staff_id_idx" ON "public"."role_transitions"("to_staff_id");

-- CreateIndex
CREATE INDEX "meeting_action_items_assigned_to_role_idx" ON "public"."meeting_action_items"("assigned_to_role");

-- CreateIndex
CREATE INDEX "meeting_action_items_status_idx" ON "public"."meeting_action_items"("status");

-- CreateIndex
CREATE INDEX "meeting_action_items_due_date_idx" ON "public"."meeting_action_items"("due_date");

-- CreateIndex
CREATE INDEX "meeting_agenda_items_responsible_role_id_idx" ON "public"."meeting_agenda_items"("responsible_role_id");

-- CreateIndex
CREATE INDEX "meeting_agenda_items_parent_item_id_idx" ON "public"."meeting_agenda_items"("parent_item_id");

-- AddForeignKey
ALTER TABLE "public"."meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_responsible_role_id_fkey" FOREIGN KEY ("responsible_role_id") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_parent_item_id_fkey" FOREIGN KEY ("parent_item_id") REFERENCES "public"."meeting_agenda_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_action_items" ADD CONSTRAINT "meeting_action_items_assigned_to_role_fkey" FOREIGN KEY ("assigned_to_role") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_action_items" ADD CONSTRAINT "meeting_action_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_action_items" ADD CONSTRAINT "meeting_action_items_parent_action_id_fkey" FOREIGN KEY ("parent_action_id") REFERENCES "public"."meeting_action_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_transcripts" ADD CONSTRAINT "meeting_transcripts_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_search" ADD CONSTRAINT "meeting_search_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_transitions" ADD CONSTRAINT "role_transitions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_transitions" ADD CONSTRAINT "role_transitions_from_staff_id_fkey" FOREIGN KEY ("from_staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_transitions" ADD CONSTRAINT "role_transitions_to_staff_id_fkey" FOREIGN KEY ("to_staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_transitions" ADD CONSTRAINT "role_transitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
