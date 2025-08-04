-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE "Purpose" AS ENUM ('Information_Sharing', 'Discussion', 'Decision', 'Reminder');
CREATE TYPE "SolutionType" AS ENUM ('Technical', 'Adaptive', 'Both');
CREATE TYPE "DecisionType" AS ENUM ('Technical', 'Adaptive', 'Both');
CREATE TYPE "AgendaItemStatus" AS ENUM ('Ongoing', 'Resolved', 'Assigned_to_local', 'Pending', 'Deferred');

-- CreateTable
CREATE TABLE "meeting_agenda_items" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "problem_statement" TEXT,
    "staff_initials" TEXT,
    "responsible_staff_id" INTEGER,
    "priority" "Priority" NOT NULL DEFAULT 'Medium',
    "purpose" "Purpose" NOT NULL,
    "proposed_solution" TEXT,
    "solution_type" "SolutionType",
    "decisions_actions" TEXT,
    "decision_type" "DecisionType",
    "status" "AgendaItemStatus" NOT NULL DEFAULT 'Pending',
    "future_implications" BOOLEAN DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_item_attachments" (
    "id" SERIAL NOT NULL,
    "agenda_item_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_item_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_item_comments" (
    "id" SERIAL NOT NULL,
    "agenda_item_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_item_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_action_items" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "agenda_item_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_agenda_items_meeting_id_idx" ON "meeting_agenda_items"("meeting_id");
CREATE INDEX "meeting_agenda_items_responsible_staff_id_idx" ON "meeting_agenda_items"("responsible_staff_id");
CREATE INDEX "agenda_item_attachments_agenda_item_id_idx" ON "agenda_item_attachments"("agenda_item_id");
CREATE INDEX "agenda_item_comments_agenda_item_id_idx" ON "agenda_item_comments"("agenda_item_id");
CREATE INDEX "meeting_action_items_meeting_id_idx" ON "meeting_action_items"("meeting_id");
CREATE INDEX "meeting_action_items_assigned_to_idx" ON "meeting_action_items"("assigned_to");

-- AddForeignKey
ALTER TABLE "meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_responsible_staff_id_fkey" FOREIGN KEY ("responsible_staff_id") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_agenda_item_id_fkey" FOREIGN KEY ("agenda_item_id") REFERENCES "meeting_agenda_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_item_comments" ADD CONSTRAINT "agenda_item_comments_agenda_item_id_fkey" FOREIGN KEY ("agenda_item_id") REFERENCES "meeting_agenda_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agenda_item_comments" ADD CONSTRAINT "agenda_item_comments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_agenda_item_id_fkey" FOREIGN KEY ("agenda_item_id") REFERENCES "meeting_agenda_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;