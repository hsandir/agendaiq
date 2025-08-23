-- ========================================
-- SNAKE_CASE STANDARDIZATION - PHASE 1: RENAME TABLES
-- ========================================
-- Bu script PascalCase tabloları snake_case'e çevirir
-- Tarih: 2025-08-23
-- ========================================

-- Önce mevcut durumu logla
DO $$
BEGIN
    RAISE NOTICE 'Starting table rename migration...';
END $$;

-- 1. Account → account
ALTER TABLE IF EXISTS "Account" RENAME TO account;

-- 2. RoleHierarchy → role_hierarchy  
ALTER TABLE IF EXISTS "RoleHierarchy" RENAME TO role_hierarchy;

-- 3. Department → department
ALTER TABLE IF EXISTS "Department" RENAME TO department;

-- 4. Role → role
ALTER TABLE IF EXISTS "Role" RENAME TO role;

-- 5. Permission → permission
ALTER TABLE IF EXISTS "Permission" RENAME TO permission;

-- 6. Staff → staff
ALTER TABLE IF EXISTS "Staff" RENAME TO staff;

-- 7. MeetingAttendee → meeting_attendee
ALTER TABLE IF EXISTS "MeetingAttendee" RENAME TO meeting_attendee;

-- 8. SystemSetting → system_setting
ALTER TABLE IF EXISTS "SystemSetting" RENAME TO system_setting;

-- 9. Session → session
ALTER TABLE IF EXISTS "Session" RENAME TO session;

-- 10. VerificationToken → verification_token
ALTER TABLE IF EXISTS "VerificationToken" RENAME TO verification_token;

-- 11. District → district
ALTER TABLE IF EXISTS "District" RENAME TO district;

-- 12. School → school
ALTER TABLE IF EXISTS "School" RENAME TO school;

-- 13. Meeting → meeting
ALTER TABLE IF EXISTS "Meeting" RENAME TO meeting;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Table rename migration completed successfully!';
END $$;