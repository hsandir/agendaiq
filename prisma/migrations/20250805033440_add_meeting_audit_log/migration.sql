-- CreateTable
CREATE TABLE "public"."meeting_audit_logs" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "staff_id" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_audit_logs_meeting_id_idx" ON "public"."meeting_audit_logs"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_audit_logs_user_id_idx" ON "public"."meeting_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "meeting_audit_logs_created_at_idx" ON "public"."meeting_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "public"."meeting_audit_logs" ADD CONSTRAINT "meeting_audit_logs_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_audit_logs" ADD CONSTRAINT "meeting_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_audit_logs" ADD CONSTRAINT "meeting_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
