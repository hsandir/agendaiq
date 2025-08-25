-- Migrate backup data from PascalCase to snake_case format
-- This script transforms the backup data to match current database schema

-- Insert users with field name transformation
INSERT INTO users (
    id, 
    email, 
    name, 
    staff_id, 
    hashed_password,          -- was hashedPassword
    email_verified,           -- was emailVerified  
    image, 
    is_admin, 
    is_system_admin, 
    is_school_admin, 
    two_factor_enabled, 
    two_factor_secret, 
    backup_codes, 
    login_notifications_enabled, 
    suspicious_alerts_enabled, 
    remember_devices_enabled, 
    created_at, 
    updated_at, 
    theme_preference, 
    layout_preference, 
    custom_theme
) VALUES
-- cjcollegeprep users from backup
(10, 'tsalley@cjcollegeprep.org', 'Ms. Salley', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(11, 'cthomas@cjcollegeprep.org', 'Ms. Thomas', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(13, 'purchasing@cjcollegeprep.org', 'Ms. Ramos', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(12, 'lmignogno@cjcollegeprep.org', 'Ms. Mignogno', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(14, 'mfirsichbaum@cjcollegeprep.org', 'Ms. Firsichbaum', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(15, 'cmathews@cjcollegeprep.org', 'Dr. Mathews', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(16, 'braybon@cjcollegeprep.org', 'Ms. Raybon', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(17, 'manar@cjcollegeprep.org', 'Mr. Anar', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(18, 'hr@cjcollegeprep.org', 'Ms. Goldstein', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL),
(19, 'bgrossmann@cjcollegeprep.org', 'Ms. Grossmann', NULL, '$2b$12$gjKyWbUmBt7gqVj9kjPQIOPl28U2SMqkD/1nOiysk4UMUcZ0U5DGO', NULL, NULL, false, false, false, false, NULL, '{}', true, true, true, '2025-08-09 05:15:59.22', '2025-08-10 22:18:16.611', 'standard', 'modern', NULL);

-- Update sequence to continue from highest ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1);