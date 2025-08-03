/*
  Warnings:

  - The primary key for the `Device` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `Device` table. All the data in the column will be lost.
  - The `id` column on the `Device` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `District` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `city` on the `District` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `District` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `District` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `District` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `District` table. All the data in the column will be lost.
  - The `id` column on the `District` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `LoginHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `LoginHistory` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `LoginHistory` table. All the data in the column will be lost.
  - The `id` column on the `LoginHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Meeting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `organizerId` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `visibleToRoles` on the `Meeting` table. All the data in the column will be lost.
  - The `id` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MeetingAttendee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `MeetingAttendee` table. All the data in the column will be lost.
  - You are about to drop the column `meetingId` on the `MeetingAttendee` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MeetingAttendee` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `MeetingAttendee` table. All the data in the column will be lost.
  - The `id` column on the `MeetingAttendee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `School` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `city` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `departments` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `districtId` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `School` table. All the data in the column will be lost.
  - The `id` column on the `School` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `rememberMe` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `trustDevice` on the `Session` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Campus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleHierarchy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_NoteToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RoleHierarchy` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `District` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staff_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `userId` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `user_id` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `LoginHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizer_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meeting_id` to the `MeetingAttendee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staff_id` to the `MeetingAttendee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district_id` to the `School` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `userId` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Campus" DROP CONSTRAINT "Campus_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_noteId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoginHistory" DROP CONSTRAINT "LoginHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_organizerId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingAttendee" DROP CONSTRAINT "MeetingAttendee_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingAttendee" DROP CONSTRAINT "MeetingAttendee_userId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_managerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "_NoteToTag" DROP CONSTRAINT "_NoteToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_NoteToTag" DROP CONSTRAINT "_NoteToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_RoleHierarchy" DROP CONSTRAINT "_RoleHierarchy_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoleHierarchy" DROP CONSTRAINT "_RoleHierarchy_B_fkey";

-- DropIndex
DROP INDEX "District_name_key";

-- DropIndex
DROP INDEX "Meeting_department_idx";

-- DropIndex
DROP INDEX "MeetingAttendee_userId_meetingId_key";

-- DropIndex
DROP INDEX "School_name_districtId_key";

-- DropIndex
DROP INDEX "User_department_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- DropIndex
DROP INDEX "User_schoolId_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Device" DROP CONSTRAINT "Device_pkey",
DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Device_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "District" DROP CONSTRAINT "District_pkey",
DROP COLUMN "city",
DROP COLUMN "createdAt",
DROP COLUMN "state",
DROP COLUMN "updatedAt",
DROP COLUMN "zipCode",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "District_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "LoginHistory" DROP CONSTRAINT "LoginHistory_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "department",
DROP COLUMN "endTime",
DROP COLUMN "organizerId",
DROP COLUMN "startTime",
DROP COLUMN "updatedAt",
DROP COLUMN "visibleToRoles",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department_id" INTEGER NOT NULL,
ADD COLUMN     "district_id" INTEGER NOT NULL,
ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "organizer_id" INTEGER NOT NULL,
ADD COLUMN     "school_id" INTEGER NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3),
ADD COLUMN     "zoom_join_url" TEXT,
ADD COLUMN     "zoom_meeting_id" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MeetingAttendee" DROP CONSTRAINT "MeetingAttendee_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "meetingId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "meeting_id" INTEGER NOT NULL,
ADD COLUMN     "staff_id" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ADD CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "School" DROP CONSTRAINT "School_pkey",
DROP COLUMN "city",
DROP COLUMN "createdAt",
DROP COLUMN "departments",
DROP COLUMN "districtId",
DROP COLUMN "logo",
DROP COLUMN "phone",
DROP COLUMN "state",
DROP COLUMN "updatedAt",
DROP COLUMN "website",
DROP COLUMN "zipCode",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "district_id" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "School_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "rememberMe",
DROP COLUMN "trustDevice",
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "department",
DROP COLUMN "managerId",
DROP COLUMN "role",
DROP COLUMN "schoolId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "staff_id" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Campus";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Note";

-- DropTable
DROP TABLE "RoleHierarchy";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_NoteToTag";

-- DropTable
DROP TABLE "_RoleHierarchy";

-- DropEnum
DROP TYPE "Department";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "SchoolType";

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "school_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "category" TEXT,
    "department_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "manager_id" INTEGER,
    "flags" TEXT[],
    "endorsements" TEXT[],
    "school_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "user_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("user_id","key")
);

-- CreateTable
CREATE TABLE "ZoomIntegration" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "school_id" INTEGER,
    "district_id" INTEGER,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "zoom_email" TEXT,
    "is_org_level" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZoomIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAuditLog" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "District"("code");

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_staff_id_key" ON "User"("staff_id");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomIntegration" ADD CONSTRAINT "ZoomIntegration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomIntegration" ADD CONSTRAINT "ZoomIntegration_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoomIntegration" ADD CONSTRAINT "ZoomIntegration_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAuditLog" ADD CONSTRAINT "MeetingAuditLog_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAuditLog" ADD CONSTRAINT "MeetingAuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
