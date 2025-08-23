-- AgendaIQ Migration Verification Script
-- Run this after applying the migration to verify all changes

-- 1. Check MeetingAttendee columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'MeetingAttendee' 
AND column_name = 'attended';

-- 2. Check users admin columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_system_admin', 'is_school_admin');

-- 3. Check Meeting location columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Meeting' 
AND column_name IN ('location', 'zoom_link');

-- 4. Check Role key column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Role' 
AND column_name = 'key';

-- 5. Check Role key index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Role' 
AND indexname = 'Role_key_key';

-- 6. Check Teams tables existence
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'team_members', 'team_knowledge')
ORDER BY table_name;

-- 7. Check Teams table columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'teams'
ORDER BY ordinal_position
LIMIT 10;

-- 8. Verify Role keys are set
SELECT 
    id,
    title,
    key,
    label
FROM "Role"
WHERE key IS NOT NULL
ORDER BY id;

-- 9. Count records in new tables
SELECT 
    'teams' as table_name, 
    COUNT(*) as record_count 
FROM teams
UNION ALL
SELECT 
    'team_members', 
    COUNT(*) 
FROM team_members
UNION ALL
SELECT 
    'team_knowledge', 
    COUNT(*) 
FROM team_knowledge;

-- 10. Summary of all missing columns that should now exist
SELECT 
    'Migration Status Summary' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MeetingAttendee' AND column_name = 'attended')
        THEN '✓ attended column exists'
        ELSE '✗ attended column missing'
    END as status
UNION ALL
SELECT 
    'User admin flags',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_system_admin')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_school_admin')
        THEN '✓ admin columns exist'
        ELSE '✗ admin columns missing'
    END
UNION ALL
SELECT 
    'Meeting location fields',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Meeting' AND column_name = 'location')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Meeting' AND column_name = 'zoom_link')
        THEN '✓ location columns exist'
        ELSE '✗ location columns missing'
    END
UNION ALL
SELECT 
    'Role key column',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Role' AND column_name = 'key')
        THEN '✓ key column exists'
        ELSE '✗ key column missing'
    END
UNION ALL
SELECT 
    'Teams tables',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_knowledge')
        THEN '✓ all teams tables exist'
        ELSE '✗ teams tables missing'
    END;