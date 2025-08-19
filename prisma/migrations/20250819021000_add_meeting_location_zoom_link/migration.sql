-- Add missing columns referenced by Prisma schema and API
-- Safe for repeated runs via IF NOT EXISTS

ALTER TABLE "Meeting"
  ADD COLUMN IF NOT EXISTS "location" TEXT;

ALTER TABLE "Meeting"
  ADD COLUMN IF NOT EXISTS "zoom_link" TEXT;

