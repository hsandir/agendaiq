-- Comprehensive Teams and Meetings Data
-- Clean existing data first
DELETE FROM team_knowledge WHERE team_id LIKE 'team-%';
DELETE FROM meeting_notes;
DELETE FROM meeting_attendee;
DELETE FROM meeting_agenda_items;
DELETE FROM meeting;
DELETE FROM team_members WHERE team_id LIKE 'team-%';
DELETE FROM teams WHERE id LIKE 'team-%';

-- ====================
-- CREATE TEAMS
-- ====================

-- Team 1: Academic Excellence Committee
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-academic', 'Academic Excellence Committee', 'ACAD-EXCEL', 'Committee focused on improving academic standards and student achievement across all grade levels', 'To enhance educational outcomes through curriculum development, assessment improvements, and teaching excellence initiatives', 
(SELECT id FROM users LIMIT 1), '2024-01-10 09:00:00'::timestamp, '2024-01-10 09:00:00'::timestamp);

-- Team 2: School Operations & Safety Committee  
INSERT INTO teams (id, name, code, description, purpose, created_by, created_at, updated_at) VALUES
('team-operations', 'School Operations & Safety Committee', 'OPS-SAFETY', 'Responsible for school operations, facility management, safety protocols, and emergency preparedness', 'To ensure safe, efficient, and well-maintained learning environments that support educational excellence',
(SELECT id FROM users LIMIT 1 OFFSET 1), '2024-02-05 10:00:00'::timestamp, '2024-02-05 10:00:00'::timestamp);

-- ====================
-- ADD TEAM MEMBERS
-- ====================

-- Academic Excellence Committee Members
INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-academic', u.id, s.id, 'LEAD', '2024-01-10 09:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-academic', u.id, s.id, 'MEMBER', '2024-01-12 09:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 1;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-academic', u.id, s.id, 'MEMBER', '2024-01-15 09:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 2;

-- Operations & Safety Committee Members
INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-operations', u.id, s.id, 'LEAD', '2024-02-05 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 3;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-operations', u.id, s.id, 'MEMBER', '2024-02-07 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 4;

INSERT INTO team_members (id, team_id, user_id, staff_id, role, joined_at)
SELECT 
    gen_random_uuid()::text, 'team-operations', u.id, s.id, 'MEMBER', '2024-02-10 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 5;

-- ====================
-- TEAM MEETINGS (Past and Future)
-- ====================

-- Academic Excellence Committee Meetings
-- Past Meeting 1
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, team_id, status, created_at) 
SELECT 
    'Q1 Academic Performance Review', 
    'Comprehensive review of first quarter academic performance across all grade levels, including standardized test results, curriculum alignment, and teacher feedback',
    '2024-03-15 14:00:00'::timestamp, '2024-03-15 16:30:00'::timestamp, 
    s.id, 2, 2, 2, 'team-academic', 'COMPLETED', '2024-03-10 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1);

-- Past Meeting 2
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, team_id, status, created_at) 
SELECT 
    'Curriculum Alignment Workshop', 
    'Workshop focused on aligning curriculum with state standards and implementing new teaching methodologies for improved student outcomes',
    '2024-04-22 13:00:00'::timestamp, '2024-04-22 15:30:00'::timestamp, 
    s.id, 2, 2, 2, 'team-academic', 'COMPLETED', '2024-04-15 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1);

-- Future Meeting 1
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, team_id, status, created_at) 
SELECT 
    'Mid-Year Assessment Strategy Planning', 
    'Planning session for mid-year assessments, including developing new evaluation criteria and implementing data-driven instruction approaches',
    '2024-12-10 09:00:00'::timestamp, '2024-12-10 11:30:00'::timestamp, 
    s.id, 2, 2, 2, 'team-academic', 'SCHEDULED', '2024-11-25 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1);

-- Operations & Safety Committee Meetings
-- Past Meeting 1
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, team_id, status, created_at) 
SELECT 
    'Emergency Preparedness Drill Evaluation', 
    'Post-drill evaluation meeting to assess emergency response procedures, identify areas for improvement, and update safety protocols',
    '2024-03-28 10:00:00'::timestamp, '2024-03-28 12:00:00'::timestamp, 
    s.id, 3, 2, 2, 'team-operations', 'COMPLETED', '2024-03-20 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 3);

-- Future Meeting 1
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, team_id, status, created_at) 
SELECT 
    'Winter Facility Maintenance Planning', 
    'Planning meeting for winter facility maintenance, including HVAC system checks, building security updates, and snow removal procedures',
    '2024-11-20 14:00:00'::timestamp, '2024-11-20 16:00:00'::timestamp, 
    s.id, 3, 2, 2, 'team-operations', 'SCHEDULED', '2024-11-10 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 3);

-- Follow-up Meeting (continuation of previous discussions)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, team_id, status, created_at) 
SELECT 
    'Emergency Preparedness Follow-up Actions', 
    'Follow-up meeting to implement action items from previous emergency drill evaluation, including staff training updates and equipment procurement',
    '2024-11-15 11:00:00'::timestamp, '2024-11-15 13:00:00'::timestamp, 
    s.id, 3, 2, 2, 'team-operations', 'SCHEDULED', '2024-11-05 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 3);

-- ====================
-- INDEPENDENT MEETINGS (Not team-related)
-- ====================

-- Past Independent Meeting 1
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, status, created_at) 
SELECT 
    'Monthly Administrative Review', 
    'Monthly review of administrative processes, budget updates, staff performance evaluations, and operational efficiency metrics',
    '2024-03-05 15:00:00'::timestamp, '2024-03-05 17:00:00'::timestamp, 
    s.id, 4, 2, 2, 'COMPLETED', '2024-02-28 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

-- Past Independent Meeting 2 
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, status, created_at) 
SELECT 
    'Parent-Teacher Conference Planning', 
    'Planning session for upcoming parent-teacher conferences, including scheduling, format decisions, and communication strategies',
    '2024-04-10 13:30:00'::timestamp, '2024-04-10 15:00:00'::timestamp, 
    s.id, 2, 2, 2, 'COMPLETED', '2024-04-01 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 2);

-- Future Independent Meeting 1
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, status, created_at) 
SELECT 
    'Holiday Program Coordination', 
    'Coordination meeting for upcoming holiday programs, including event planning, volunteer coordination, and budget allocation',
    '2024-11-25 10:00:00'::timestamp, '2024-11-25 12:00:00'::timestamp, 
    s.id, 5, 2, 2, 'SCHEDULED', '2024-11-15 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 4);

-- Future Independent Meeting 2 (In Progress)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, status, created_at) 
SELECT 
    'Technology Integration Training Workshop', 
    'Professional development workshop on integrating new educational technologies into classroom instruction and administrative processes',
    '2024-12-03 08:30:00'::timestamp, '2024-12-03 12:30:00'::timestamp, 
    s.id, 3, 2, 2, 'IN_PROGRESS', '2024-11-20 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 5);

-- Follow-up Independent Meeting (continuation)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, department_id, district_id, school_id, status, created_at) 
SELECT 
    'Administrative Review Follow-up', 
    'Follow-up to March administrative review meeting, addressing action items, budget adjustments, and policy implementations',
    '2024-12-15 14:00:00'::timestamp, '2024-12-15 16:30:00'::timestamp, 
    s.id, 4, 2, 2, 'SCHEDULED', '2024-12-01 10:00:00'::timestamp
FROM staff s WHERE s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

-- ====================
-- AGENDA ITEMS FOR MEETINGS
-- ====================

-- Academic Excellence Committee - Q1 Review Agenda Items
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Standardized Test Score Analysis', 'Q1 standardized test scores show inconsistencies across grade levels requiring detailed analysis and intervention strategies', 
       s.id, 'Discussion', 'Resolved', 1, '2024-03-10 10:00:00'::timestamp, '2024-03-15 16:30:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Academic Performance Review' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Teacher Professional Development Needs Assessment', 'Identifying specific professional development needs based on classroom observations and student performance data', 
       s.id, 'Decision', 'Resolved', 2, '2024-03-10 10:00:00'::timestamp, '2024-03-15 16:30:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Academic Performance Review' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 2);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Curriculum Pacing Guide Adjustments', 'Current pacing guides may need adjustments to ensure adequate coverage of essential standards before state testing', 
       s.id, 'Information_Sharing', 'Ongoing', 3, '2024-03-10 10:00:00'::timestamp, '2024-03-15 16:30:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Q1 Academic Performance Review' AND s.user_id = (SELECT id FROM users LIMIT 1);

-- Curriculum Alignment Workshop Agenda Items
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'State Standards Mapping Review', 'Need to ensure all curriculum materials align with updated state standards and learning objectives', 
       s.id, 'Decision', 'Resolved', 1, '2024-04-15 10:00:00'::timestamp, '2024-04-22 15:30:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Curriculum Alignment Workshop' AND s.user_id = (SELECT id FROM users LIMIT 1);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Cross-Curricular Integration Strategies', 'Implementing strategies to integrate learning across different subject areas for deeper student understanding', 
       s.id, 'Discussion', 'Resolved', 2, '2024-04-15 10:00:00'::timestamp, '2024-04-22 15:30:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Curriculum Alignment Workshop' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

-- Emergency Preparedness Drill Evaluation Agenda Items
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Evacuation Procedure Effectiveness Review', 'Recent fire drill revealed bottlenecks in evacuation routes and timing issues that need to be addressed', 
       s.id, 'Discussion', 'Resolved', 1, '2024-03-20 10:00:00'::timestamp, '2024-03-28 12:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Emergency Preparedness Drill Evaluation' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 3);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Communication System Updates', 'Current emergency communication system needs improvements for better coordination during emergencies', 
       s.id, 'Decision', 'Resolved', 2, '2024-03-20 10:00:00'::timestamp, '2024-03-28 12:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Emergency Preparedness Drill Evaluation' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 4);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Staff Training Requirements Update', 'Need to update emergency response training requirements and schedule additional training sessions', 
       s.id, 'Information_Sharing', 'Assigned_to_local', 3, '2024-03-20 10:00:00'::timestamp, '2024-03-28 12:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Emergency Preparedness Drill Evaluation' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 5);

-- Future Meeting Agenda Items (Mid-Year Assessment Strategy Planning)
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Mid-Year Benchmark Assessment Design', 'Design comprehensive mid-year assessments that accurately measure student progress and identify intervention needs', 
       s.id, 'Discussion', 'Pending', 1, '2024-11-25 10:00:00'::timestamp, '2024-11-25 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Mid-Year Assessment Strategy Planning' AND s.user_id = (SELECT id FROM users LIMIT 1);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Data Analysis Protocol Development', 'Establish protocols for analyzing assessment data and using results to inform instruction and intervention strategies', 
       s.id, 'Decision', 'Pending', 2, '2024-11-25 10:00:00'::timestamp, '2024-11-25 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Mid-Year Assessment Strategy Planning' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

-- Independent Meeting Agenda Items
-- Monthly Administrative Review
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Budget Variance Analysis', 'Q1 budget shows variances in several categories that require analysis and potential reallocation', 
       s.id, 'Discussion', 'Resolved', 1, '2024-02-28 10:00:00'::timestamp, '2024-03-05 17:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Monthly Administrative Review' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Staffing Level Assessment', 'Current staffing levels may be inadequate for projected enrollment increases in the next academic year', 
       s.id, 'Information_Sharing', 'CarriedForward', 2, '2024-02-28 10:00:00'::timestamp, '2024-03-05 17:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Monthly Administrative Review' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 2);

-- Technology Integration Training Workshop (In Progress)
INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'New Learning Management System Training', 'Staff need comprehensive training on the new LMS platform being implemented district-wide', 
       s.id, 'Information_Sharing', 'Ongoing', 1, '2024-11-20 10:00:00'::timestamp, '2024-11-20 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Technology Integration Training Workshop' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 5);

INSERT INTO meeting_agenda_items (meeting_id, topic, problem_statement, responsible_staff_id, purpose, status, order_index, created_at, updated_at)
SELECT m.id, 'Digital Assessment Tools Implementation', 'Transition from paper-based to digital assessment tools requires training and change management support', 
       s.id, 'Discussion', 'Ongoing', 2, '2024-11-20 10:00:00'::timestamp, '2024-11-20 10:00:00'::timestamp
FROM meeting m, staff s 
WHERE m.title = 'Technology Integration Training Workshop' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 3);

-- ====================
-- MEETING ATTENDEES
-- ====================

-- Academic Excellence Committee Attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Q1 Academic Performance Review' 
AND s.user_id IN (SELECT id FROM users LIMIT 3);

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Curriculum Alignment Workshop' 
AND s.user_id IN (SELECT id FROM users LIMIT 3);

-- Operations Committee Attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Emergency Preparedness Drill Evaluation' 
AND s.user_id IN (SELECT id FROM users LIMIT 3 OFFSET 3);

-- Independent Meeting Attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Monthly Administrative Review' 
AND s.user_id IN (SELECT id FROM users LIMIT 4 OFFSET 1);

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, s.id, 'ATTENDED' 
FROM meeting m, staff s 
WHERE m.title = 'Parent-Teacher Conference Planning' 
AND s.user_id IN (SELECT id FROM users LIMIT 3 OFFSET 2);

-- ====================
-- MEETING NOTES
-- ====================

-- Academic Committee Meeting Notes
INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Excellent discussion on standardized test analysis. Key action items: 1) Implement targeted intervention programs for underperforming students, 2) Provide additional professional development for teachers in data analysis, 3) Revise pacing guides to ensure adequate test preparation time. Follow-up meeting scheduled for curriculum alignment workshop.', '2024-03-15 16:00:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Q1 Academic Performance Review' AND s.user_id = (SELECT id FROM users LIMIT 1);

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Productive workshop on curriculum alignment. Successfully mapped all grade levels to updated state standards. Identified opportunities for better cross-curricular integration. Next steps include piloting new integrated lesson plans and measuring student engagement outcomes.', '2024-04-22 15:00:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Curriculum Alignment Workshop' AND s.user_id = (SELECT id FROM users LIMIT 1);

-- Operations Committee Meeting Notes
INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Emergency drill evaluation revealed several areas for improvement. Communication delays during evacuation need to be addressed. Approved budget for new emergency communication system and additional staff training. Will implement changes before next quarterly drill.', '2024-03-28 11:30:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Emergency Preparedness Drill Evaluation' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 3);

-- Independent Meeting Notes
INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Monthly administrative review covered budget variances and staffing concerns. Budget reallocation approved for technology upgrades. HR to begin recruitment process for additional teaching positions. Performance evaluations on track for completion by quarter end.', '2024-03-05 16:30:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Monthly Administrative Review' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 1);

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, s.id, 'Parent-teacher conference planning went smoothly. Decided on hybrid format with both in-person and virtual options. Communication templates finalized and scheduling system updated. Expecting high participation rates based on parent feedback surveys.', '2024-04-10 14:45:00'::timestamp
FROM meeting m, staff s
WHERE m.title = 'Parent-Teacher Conference Planning' AND s.user_id = (SELECT id FROM users LIMIT 1 OFFSET 2);

-- ====================
-- TEAM KNOWLEDGE RESOURCES
-- ====================

-- Academic Excellence Committee Knowledge
INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-academic', 'Academic Standards Alignment Guide', 
    'Comprehensive guide for aligning curriculum and assessments with state academic standards. Includes mapping templates, timeline recommendations, and best practices for ensuring standards compliance across all grade levels.',
    'GUIDE', ARRAY['academic-standards', 'curriculum', 'alignment', 'compliance'], 
    u.id, s.id, true, 28, 12, 
    '2024-01-20 10:00:00'::timestamp, '2024-04-22 15:30:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-academic', 'Data-Driven Instruction Toolkit', 
    'Complete toolkit for implementing data-driven instruction practices. Includes assessment templates, data analysis worksheets, intervention planning guides, and progress monitoring tools.',
    'TEMPLATE', ARRAY['data-analysis', 'instruction', 'assessment', 'toolkit'], 
    u.id, s.id, false, 15, 8, 
    '2024-02-15 10:00:00'::timestamp, '2024-03-15 16:30:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 1;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-academic', 'Professional Development Planning Framework', 
    'Framework for identifying, planning, and implementing professional development initiatives. Includes needs assessment tools, training calendars, and evaluation metrics for measuring effectiveness.',
    'POLICY', ARRAY['professional-development', 'training', 'framework', 'evaluation'], 
    u.id, s.id, true, 22, 6, 
    '2024-03-01 10:00:00'::timestamp, '2024-04-15 12:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 2;

-- Operations & Safety Committee Knowledge
INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-operations', 'Emergency Response Procedures Manual', 
    'Comprehensive manual covering all emergency response procedures including evacuation routes, communication protocols, staff responsibilities, and post-emergency procedures. Updated quarterly based on drill evaluations.',
    'GUIDE', ARRAY['emergency', 'safety', 'procedures', 'evacuation'], 
    u.id, s.id, true, 45, 18, 
    '2024-02-10 10:00:00'::timestamp, '2024-03-28 12:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 3;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-operations', 'Facility Maintenance Checklist', 
    'Detailed maintenance checklists for all school facilities including HVAC systems, electrical, plumbing, grounds, and safety equipment. Organized by frequency (daily, weekly, monthly, seasonal).',
    'TEMPLATE', ARRAY['maintenance', 'facilities', 'checklist', 'safety'], 
    u.id, s.id, false, 18, 9, 
    '2024-02-20 10:00:00'::timestamp, '2024-02-20 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 4;

INSERT INTO team_knowledge (id, team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 
    gen_random_uuid()::text, 'team-operations', 'Budget Management Best Practices', 
    'Best practices for managing operational budgets including cost tracking, vendor management, emergency fund allocation, and financial reporting. Includes templates for budget planning and expense tracking.',
    'DOCUMENT', ARRAY['budget', 'finance', 'operations', 'management'], 
    u.id, s.id, true, 31, 14, 
    '2024-03-05 10:00:00'::timestamp, '2024-03-05 10:00:00'::timestamp
FROM users u, staff s WHERE u.id = s.user_id LIMIT 1 OFFSET 5;

-- ====================
-- FINAL SUMMARY
-- ====================

SELECT 'SUCCESS: Comprehensive meetings and teams data created' as status;

-- Summary statistics
SELECT 
    'Teams Created' as item, COUNT(*) as count FROM teams WHERE id LIKE 'team-%'
UNION ALL SELECT 
    'Team Members' as item, COUNT(*) as count FROM team_members WHERE team_id LIKE 'team-%'
UNION ALL SELECT 
    'Team Meetings' as item, COUNT(*) as count FROM meeting WHERE team_id LIKE 'team-%'
UNION ALL SELECT 
    'Independent Meetings' as item, COUNT(*) as count FROM meeting WHERE team_id IS NULL
UNION ALL SELECT 
    'Total Meetings' as item, COUNT(*) as count FROM meeting
UNION ALL SELECT 
    'Agenda Items' as item, COUNT(*) as count FROM meeting_agenda_items
UNION ALL SELECT 
    'Meeting Attendees' as item, COUNT(*) as count FROM meeting_attendee
UNION ALL SELECT 
    'Meeting Notes' as item, COUNT(*) as count FROM meeting_notes
UNION ALL SELECT 
    'Knowledge Resources' as item, COUNT(*) as count FROM team_knowledge WHERE team_id LIKE 'team-%';

-- Detailed team overview
SELECT 
    t.name as team_name,
    t.code,
    COUNT(DISTINCT tm.user_id) as members,
    COUNT(DISTINCT m.id) as meetings,
    COUNT(DISTINCT mai.id) as agenda_items,
    COUNT(DISTINCT tk.id) as knowledge_resources
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN meeting m ON t.id = m.team_id
LEFT JOIN meeting_agenda_items mai ON m.id = mai.meeting_id
LEFT JOIN team_knowledge tk ON t.id = tk.team_id
WHERE t.id LIKE 'team-%'
GROUP BY t.id, t.name, t.code
ORDER BY t.name;