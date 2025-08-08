/*
  Warnings:

  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoginHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeetingAuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeetingNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ZoomIntegration` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_user_id_fkey";

-- DropForeignKey
ALTER TABLE "LoginHistory" DROP CONSTRAINT "LoginHistory_user_id_fkey";

-- DropForeignKey
ALTER TABLE "MeetingAuditLog" DROP CONSTRAINT "MeetingAuditLog_meeting_id_fkey";

-- DropForeignKey
ALTER TABLE "MeetingAuditLog" DROP CONSTRAINT "MeetingAuditLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "MeetingNote" DROP CONSTRAINT "MeetingNote_meeting_id_fkey";

-- DropForeignKey
ALTER TABLE "MeetingNote" DROP CONSTRAINT "MeetingNote_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_department_id_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserSetting" DROP CONSTRAINT "UserSetting_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ZoomIntegration" DROP CONSTRAINT "ZoomIntegration_district_id_fkey";

-- DropForeignKey
ALTER TABLE "ZoomIntegration" DROP CONSTRAINT "ZoomIntegration_school_id_fkey";

-- DropForeignKey
ALTER TABLE "ZoomIntegration" DROP CONSTRAINT "ZoomIntegration_user_id_fkey";

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "template_id" INTEGER;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "is_leadership" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" INTEGER,
ALTER COLUMN "department_id" DROP NOT NULL;

-- DropTable
DROP TABLE "Device";

-- DropTable
DROP TABLE "LoginHistory";

-- DropTable
DROP TABLE "MeetingAuditLog";

-- DropTable
DROP TABLE "MeetingNote";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserSetting";

-- DropTable
DROP TABLE "ZoomIntegration";

-- CreateTable
CREATE TABLE "meeting_notes" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "field_changes" JSONB,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" INTEGER,
    "staff_id" INTEGER,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleHierarchy" (
    "id" SERIAL NOT NULL,
    "parent_role_id" INTEGER NOT NULL,
    "child_role_id" INTEGER NOT NULL,
    "hierarchy_level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "agenda" TEXT,
    "attendees" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "staff_id" TEXT,
    "hashedPassword" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "backup_codes" TEXT[],
    "login_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "suspicious_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "remember_devices_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_table_name_created_at_idx" ON "audit_logs"("table_name", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_operation_created_at_idx" ON "audit_logs"("operation", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "RoleHierarchy_parent_role_id_child_role_id_key" ON "RoleHierarchy"("parent_role_id", "child_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_staff_id_key" ON "users"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_title_key" ON "Role"("title");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "meeting_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleHierarchy" ADD CONSTRAINT "RoleHierarchy_child_role_id_fkey" FOREIGN KEY ("child_role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleHierarchy" ADD CONSTRAINT "RoleHierarchy_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_templates" ADD CONSTRAINT "meeting_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
