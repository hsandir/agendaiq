-- Add attended column to MeetingAttendee
ALTER TABLE "MeetingAttendee" 
ADD COLUMN IF NOT EXISTS "attended" BOOLEAN DEFAULT false;

-- Add admin flags to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "is_system_admin" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_school_admin" BOOLEAN DEFAULT false;

-- Add location and zoom_link to Meeting table
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "zoom_link" TEXT;

-- Add key column to Role table
ALTER TABLE "Role"
ADD COLUMN IF NOT EXISTS "key" TEXT;

-- Create unique index on Role.key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'Role' 
    AND indexname = 'Role_key_key'
  ) THEN
    CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
  END IF;
END $$;