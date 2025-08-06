-- AlterTable
ALTER TABLE "public"."Department" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."Role" ADD COLUMN     "extension" TEXT,
ADD COLUMN     "is_coordinator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_supervisor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "room" TEXT,
ALTER COLUMN "priority" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "extension" TEXT,
ADD COLUMN     "hire_date" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "room" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Department" ADD CONSTRAINT "Department_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
