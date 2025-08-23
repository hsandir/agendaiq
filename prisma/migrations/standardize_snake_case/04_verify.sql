-- ========================================
-- SNAKE_CASE STANDARDIZATION - VERIFICATION SCRIPT
-- ========================================
-- Bu script migration'ın başarılı olup olmadığını kontrol eder
-- Tarih: 2025-08-23
-- ========================================

-- 1. PascalCase tablo kontrolü (Boş dönmeli)
SELECT 'PascalCase Tables (Should be 0):' as check_type, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ~ '[A-Z]'
AND table_name NOT LIKE '_prisma%';

-- 2. CamelCase kolon kontrolü (Boş dönmeli)
SELECT 'CamelCase Columns (Should be 0):' as check_type, COUNT(*) as count
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name ~ '[A-Z]'
AND table_name NOT LIKE '_prisma%';

-- 3. Beklenen tabloların varlık kontrolü
SELECT 'Expected Tables Check:' as check_type;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'account', 'role_hierarchy', 'department', 'role', 'permission',
            'staff', 'meeting_attendee', 'system_setting', 'session',
            'verification_token', 'district', 'school', 'meeting',
            'users', 'meeting_notes', 'critical_audit_logs', 'audit_logs',
            'meeting_templates', 'devices', 'meeting_agenda_items',
            'agenda_item_attachments', 'agenda_item_comments',
            'meeting_audit_logs', 'meeting_action_items', 'meeting_transcripts',
            'meeting_search', 'role_transitions', 'dev_logs', 'security_logs',
            'teams', 'team_members', 'team_knowledge'
        ) THEN '✓ OK'
        ELSE '✗ UNEXPECTED'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name NOT LIKE '_prisma%'
ORDER BY 
    CASE WHEN table_name ~ '[A-Z]' THEN 0 ELSE 1 END,
    table_name;

-- 4. Foreign Key kontrolü (FK'ler hala çalışıyor mu?)
SELECT 'Foreign Key Constraints:' as check_type, COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

-- 5. Index kontrolü
SELECT 'Indexes:' as check_type, COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public';

-- 6. Veri sayısı kontrolü (Veri kaybı var mı?)
SELECT 'Data Integrity Check:' as check_type;

SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'meeting' as table_name, COUNT(*) as row_count FROM meeting
UNION ALL
SELECT 
    'staff' as table_name, COUNT(*) as row_count FROM staff
UNION ALL
SELECT 
    'department' as table_name, COUNT(*) as row_count FROM department
UNION ALL
SELECT 
    'teams' as table_name, COUNT(*) as row_count FROM teams;