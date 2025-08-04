-- CreateEnum
CREATE TYPE "public"."AuditCategory" AS ENUM ('AUTH', 'SECURITY', 'DATA_CRITICAL', 'PERMISSION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "public"."Purpose" AS ENUM ('Information_Sharing', 'Discussion', 'Decision', 'Reminder');

-- CreateEnum
CREATE TYPE "public"."SolutionType" AS ENUM ('Technical', 'Adaptive', 'Both');

-- CreateEnum
CREATE TYPE "public"."DecisionType" AS ENUM ('Technical', 'Adaptive', 'Both');

-- CreateEnum
CREATE TYPE "public"."AgendaItemStatus" AS ENUM ('Ongoing', 'Resolved', 'Assigned_to_local', 'Pending', 'Deferred');

-- CreateTable
CREATE TABLE "public"."critical_audit_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "public"."AuditCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" INTEGER,
    "staff_id" INTEGER,
    "target_user_id" INTEGER,
    "target_staff_id" INTEGER,
    "ip_address" TEXT,
    "session_id" TEXT,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "critical_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_os" TEXT,
    "browser" TEXT,
    "ip_address" TEXT,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_agenda_items" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "problem_statement" TEXT,
    "staff_initials" TEXT,
    "responsible_staff_id" INTEGER,
    "priority" "public"."Priority" NOT NULL DEFAULT 'Medium',
    "purpose" "public"."Purpose" NOT NULL,
    "proposed_solution" TEXT,
    "solution_type" "public"."SolutionType",
    "decisions_actions" TEXT,
    "decision_type" "public"."DecisionType",
    "status" "public"."AgendaItemStatus" NOT NULL DEFAULT 'Pending',
    "future_implications" BOOLEAN DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agenda_item_attachments" (
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
CREATE TABLE "public"."agenda_item_comments" (
    "id" SERIAL NOT NULL,
    "agenda_item_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_item_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_action_items" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "critical_audit_logs_category_timestamp_idx" ON "public"."critical_audit_logs"("category", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_user_id_timestamp_idx" ON "public"."critical_audit_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_risk_score_timestamp_idx" ON "public"."critical_audit_logs"("risk_score", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_ip_address_timestamp_idx" ON "public"."critical_audit_logs"("ip_address", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_category_risk_score_timestamp_idx" ON "public"."critical_audit_logs"("category", "risk_score", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_user_id_staff_id_timestamp_idx" ON "public"."critical_audit_logs"("user_id", "staff_id", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_category_user_id_timestamp_idx" ON "public"."critical_audit_logs"("category", "user_id", "timestamp");

-- CreateIndex
CREATE INDEX "critical_audit_logs_success_risk_score_timestamp_idx" ON "public"."critical_audit_logs"("success", "risk_score", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_id_key" ON "public"."devices"("device_id");

-- CreateIndex
CREATE INDEX "devices_user_id_idx" ON "public"."devices"("user_id");

-- CreateIndex
CREATE INDEX "meeting_agenda_items_meeting_id_idx" ON "public"."meeting_agenda_items"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_agenda_items_responsible_staff_id_idx" ON "public"."meeting_agenda_items"("responsible_staff_id");

-- CreateIndex
CREATE INDEX "agenda_item_attachments_agenda_item_id_idx" ON "public"."agenda_item_attachments"("agenda_item_id");

-- CreateIndex
CREATE INDEX "agenda_item_comments_agenda_item_id_idx" ON "public"."agenda_item_comments"("agenda_item_id");

-- CreateIndex
CREATE INDEX "meeting_action_items_meeting_id_idx" ON "public"."meeting_action_items"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_action_items_assigned_to_idx" ON "public"."meeting_action_items"("assigned_to");

-- AddForeignKey
ALTER TABLE "public"."critical_audit_logs" ADD CONSTRAINT "critical_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."critical_audit_logs" ADD CONSTRAINT "critical_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."critical_audit_logs" ADD CONSTRAINT "critical_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."critical_audit_logs" ADD CONSTRAINT "critical_audit_logs_target_staff_id_fkey" FOREIGN KEY ("target_staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_responsible_staff_id_fkey" FOREIGN KEY ("responsible_staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_agenda_item_id_fkey" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."meeting_agenda_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agenda_item_attachments" ADD CONSTRAINT "agenda_item_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agenda_item_comments" ADD CONSTRAINT "agenda_item_comments_agenda_item_id_fkey" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."meeting_agenda_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agenda_item_comments" ADD CONSTRAINT "agenda_item_comments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_action_items" ADD CONSTRAINT "meeting_action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_action_items" ADD CONSTRAINT "meeting_action_items_agenda_item_id_fkey" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."meeting_agenda_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_action_items" ADD CONSTRAINT "meeting_action_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
