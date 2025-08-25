-- Create placeholder roles for staff import
-- This creates basic roles with the IDs needed for staff data

INSERT INTO role (id, title, key, priority, category, department_id, level) VALUES
(3, 'Staff Member', 'staff', 3, 'General', 2, 3),
(4, 'System Admin', 'sysadmin', 1, 'Administration', 2, 1),
(6, 'Manager', 'manager', 2, 'Administration', 2, 2),
(7, 'Coordinator', 'coordinator', 2, 'Administration', 2, 2),
(8, 'Director', 'director', 1, 'Administration', 2, 1),
(9, 'Supervisor', 'supervisor', 2, 'Administration', 2, 2),
(10, 'Specialist', 'specialist', 3, 'General', 2, 3),
(11, 'Assistant', 'assistant', 3, 'General', 2, 3),
(12, 'Teacher', 'teacher', 3, 'Academic', 2, 3)
ON CONFLICT (id) DO NOTHING;

-- Set sequence to higher value
SELECT setval('role_id_seq', 100);