-- ========================================
-- SNAKE_CASE STANDARDIZATION - ROLLBACK SCRIPT
-- ========================================
-- EMERGENCY: Bu script değişiklikleri geri alır
-- Tarih: 2025-08-23
-- ========================================

-- ROLLBACK WARNING
DO $$
BEGIN
    RAISE WARNING 'STARTING ROLLBACK - This will revert all snake_case changes!';
END $$;

-- ========================================
-- PHASE 1: Kolonları eski haline getir
-- ========================================

-- 1. account → Account tablosu kolonları
ALTER TABLE account RENAME COLUMN provider_account_id TO "providerAccountId";
ALTER TABLE account RENAME COLUMN user_id TO "userId";

-- 2. session → Session tablosu kolonları  
ALTER TABLE session RENAME COLUMN session_token TO "sessionToken";
ALTER TABLE session RENAME COLUMN user_id TO "userId";

-- 3. users tablosu kolonları
ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE users RENAME COLUMN hashed_password TO "hashedPassword";

-- ========================================
-- PHASE 2: Tabloları eski haline getir
-- ========================================

-- 1. account → Account
ALTER TABLE IF EXISTS account RENAME TO "Account";

-- 2. role_hierarchy → RoleHierarchy
ALTER TABLE IF EXISTS role_hierarchy RENAME TO "RoleHierarchy";

-- 3. department → Department
ALTER TABLE IF EXISTS department RENAME TO "Department";

-- 4. role → Role
ALTER TABLE IF EXISTS role RENAME TO "Role";

-- 5. permission → Permission
ALTER TABLE IF EXISTS permission RENAME TO "Permission";

-- 6. staff → Staff
ALTER TABLE IF EXISTS staff RENAME TO "Staff";

-- 7. meeting_attendee → MeetingAttendee
ALTER TABLE IF EXISTS meeting_attendee RENAME TO "MeetingAttendee";

-- 8. system_setting → SystemSetting
ALTER TABLE IF EXISTS system_setting RENAME TO "SystemSetting";

-- 9. session → Session
ALTER TABLE IF EXISTS session RENAME TO "Session";

-- 10. verification_token → VerificationToken
ALTER TABLE IF EXISTS verification_token RENAME TO "VerificationToken";

-- 11. district → District
ALTER TABLE IF EXISTS district RENAME TO "District";

-- 12. school → School
ALTER TABLE IF EXISTS school RENAME TO "School";

-- 13. meeting → Meeting
ALTER TABLE IF EXISTS meeting RENAME TO "Meeting";

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'ROLLBACK completed - Database reverted to original state';
END $$;