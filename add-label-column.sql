-- Add missing label column to Role table
ALTER TABLE "Role"
ADD COLUMN IF NOT EXISTS "label" TEXT;

-- Update existing roles with label values
UPDATE "Role" SET "label" = 'Developer Admin' WHERE "title" = 'Developer Admin' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Operations Admin' WHERE "title" = 'Operations Admin' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Principal' WHERE "title" = 'Principal' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Vice Principal' WHERE "title" = 'Vice Principal' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Dean' WHERE "title" = 'Dean' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Coordinator' WHERE "title" = 'Coordinator' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Teacher' WHERE "title" = 'Teacher' AND "label" IS NULL;
UPDATE "Role" SET "label" = 'Staff' WHERE "title" = 'Staff' AND "label" IS NULL;