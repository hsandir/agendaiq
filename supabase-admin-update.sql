-- ========================================
-- SUPABASE ADMIN ROLE UPDATE SCRIPT
-- ========================================
-- Run this script in Supabase SQL Editor
-- Date: 2025-08-10
-- ========================================

-- 1. Update System Administrator role with OPS_ADMIN key
UPDATE "Role" 
SET 
  key = 'OPS_ADMIN', 
  priority = 1, 
  is_leadership = true,
  is_supervisor = true
WHERE title = 'System Administrator';

-- 2. Create Development Admin role if not exists
INSERT INTO "Role" (key, title, priority, is_leadership, is_supervisor, category)
VALUES ('DEV_ADMIN', 'Development Admin', 0, true, true, 'ADMIN')
ON CONFLICT (title) DO UPDATE 
SET 
  key = 'DEV_ADMIN',
  priority = 0, 
  is_leadership = true,
  is_supervisor = true,
  category = 'ADMIN';

-- 3. Update admin@school.edu user flags
UPDATE users 
SET 
  is_system_admin = true, 
  is_school_admin = false, 
  name = 'Development Admin'
WHERE email = 'admin@school.edu';

-- 4. Update sysadmin@cjcollegeprep.org user flags
UPDATE users 
SET 
  is_system_admin = false, 
  is_school_admin = true, 
  name = 'School System Administrator'
WHERE email = 'sysadmin@cjcollegeprep.org';

-- 5. Get role IDs for staff updates
DO $$
DECLARE
  dev_admin_role_id INTEGER;
  ops_admin_role_id INTEGER;
  admin_user_id INTEGER;
  sysadmin_user_id INTEGER;
BEGIN
  -- Get role IDs
  SELECT id INTO dev_admin_role_id FROM "Role" WHERE key = 'DEV_ADMIN';
  SELECT id INTO ops_admin_role_id FROM "Role" WHERE key = 'OPS_ADMIN';
  
  -- Get user IDs
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@school.edu';
  SELECT id INTO sysadmin_user_id FROM users WHERE email = 'sysadmin@cjcollegeprep.org';
  
  -- Update admin@school.edu staff record
  IF admin_user_id IS NOT NULL AND dev_admin_role_id IS NOT NULL THEN
    UPDATE "Staff" 
    SET 
      role_id = dev_admin_role_id,
      first_name = 'Development',
      last_name = 'Admin'
    WHERE user_id = admin_user_id;
    
    -- If no staff record exists, create one
    IF NOT FOUND THEN
      INSERT INTO "Staff" (
        first_name, 
        last_name, 
        email, 
        user_id, 
        role_id, 
        department_id, 
        school_id, 
        district_id, 
        enrollment_date, 
        is_active
      )
      SELECT 
        'Development',
        'Admin',
        'admin@school.edu',
        admin_user_id,
        dev_admin_role_id,
        (SELECT id FROM "Department" LIMIT 1),
        (SELECT id FROM "School" LIMIT 1),
        (SELECT id FROM "District" LIMIT 1),
        NOW(),
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM "Staff" WHERE user_id = admin_user_id
      );
    END IF;
  END IF;
  
  -- Update sysadmin@cjcollegeprep.org staff record
  IF sysadmin_user_id IS NOT NULL AND ops_admin_role_id IS NOT NULL THEN
    UPDATE "Staff" 
    SET 
      role_id = ops_admin_role_id,
      first_name = 'System',
      last_name = 'Administrator'
    WHERE user_id = sysadmin_user_id;
    
    -- If no staff record exists, create one
    IF NOT FOUND THEN
      INSERT INTO "Staff" (
        first_name, 
        last_name, 
        email, 
        user_id, 
        role_id, 
        department_id, 
        school_id, 
        district_id, 
        enrollment_date, 
        is_active
      )
      SELECT 
        'System',
        'Administrator',
        'sysadmin@cjcollegeprep.org',
        sysadmin_user_id,
        ops_admin_role_id,
        (SELECT id FROM "Department" LIMIT 1),
        (SELECT id FROM "School" LIMIT 1),
        (SELECT id FROM "District" LIMIT 1),
        NOW(),
        true
      WHERE NOT EXISTS (
        SELECT 1 FROM "Staff" WHERE user_id = sysadmin_user_id
      );
    END IF;
  END IF;
END $$;

-- 6. Verify the changes
SELECT 
  u.email,
  u.name,
  u.is_system_admin,
  u.is_school_admin,
  r.title as role_title,
  r.key as role_key,
  r.priority
FROM users u
LEFT JOIN "Staff" s ON u.id = s.user_id
LEFT JOIN "Role" r ON s.role_id = r.id
WHERE u.email IN ('admin@school.edu', 'sysadmin@cjcollegeprep.org');

-- 7. Show all roles with keys
SELECT 
  key, 
  title, 
  priority, 
  is_leadership,
  category
FROM "Role" 
WHERE key IS NOT NULL 
ORDER BY priority;

-- ========================================
-- Expected Results:
-- 
-- admin@school.edu:
--   - Role: Development Admin
--   - Role Key: DEV_ADMIN
--   - System Admin: TRUE
--   - School Admin: FALSE
--   - Priority: 0
--
-- sysadmin@cjcollegeprep.org:
--   - Role: System Administrator
--   - Role Key: OPS_ADMIN
--   - System Admin: FALSE
--   - School Admin: TRUE
--   - Priority: 1
-- ========================================