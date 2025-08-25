-- Sample Teams Data with Meetings and Agenda Items
-- Clean existing data first
DELETE FROM team_knowledge_view;
DELETE FROM team_knowledge;
DELETE FROM meeting_notes;
DELETE FROM meeting_attendee;
DELETE FROM meeting_agenda_item;
DELETE FROM meeting WHERE team_id IS NOT NULL;
DELETE FROM team_members;
DELETE FROM teams;

-- Get some staff IDs to use (assuming we have at least 6 staff members)
-- Team 1: Curriculum Development Team
INSERT INTO teams (id, name, description, purpose, created_by, created_at, updated_at) VALUES
('team-curriculum-dev', 'Curriculum Development Team', 'Responsible for developing and updating curriculum standards across all grade levels', 'To ensure our curriculum meets state standards and student learning objectives', 1, '2024-01-15 10:00:00', '2024-01-15 10:00:00');

-- Team 2: Technology Integration Team  
INSERT INTO teams (id, name, description, purpose, created_by, created_at, updated_at) VALUES
('team-tech-integration', 'Technology Integration Team', 'Leading digital transformation and technology integration in education', 'To implement and optimize technology solutions for enhanced learning experiences', 2, '2024-02-01 09:00:00', '2024-02-01 09:00:00');

-- Team 3: Student Wellness Committee
INSERT INTO teams (id, name, description, purpose, created_by, created_at, updated_at) VALUES
('team-student-wellness', 'Student Wellness Committee', 'Focused on student mental health, physical wellness, and overall well-being', 'To develop and implement comprehensive wellness programs for student success', 3, '2024-03-01 11:00:00', '2024-03-01 11:00:00');

-- Add team members for Team 1 (Curriculum Development)
INSERT INTO team_members (team_id, staff_id, role, joined_at) VALUES
('team-curriculum-dev', 1, 'LEAD', '2024-01-15 10:00:00'),
('team-curriculum-dev', 2, 'MEMBER', '2024-01-16 10:00:00'),
('team-curriculum-dev', 3, 'MEMBER', '2024-01-17 10:00:00');

-- Add team members for Team 2 (Technology Integration)
INSERT INTO team_members (team_id, staff_id, role, joined_at) VALUES
('team-tech-integration', 2, 'LEAD', '2024-02-01 09:00:00'),
('team-tech-integration', 4, 'MEMBER', '2024-02-02 09:00:00'),
('team-tech-integration', 5, 'MEMBER', '2024-02-03 09:00:00');

-- Add team members for Team 3 (Student Wellness)
INSERT INTO team_members (team_id, staff_id, role, joined_at) VALUES
('team-student-wellness', 3, 'LEAD', '2024-03-01 11:00:00'),
('team-student-wellness', 1, 'MEMBER', '2024-03-02 11:00:00'),
('team-student-wellness', 6, 'MEMBER', '2024-03-03 11:00:00');

-- Create meetings for Team 1 (Curriculum Development)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, team_id, status, created_at, updated_at) VALUES
('Q1 Curriculum Standards Review', 'Quarterly review of curriculum standards alignment with state requirements', '2024-03-15 14:00:00', '2024-03-15 16:00:00', 1, 'team-curriculum-dev', 'COMPLETED', '2024-03-10 10:00:00', '2024-03-15 16:00:00'),
('Science Curriculum Update Planning', 'Planning session for integrating new science standards for grades 6-12', '2024-04-20 10:00:00', '2024-04-20 12:00:00', 1, 'team-curriculum-dev', 'COMPLETED', '2024-04-15 10:00:00', '2024-04-20 12:00:00'),
('Math Department Collaboration Meeting', 'Collaborative session with math department heads on new standards implementation', '2024-05-25 13:00:00', '2024-05-25 15:00:00', 1, 'team-curriculum-dev', 'SCHEDULED', '2024-05-20 10:00:00', '2024-05-20 10:00:00');

-- Create meetings for Team 2 (Technology Integration)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, team_id, status, created_at, updated_at) VALUES
('EdTech Platform Evaluation', 'Evaluation of new educational technology platforms for school-wide implementation', '2024-03-25 13:00:00', '2024-03-25 15:00:00', 2, 'team-tech-integration', 'COMPLETED', '2024-03-20 10:00:00', '2024-03-25 15:00:00'),
('1:1 Device Rollout Planning', 'Planning for 1:1 device implementation across all grade levels', '2024-05-10 09:00:00', '2024-05-10 11:30:00', 2, 'team-tech-integration', 'COMPLETED', '2024-05-05 10:00:00', '2024-05-10 11:30:00'),
('Network Infrastructure Upgrade', 'Planning network infrastructure improvements for increased device capacity', '2024-06-15 14:00:00', '2024-06-15 16:00:00', 2, 'team-tech-integration', 'SCHEDULED', '2024-06-10 10:00:00', '2024-06-10 10:00:00');

-- Create meetings for Team 3 (Student Wellness)
INSERT INTO meeting (title, description, start_time, end_time, organizer_id, team_id, status, created_at, updated_at) VALUES
('Mental Health Support Program Launch', 'Planning launch of comprehensive mental health support program for students', '2024-04-05 11:00:00', '2024-04-05 13:00:00', 3, 'team-student-wellness', 'COMPLETED', '2024-04-01 10:00:00', '2024-04-05 13:00:00'),
('Wellness Activities Planning', 'Planning quarterly wellness activities and stress reduction programs', '2024-05-20 10:00:00', '2024-05-20 12:00:00', 3, 'team-student-wellness', 'COMPLETED', '2024-05-15 10:00:00', '2024-05-20 12:00:00');

-- Get meeting IDs for agenda items (we'll use meeting title to find IDs)
-- Create agenda items for Curriculum meetings
INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at) 
SELECT id, 'Math Standards Alignment Review', 'Review current math curriculum alignment with new state standards', 1, 30, 'DISCUSSED', 2, '2024-03-10 10:00:00'
FROM meeting WHERE title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'English Language Arts Updates', 'Proposed changes to ELA curriculum for next academic year', 2, 45, 'APPROVED', 3, '2024-03-10 10:00:00'
FROM meeting WHERE title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Assessment Strategy Discussion', 'Review and update assessment methodologies across all subjects', 3, 45, 'PENDING', 1, '2024-03-10 10:00:00'
FROM meeting WHERE title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'New Lab Equipment Integration', 'Plan for integrating new laboratory equipment into science curriculum', 1, 40, 'APPROVED', 2, '2024-04-15 10:00:00'
FROM meeting WHERE title = 'Science Curriculum Update Planning';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Teacher Training Schedule', 'Schedule professional development sessions for science teachers', 2, 35, 'IN_PROGRESS', 3, '2024-04-15 10:00:00'
FROM meeting WHERE title = 'Science Curriculum Update Planning';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Budget Allocation for Resources', 'Discuss budget requirements for new science materials', 3, 45, 'DISCUSSED', 1, '2024-04-15 10:00:00'
FROM meeting WHERE title = 'Science Curriculum Update Planning';

-- Create agenda items for Technology meetings
INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Learning Management System Review', 'Compare and evaluate different LMS options for district adoption', 1, 45, 'APPROVED', 2, '2024-03-20 10:00:00'
FROM meeting WHERE title = 'EdTech Platform Evaluation';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Digital Citizenship Curriculum', 'Develop comprehensive digital citizenship training program', 2, 30, 'IN_PROGRESS', 4, '2024-03-20 10:00:00'
FROM meeting WHERE title = 'EdTech Platform Evaluation';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Network Infrastructure Assessment', 'Assess current network capacity for increased technology use', 3, 25, 'DISCUSSED', 5, '2024-03-20 10:00:00'
FROM meeting WHERE title = 'EdTech Platform Evaluation';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Device Distribution Strategy', 'Plan systematic device distribution across grade levels', 1, 50, 'APPROVED', 2, '2024-05-05 10:00:00'
FROM meeting WHERE title = '1:1 Device Rollout Planning';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Tech Support Training', 'Training program for staff to support 1:1 device initiative', 2, 40, 'IN_PROGRESS', 4, '2024-05-05 10:00:00'
FROM meeting WHERE title = '1:1 Device Rollout Planning';

-- Create agenda items for Wellness meetings
INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Counselor Staffing Review', 'Evaluate current counseling staff capacity and needs', 1, 40, 'APPROVED', 3, '2024-04-01 10:00:00'
FROM meeting WHERE title = 'Mental Health Support Program Launch';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Wellness Program Activities', 'Plan weekly wellness activities and stress reduction programs', 2, 35, 'IN_PROGRESS', 1, '2024-04-01 10:00:00'
FROM meeting WHERE title = 'Mental Health Support Program Launch';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Parent Communication Strategy', 'Develop communication plan for parent engagement in wellness initiatives', 3, 25, 'PENDING', 6, '2024-04-01 10:00:00'
FROM meeting WHERE title = 'Mental Health Support Program Launch';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Mindfulness Program Implementation', 'Implement school-wide mindfulness and meditation programs', 1, 45, 'APPROVED', 3, '2024-05-15 10:00:00'
FROM meeting WHERE title = 'Wellness Activities Planning';

INSERT INTO meeting_agenda_item (meeting_id, title, description, "order", duration, status, responsible_staff_id, created_at)
SELECT id, 'Physical Activity Initiatives', 'Develop programs to increase physical activity during school hours', 2, 30, 'DISCUSSED', 1, '2024-05-15 10:00:00'
FROM meeting WHERE title = 'Wellness Activities Planning';

-- Add meeting attendees
INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 1, 'ATTENDED'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 2, 'ATTENDED'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 3, 'ATTENDED'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 1, 'ATTENDED'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 2, 'ATTENDED'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 3, 'EXCUSED'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 2, 'ATTENDED'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 4, 'ATTENDED'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 5, 'ATTENDED'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 3, 'ATTENDED'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 1, 'ATTENDED'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

INSERT INTO meeting_attendee (meeting_id, staff_id, status)
SELECT m.id, 6, 'ATTENDED'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

-- Add meeting notes
INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 1, 'Great discussion on math standards alignment. Need to follow up with department heads on implementation timeline. Action items assigned to team members.', '2024-03-15 15:30:00'
FROM meeting m WHERE m.title = 'Q1 Curriculum Standards Review';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 2, 'New lab equipment will arrive next month. Training sessions scheduled for all science teachers. Budget approved for additional materials.', '2024-04-20 11:45:00'
FROM meeting m WHERE m.title = 'Science Curriculum Update Planning';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 2, 'LMS evaluation complete. Recommendation to proceed with Canvas implementation district-wide. Pilot program starts next semester.', '2024-03-25 14:30:00'
FROM meeting m WHERE m.title = 'EdTech Platform Evaluation';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 3, 'Mental health support program approved. Will start with pilot program in high school before district rollout. Additional counselor positions approved.', '2024-04-05 12:30:00'
FROM meeting m WHERE m.title = 'Mental Health Support Program Launch';

INSERT INTO meeting_notes (meeting_id, staff_id, content, created_at)
SELECT m.id, 1, 'Device rollout timeline finalized. Chrome books for grades 3-5, laptops for grades 6-12. Training sessions scheduled for teachers.', '2024-05-10 10:45:00'
FROM meeting m WHERE m.title = '1:1 Device Rollout Planning';

-- Add team knowledge resources
INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curriculum-dev', 'State Curriculum Standards Guide', 'Comprehensive guide to state curriculum standards and alignment requirements for all subjects. Includes detailed mapping of learning objectives, assessment criteria, and implementation timelines.', 'GUIDE', ARRAY['curriculum', 'standards', 'alignment', 'state-requirements'], u.id, 1, true, 15, 3, '2024-01-20 10:00:00', '2024-01-20 10:00:00'
FROM users u WHERE u.id = 1;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curriculum-dev', 'Assessment Best Practices', 'Collection of research-backed assessment methodologies and implementation strategies. Includes formative and summative assessment techniques, rubric development, and data analysis procedures.', 'DOCUMENT', ARRAY['assessment', 'best-practices', 'evaluation', 'rubrics'], u.id, 2, false, 8, 1, '2024-02-10 10:00:00', '2024-02-10 10:00:00'
FROM users u WHERE u.id = 2;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-curriculum-dev', 'Cross-Curricular Integration Strategies', 'Strategies and examples for integrating multiple subjects to create meaningful learning experiences. Includes project-based learning templates and interdisciplinary lesson plans.', 'TEMPLATE', ARRAY['integration', 'cross-curricular', 'projects', 'lesson-plans'], u.id, 3, false, 12, 5, '2024-03-05 10:00:00', '2024-03-05 10:00:00'
FROM users u WHERE u.id = 3;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-integration', 'EdTech Platform Comparison', 'Detailed comparison of educational technology platforms including features, pricing, and implementation requirements. Covers LMS, assessment tools, and collaboration platforms.', 'DOCUMENT', ARRAY['technology', 'platforms', 'comparison', 'LMS'], u.id, 2, true, 22, 7, '2024-02-15 10:00:00', '2024-02-15 10:00:00'
FROM users u WHERE u.id = 2;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-integration', 'Digital Citizenship Resources', 'Collection of resources for teaching digital citizenship and online safety to students. Includes age-appropriate curricula, parent communication templates, and assessment tools.', 'TEMPLATE', ARRAY['digital-citizenship', 'safety', 'resources', 'curriculum'], u.id, 4, false, 12, 5, '2024-03-01 10:00:00', '2024-03-01 10:00:00'
FROM users u WHERE u.id = 4;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-tech-integration', 'Device Management Protocols', 'Comprehensive protocols for managing 1:1 device programs including device distribution, maintenance, troubleshooting, and replacement procedures.', 'POLICY', ARRAY['device-management', '1:1', 'protocols', 'maintenance'], u.id, 5, true, 18, 4, '2024-04-01 10:00:00', '2024-04-01 10:00:00'
FROM users u WHERE u.id = 5;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-student-wellness', 'Student Wellness Program Framework', 'Comprehensive framework for implementing student wellness programs including mental health support, physical wellness activities, and social-emotional learning components.', 'POLICY', ARRAY['wellness', 'mental-health', 'framework', 'SEL'], u.id, 3, true, 18, 4, '2024-03-05 10:00:00', '2024-03-05 10:00:00'
FROM users u WHERE u.id = 3;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-student-wellness', 'Crisis Intervention Procedures', 'Step-by-step procedures for handling student mental health crises including emergency contacts, intervention strategies, and follow-up protocols.', 'GUIDE', ARRAY['crisis', 'intervention', 'mental-health', 'emergency'], u.id, 1, true, 25, 8, '2024-03-15 10:00:00', '2024-03-15 10:00:00'
FROM users u WHERE u.id = 1;

INSERT INTO team_knowledge (team_id, title, content, type, tags, created_by, created_by_staff_id, is_pinned, views_count, downloads_count, created_at, updated_at)
SELECT 'team-student-wellness', 'Mindfulness Activity Collection', 'Collection of age-appropriate mindfulness and stress reduction activities for students. Includes guided meditation scripts, breathing exercises, and classroom integration tips.', 'TEMPLATE', ARRAY['mindfulness', 'activities', 'stress-reduction', 'meditation'], u.id, 6, false, 14, 6, '2024-04-10 10:00:00', '2024-04-10 10:00:00'
FROM users u WHERE u.id = 6;

-- Add some knowledge views for analytics
INSERT INTO team_knowledge_view (knowledge_id, user_id, viewed_at)
SELECT tk.id, u.id, '2024-08-20 10:00:00'
FROM team_knowledge tk, users u
WHERE tk.title = 'State Curriculum Standards Guide' AND u.id IN (1, 2, 3, 4, 5)
LIMIT 5;

INSERT INTO team_knowledge_view (knowledge_id, user_id, viewed_at)
SELECT tk.id, u.id, '2024-08-21 14:30:00'
FROM team_knowledge tk, users u
WHERE tk.title = 'EdTech Platform Comparison' AND u.id IN (2, 4, 5, 6)
LIMIT 4;

INSERT INTO team_knowledge_view (knowledge_id, user_id, viewed_at)
SELECT tk.id, u.id, '2024-08-22 09:15:00'
FROM team_knowledge tk, users u
WHERE tk.title = 'Student Wellness Program Framework' AND u.id IN (1, 3, 6)
LIMIT 3;

-- Summary of created data
SELECT 
    'Teams' as type, 
    COUNT(*) as count 
FROM teams
UNION ALL
SELECT 
    'Team Members' as type, 
    COUNT(*) as count 
FROM team_members
UNION ALL
SELECT 
    'Meetings' as type, 
    COUNT(*) as count 
FROM meeting 
WHERE team_id IS NOT NULL
UNION ALL
SELECT 
    'Agenda Items' as type, 
    COUNT(*) as count 
FROM meeting_agenda_item 
WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL)
UNION ALL
SELECT 
    'Meeting Attendees' as type, 
    COUNT(*) as count 
FROM meeting_attendee 
WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL)
UNION ALL
SELECT 
    'Meeting Notes' as type, 
    COUNT(*) as count 
FROM meeting_notes 
WHERE meeting_id IN (SELECT id FROM meeting WHERE team_id IS NOT NULL)
UNION ALL
SELECT 
    'Knowledge Resources' as type, 
    COUNT(*) as count 
FROM team_knowledge;