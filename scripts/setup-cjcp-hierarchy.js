const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupCJCPHierarchy() {
  try {
    console.log('🏗️  Setting up CJCP Somerset role hierarchy...');

    // 1. Create District
    const district = await prisma.district.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'CJCP Somerset',
        address: 'Somerset, NJ',
        code: 'CJCP'
      }
    });

    console.log('✅ District created:', district.name);

    // 2. Create School
    const school = await prisma.school.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'CJCP Somerset School',
        address: 'Somerset, NJ',
        code: 'CJCP-SCHOOL',
        district_id: district.id
      }
    });

    console.log('✅ School created:', school.name);

    // 3. Create Departments
    const departments = [
      { name: 'Executive Leadership', code: 'EXEC' },
      { name: 'Operations', code: 'OPS' },
      { name: 'Business & Finance', code: 'BF' },
      { name: 'Humanities', code: 'HUM' },
      { name: 'STEM', code: 'STEM' },
      { name: 'Curriculum Development', code: 'CURR' },
      { name: 'Assessment & Accountability', code: 'ASSESS' },
      { name: 'Elementary Education', code: 'ELEM' },
      { name: 'Elementary Coaching', code: 'ELEM-COACH' },
      { name: 'Upper School Humanities', code: 'US-HUM' },
      { name: 'Upper School STEM', code: 'US-STEM' },
      { name: 'Electives & Arts', code: 'ELECTIVES' },
      { name: 'Student Support', code: 'SUPPORT' },
      { name: 'Academic Counseling', code: 'ACADEMIC' },
      { name: 'School Counseling', code: 'COUNSELING' },
      { name: 'Social Work Services', code: 'SOCIAL' },
      { name: 'Behavioral Support', code: 'BEHAVIOR' },
      { name: 'Psychological Services', code: 'PSYCH' },
      { name: 'Special Education', code: 'SPED' },
      { name: 'Security & Safety', code: 'SECURITY' },
      { name: 'Administrative Support', code: 'ADMIN' },
      { name: 'Attendance Services', code: 'ATTEND' },
      { name: 'Executive Support', code: 'EXEC-SUPPORT' },
      { name: 'Human Resources', code: 'HR' },
      { name: 'Health Services', code: 'HEALTH' },
      { name: 'Information Technology', code: 'IT' }
    ];

    const createdDepartments = {};
    for (const dept of departments) {
      const department = await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: {
          name: dept.name,
          code: dept.code,
          school_id: school.id
        }
      });
      createdDepartments[dept.code] = department;
    }

    console.log(`✅ Created ${departments.length} departments`);

    // 4. Create Roles with hierarchy
    const roles = [
      // Level 1 - Top Executive
      { title: 'Chief Education Officer (CEO)', priority: 1, level: 1, is_leadership: true, department: 'EXEC' },
      { title: 'Executive Assistant', priority: 2, level: 2, is_leadership: false, department: 'EXEC' },
      { title: 'Strategic Planning Coordinator', priority: 3, level: 2, is_leadership: false, department: 'EXEC' },
      { title: 'Board Relations Coordinator', priority: 4, level: 2, is_leadership: false, department: 'EXEC' },
      { title: 'Policy Development Specialist', priority: 5, level: 2, is_leadership: false, department: 'EXEC' },

      // Level 2 - Operations & Administrative Management
      { title: 'Director of Operations', priority: 10, level: 2, is_leadership: true, department: 'OPS' },
      { title: 'Operations Coordinator', priority: 11, level: 3, is_leadership: false, department: 'OPS' },
      { title: 'Facility Manager', priority: 12, level: 3, is_leadership: false, department: 'OPS' },
      { title: 'Maintenance Supervisor', priority: 13, level: 3, is_leadership: false, department: 'OPS' },
      { title: 'Transportation Coordinator', priority: 14, level: 3, is_leadership: false, department: 'OPS' },
      { title: 'Food Service Manager', priority: 15, level: 3, is_leadership: false, department: 'OPS' },

      { title: 'Business Administrator', priority: 20, level: 2, is_leadership: true, department: 'BF' },
      { title: 'Assistant Business Administrator', priority: 21, level: 3, is_leadership: true, department: 'BF' },
      { title: 'Budget Analyst', priority: 22, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Financial Coordinator', priority: 23, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Contract Manager', priority: 24, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Compliance Officer', priority: 25, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Business Operations Assistant', priority: 26, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Financial Processing Coordinator', priority: 27, level: 4, is_leadership: false, department: 'BF' },

      // Education & Curriculum Management
      { title: 'Director of Curriculum - Humanities', priority: 30, level: 2, is_leadership: true, department: 'HUM' },
      { title: 'English Department Head', priority: 31, level: 3, is_leadership: false, department: 'HUM' },
      { title: 'English Teacher (Grades 9-12)', priority: 32, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'English Teacher (Grades 6-8)', priority: 33, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'English Teacher (Grades K-5)', priority: 34, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'Social Studies Department Head', priority: 35, level: 3, is_leadership: false, department: 'HUM' },
      { title: 'Social Studies Teacher (Grades 9-12)', priority: 36, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'Social Studies Teacher (Grades 6-8)', priority: 37, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'Social Studies Teacher (Grades K-5)', priority: 38, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'History Teacher', priority: 39, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'Literature Teacher', priority: 40, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'Writing Coordinator', priority: 41, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'Reading Specialist', priority: 42, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'ESL Coordinator', priority: 43, level: 4, is_leadership: false, department: 'HUM' },
      { title: 'World Languages Teacher', priority: 44, level: 4, is_leadership: false, department: 'HUM' },

      { title: 'Director of Curriculum - STEM', priority: 50, level: 2, is_leadership: true, department: 'STEM' },
      { title: 'Mathematics Department Head', priority: 51, level: 3, is_leadership: false, department: 'STEM' },
      { title: 'Mathematics Teacher (High School)', priority: 52, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Mathematics Teacher (Middle School)', priority: 53, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Mathematics Teacher (Elementary)', priority: 54, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Algebra Teacher', priority: 55, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Geometry Teacher', priority: 56, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Calculus Teacher', priority: 57, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Statistics Teacher', priority: 58, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Science Department Head', priority: 59, level: 3, is_leadership: false, department: 'STEM' },
      { title: 'Biology Teacher', priority: 60, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Chemistry Teacher', priority: 61, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Physics Teacher', priority: 62, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Earth Science Teacher', priority: 63, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Environmental Science Teacher', priority: 64, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Computer Science Teacher', priority: 65, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Engineering Teacher', priority: 66, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'Technology Integration Specialist', priority: 67, level: 4, is_leadership: false, department: 'STEM' },
      { title: 'STEM Lab Coordinator', priority: 68, level: 4, is_leadership: false, department: 'STEM' },

      { title: 'Supervisors - Curriculum/Professional Development', priority: 70, level: 2, is_leadership: true, department: 'CURR' },
      { title: 'Curriculum Specialist', priority: 71, level: 3, is_leadership: false, department: 'CURR' },
      { title: 'Professional Development Coordinator', priority: 72, level: 3, is_leadership: false, department: 'CURR' },
      { title: 'Instructional Designer', priority: 73, level: 3, is_leadership: false, department: 'CURR' },
      { title: 'Assessment Development Specialist', priority: 74, level: 3, is_leadership: false, department: 'CURR' },
      { title: 'Training Coordinator', priority: 75, level: 3, is_leadership: false, department: 'CURR' },
      { title: 'Mentoring Program Coordinator', priority: 76, level: 3, is_leadership: false, department: 'CURR' },

      { title: 'Director of Accountability', priority: 80, level: 2, is_leadership: true, department: 'ASSESS' },
      { title: 'Data Analyst', priority: 81, level: 3, is_leadership: false, department: 'ASSESS' },
      { title: 'Assessment Coordinator', priority: 82, level: 3, is_leadership: false, department: 'ASSESS' },
      { title: 'Testing Coordinator', priority: 83, level: 3, is_leadership: false, department: 'ASSESS' },
      { title: 'Quality Assurance Specialist', priority: 84, level: 3, is_leadership: false, department: 'ASSESS' },
      { title: 'Performance Evaluation Specialist', priority: 85, level: 3, is_leadership: false, department: 'ASSESS' },
      { title: 'Standards Compliance Officer', priority: 86, level: 3, is_leadership: false, department: 'ASSESS' },

      // Level 3 - Education Supervision & Coaching
      { title: 'Elementary Supervisor', priority: 90, level: 3, is_leadership: true, department: 'ELEM' },
      { title: 'Grade Level Coordinator (K)', priority: 91, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Grade Level Coordinator (1)', priority: 92, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Grade Level Coordinator (2)', priority: 93, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Grade Level Coordinator (3)', priority: 94, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Grade Level Coordinator (4)', priority: 95, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Grade Level Coordinator (5)', priority: 96, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Elementary Curriculum Coordinator', priority: 97, level: 4, is_leadership: false, department: 'ELEM' },
      { title: 'Elementary Assessment Coordinator', priority: 98, level: 4, is_leadership: false, department: 'ELEM' },

      { title: 'Elementary Coach', priority: 100, level: 3, is_leadership: false, department: 'ELEM-COACH' },
      { title: 'Literacy Coach', priority: 101, level: 4, is_leadership: false, department: 'ELEM-COACH' },
      { title: 'Math Coach', priority: 102, level: 4, is_leadership: false, department: 'ELEM-COACH' },
      { title: 'Science Coach', priority: 103, level: 4, is_leadership: false, department: 'ELEM-COACH' },
      { title: 'Instructional Coach', priority: 104, level: 4, is_leadership: false, department: 'ELEM-COACH' },
      { title: 'New Teacher Mentor', priority: 105, level: 4, is_leadership: false, department: 'ELEM-COACH' },

      { title: 'US Supervisor - Humanities', priority: 110, level: 3, is_leadership: true, department: 'US-HUM' },
      { title: 'AP Coordinator (English)', priority: 111, level: 4, is_leadership: false, department: 'US-HUM' },
      { title: 'AP Coordinator (History)', priority: 112, level: 4, is_leadership: false, department: 'US-HUM' },
      { title: 'AP Coordinator (Social Studies)', priority: 113, level: 4, is_leadership: false, department: 'US-HUM' },
      { title: 'Humanities Department Coordinator', priority: 114, level: 4, is_leadership: false, department: 'US-HUM' },
      { title: 'Writing Center Coordinator', priority: 115, level: 4, is_leadership: false, department: 'US-HUM' },
      { title: 'Debate Team Coach', priority: 116, level: 4, is_leadership: false, department: 'US-HUM' },

      { title: 'US Supervisor - STEM', priority: 120, level: 3, is_leadership: true, department: 'US-STEM' },
      { title: 'AP Coordinator (Math)', priority: 121, level: 4, is_leadership: false, department: 'US-STEM' },
      { title: 'AP Coordinator (Science)', priority: 122, level: 4, is_leadership: false, department: 'US-STEM' },
      { title: 'STEM Department Coordinator', priority: 123, level: 4, is_leadership: false, department: 'US-STEM' },
      { title: 'Science Lab Manager', priority: 124, level: 4, is_leadership: false, department: 'US-STEM' },
      { title: 'Robotics Team Coach', priority: 125, level: 4, is_leadership: false, department: 'US-STEM' },
      { title: 'Math Competition Coach', priority: 126, level: 4, is_leadership: false, department: 'US-STEM' },

      { title: 'US Supervisor - Electives', priority: 130, level: 3, is_leadership: true, department: 'ELECTIVES' },
      { title: 'Arts Department Head', priority: 131, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Art Teacher', priority: 132, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Music Teacher', priority: 133, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Drama Teacher', priority: 134, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Physical Education Teacher', priority: 135, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Health Teacher', priority: 136, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Library Media Specialist', priority: 137, level: 4, is_leadership: false, department: 'ELECTIVES' },
      { title: 'Career Education Coordinator', priority: 138, level: 4, is_leadership: false, department: 'ELECTIVES' },

      // Student Support Services
      { title: 'Director of Student Support Services', priority: 140, level: 2, is_leadership: true, department: 'SUPPORT' },
      { title: 'Assistant Director of Student Support Services', priority: 141, level: 3, is_leadership: true, department: 'SUPPORT' },
      { title: 'Student Advocate', priority: 142, level: 3, is_leadership: false, department: 'SUPPORT' },
      { title: 'Crisis Intervention Coordinator', priority: 143, level: 3, is_leadership: false, department: 'SUPPORT' },
      { title: 'Parent Communication Specialist', priority: 144, level: 3, is_leadership: false, department: 'SUPPORT' },
      { title: 'Support Services Coordinator', priority: 145, level: 4, is_leadership: false, department: 'SUPPORT' },
      { title: 'Case Manager', priority: 146, level: 4, is_leadership: false, department: 'SUPPORT' },
      { title: 'Student Success Coach', priority: 147, level: 4, is_leadership: false, department: 'SUPPORT' },

      { title: 'Academic Counselor', priority: 150, level: 3, is_leadership: false, department: 'ACADEMIC' },
      { title: 'College Application Specialist', priority: 151, level: 4, is_leadership: false, department: 'ACADEMIC' },
      { title: 'Career Guidance Counselor', priority: 152, level: 4, is_leadership: false, department: 'ACADEMIC' },
      { title: 'Scholarship Coordinator', priority: 153, level: 4, is_leadership: false, department: 'ACADEMIC' },
      { title: 'Academic Planning Specialist', priority: 154, level: 4, is_leadership: false, department: 'ACADEMIC' },

      // Counseling Services
      { title: 'Elementary Counselor (K-5)', priority: 160, level: 3, is_leadership: false, department: 'COUNSELING' },
      { title: 'Middle School Counselor', priority: 161, level: 3, is_leadership: false, department: 'COUNSELING' },
      { title: 'Grade 9 Counselor', priority: 162, level: 3, is_leadership: false, department: 'COUNSELING' },
      { title: 'Grade 10-11 Counselor', priority: 163, level: 3, is_leadership: false, department: 'COUNSELING' },
      { title: 'Grade 11-12 Counselor', priority: 164, level: 3, is_leadership: false, department: 'COUNSELING' },
      { title: 'Elementary Guidance Specialist', priority: 165, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Parent Workshop Coordinator', priority: 166, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Kindergarten Transition Specialist', priority: 167, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Middle School Transition Specialist', priority: 168, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Peer Mediation Coordinator', priority: 169, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Anti-Bullying Specialist', priority: 170, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'College Prep Specialist', priority: 171, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Graduation Requirements Coordinator', priority: 172, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Senior Portfolio Coordinator', priority: 173, level: 4, is_leadership: false, department: 'COUNSELING' },
      { title: 'Transcript Evaluator', priority: 174, level: 4, is_leadership: false, department: 'COUNSELING' },

      { title: 'Social Worker', priority: 180, level: 3, is_leadership: false, department: 'SOCIAL' },
      { title: 'Family Liaison Specialist', priority: 181, level: 4, is_leadership: false, department: 'SOCIAL' },
      { title: 'Community Outreach Coordinator', priority: 182, level: 4, is_leadership: false, department: 'SOCIAL' },
      { title: 'Home-School Connector', priority: 183, level: 4, is_leadership: false, department: 'SOCIAL' },
      { title: 'Resource Coordinator', priority: 184, level: 4, is_leadership: false, department: 'SOCIAL' },

      { title: 'Elementary Behavioral Specialist', priority: 190, level: 3, is_leadership: false, department: 'BEHAVIOR' },
      { title: 'Middle School Behavioral Specialist', priority: 191, level: 3, is_leadership: false, department: 'BEHAVIOR' },
      { title: 'High School Behavioral Specialist', priority: 192, level: 3, is_leadership: false, department: 'BEHAVIOR' },
      { title: 'Behavior Intervention Specialist', priority: 193, level: 4, is_leadership: false, department: 'BEHAVIOR' },
      { title: 'Positive Behavior Support Coordinator', priority: 194, level: 4, is_leadership: false, department: 'BEHAVIOR' },
      { title: 'Conflict Resolution Specialist', priority: 195, level: 4, is_leadership: false, department: 'BEHAVIOR' },

      { title: 'School Psychologist', priority: 200, level: 3, is_leadership: false, department: 'PSYCH' },
      { title: 'Psychological Assessment Specialist', priority: 201, level: 4, is_leadership: false, department: 'PSYCH' },
      { title: 'Mental Health Counselor', priority: 202, level: 4, is_leadership: false, department: 'PSYCH' },
      { title: 'Crisis Response Team Member', priority: 203, level: 4, is_leadership: false, department: 'PSYCH' },

      // Special Education
      { title: 'Director of Special Education', priority: 210, level: 2, is_leadership: true, department: 'SPED' },
      { title: 'Special Education Teacher', priority: 211, level: 3, is_leadership: false, department: 'SPED' },
      { title: 'IEP Coordinator', priority: 212, level: 3, is_leadership: false, department: 'SPED' },
      { title: '504 Plan Coordinator', priority: 213, level: 3, is_leadership: false, department: 'SPED' },
      { title: 'Resource Room Teacher', priority: 214, level: 4, is_leadership: false, department: 'SPED' },
      { title: 'Inclusion Support Teacher', priority: 215, level: 4, is_leadership: false, department: 'SPED' },
      { title: 'Speech-Language Pathologist', priority: 216, level: 4, is_leadership: false, department: 'SPED' },
      { title: 'Occupational Therapist', priority: 217, level: 4, is_leadership: false, department: 'SPED' },
      { title: 'Physical Therapist', priority: 218, level: 4, is_leadership: false, department: 'SPED' },
      { title: 'Transition Coordinator', priority: 219, level: 4, is_leadership: false, department: 'SPED' },
      { title: 'Assistive Technology Specialist', priority: 220, level: 4, is_leadership: false, department: 'SPED' },

      // Administrative Support & Services
      { title: 'Head of Security', priority: 230, level: 3, is_leadership: true, department: 'SECURITY' },
      { title: 'Security Officer', priority: 231, level: 4, is_leadership: false, department: 'SECURITY' },
      { title: 'Emergency Response Coordinator', priority: 232, level: 4, is_leadership: false, department: 'SECURITY' },
      { title: 'Safety Drill Coordinator', priority: 233, level: 4, is_leadership: false, department: 'SECURITY' },
      { title: 'Campus Monitor', priority: 234, level: 4, is_leadership: false, department: 'SECURITY' },

      { title: 'Main Office Secretary', priority: 240, level: 3, is_leadership: false, department: 'ADMIN' },
      { title: 'Student Records Clerk', priority: 241, level: 4, is_leadership: false, department: 'ADMIN' },
      { title: 'Reception Coordinator', priority: 242, level: 4, is_leadership: false, department: 'ADMIN' },
      { title: 'Phone Operator', priority: 243, level: 4, is_leadership: false, department: 'ADMIN' },
      { title: 'Visitor Management Coordinator', priority: 244, level: 4, is_leadership: false, department: 'ADMIN' },

      { title: 'Chronic Absenteeism Specialist', priority: 250, level: 3, is_leadership: false, department: 'ATTEND' },
      { title: 'Attendance Coordinator', priority: 251, level: 4, is_leadership: false, department: 'ATTEND' },
      { title: 'Truancy Prevention Specialist', priority: 252, level: 4, is_leadership: false, department: 'ATTEND' },
      { title: 'Parent Outreach Coordinator', priority: 253, level: 4, is_leadership: false, department: 'ATTEND' },

      { title: 'Executive Administrative Assistant', priority: 260, level: 3, is_leadership: false, department: 'EXEC-SUPPORT' },
      { title: 'Calendar Coordinator', priority: 261, level: 4, is_leadership: false, department: 'EXEC-SUPPORT' },
      { title: 'Meeting Coordinator', priority: 262, level: 4, is_leadership: false, department: 'EXEC-SUPPORT' },
      { title: 'Executive Communications Specialist', priority: 263, level: 4, is_leadership: false, department: 'EXEC-SUPPORT' },

      // Business & Finance Details
      { title: 'Business Specialist (Grants)', priority: 270, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Grant Writer', priority: 271, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Federal Funding Coordinator', priority: 272, level: 4, is_leadership: false, department: 'BF' },
      { title: 'State Funding Coordinator', priority: 273, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Foundation Relations Specialist', priority: 274, level: 4, is_leadership: false, department: 'BF' },

      { title: 'Purchasing Specialist', priority: 280, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Procurement Coordinator', priority: 281, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Vendor Relations Manager', priority: 282, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Inventory Coordinator', priority: 283, level: 4, is_leadership: false, department: 'BF' },

      { title: 'Accounts Payable Specialist', priority: 290, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Invoice Processing Clerk', priority: 291, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Vendor Payment Coordinator', priority: 292, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Financial Records Clerk', priority: 293, level: 4, is_leadership: false, department: 'BF' },

      { title: 'Registrar & Data Management Specialist', priority: 300, level: 3, is_leadership: false, department: 'BF' },
      { title: 'Student Information System Manager', priority: 301, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Transcript Coordinator', priority: 302, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Enrollment Coordinator', priority: 303, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Data Entry Specialist', priority: 304, level: 4, is_leadership: false, department: 'BF' },
      { title: 'Records Compliance Officer', priority: 305, level: 4, is_leadership: false, department: 'BF' },

      { title: 'HR Payroll & Benefits Specialist', priority: 310, level: 3, is_leadership: false, department: 'HR' },
      { title: 'HR Specialist', priority: 311, level: 3, is_leadership: false, department: 'HR' },
      { title: 'Payroll Processor', priority: 312, level: 4, is_leadership: false, department: 'HR' },
      { title: 'Benefits Administrator', priority: 313, level: 4, is_leadership: false, department: 'HR' },
      { title: 'Time & Attendance Coordinator', priority: 314, level: 4, is_leadership: false, department: 'HR' },
      { title: 'Recruitment Coordinator', priority: 315, level: 4, is_leadership: false, department: 'HR' },
      { title: 'Employee Relations Specialist', priority: 316, level: 4, is_leadership: false, department: 'HR' },
      { title: 'Professional Development Coordinator', priority: 317, level: 4, is_leadership: false, department: 'HR' },
      { title: 'New Employee Orientation Coordinator', priority: 318, level: 4, is_leadership: false, department: 'HR' },

      // Health Services
      { title: 'Main School Nurse', priority: 320, level: 3, is_leadership: false, department: 'HEALTH' },
      { title: 'Assistant School Nurse', priority: 321, level: 4, is_leadership: false, department: 'HEALTH' },
      { title: 'Elementary School Nurse', priority: 322, level: 4, is_leadership: false, department: 'HEALTH' },
      { title: 'Health Records Coordinator', priority: 323, level: 4, is_leadership: false, department: 'HEALTH' },
      { title: 'Medication Administrator', priority: 324, level: 4, is_leadership: false, department: 'HEALTH' },
      { title: 'Health Education Specialist', priority: 325, level: 4, is_leadership: false, department: 'HEALTH' },
      { title: 'First Aid Coordinator', priority: 326, level: 4, is_leadership: false, department: 'HEALTH' },
      { title: 'Chronic Condition Manager', priority: 327, level: 4, is_leadership: false, department: 'HEALTH' },

      // Information Technology
      { title: 'IT Manager', priority: 330, level: 3, is_leadership: true, department: 'IT' },
      { title: 'IT Specialist', priority: 331, level: 3, is_leadership: false, department: 'IT' },
      { title: 'Network Administrator', priority: 332, level: 4, is_leadership: false, department: 'IT' },
      { title: 'System Administrator', priority: 333, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Database Administrator', priority: 334, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Cybersecurity Coordinator', priority: 335, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Help Desk Technician', priority: 336, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Hardware Support Specialist', priority: 337, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Software Support Specialist', priority: 338, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Educational Technology Specialist', priority: 339, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Device Management Coordinator', priority: 340, level: 4, is_leadership: false, department: 'IT' },
      { title: 'Network Technician', priority: 341, level: 4, is_leadership: false, department: 'IT' }
    ];

    const createdRoles = {};
    for (const role of roles) {
      const roleRecord = await prisma.role.upsert({
        where: { title: role.title },
        update: {},
        create: {
          title: role.title,
          priority: role.priority,
          level: role.level,
          is_leadership: role.is_leadership,
          department_id: createdDepartments[role.department].id
        }
      });
      createdRoles[role.title] = roleRecord;
    }

    console.log(`✅ Created ${roles.length} roles`);

    // 5. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@cjcp.edu' },
      update: {},
      create: {
        email: 'admin@cjcp.edu',
        name: 'System Administrator',
        hashedPassword,
        emailVerified: new Date(),
        is_admin: true
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

    // 6. Create Staff Records for Key Personnel
    const keyPersonnel = [
      { name: 'Dr. Sercan', email: 'sercan@cjcp.edu', role: 'Chief Education Officer (CEO)', staffId: 'CEO001' },
      { name: 'Ms. Amin', email: 'amin@cjcp.edu', role: 'Director of Operations', staffId: 'OPS001' },
      { name: 'Mr. Anar', email: 'anar@cjcp.edu', role: 'Business Administrator', staffId: 'BF001' },
      { name: 'Ms. Daubon', email: 'daubon@cjcp.edu', role: 'Assistant Business Administrator', staffId: 'BF002' },
      { name: 'Ms. Thomas', email: 'thomas@cjcp.edu', role: 'Director of Curriculum - Humanities', staffId: 'HUM001' },
      { name: 'Ms. Brown', email: 'brown@cjcp.edu', role: 'Director of Curriculum - STEM', staffId: 'STEM001' },
      { name: 'Ms. Mignogno', email: 'mignogno@cjcp.edu', role: 'Supervisors - Curriculum/Professional Development', staffId: 'CURR001' },
      { name: 'Ms. Kaeli', email: 'kaeli@cjcp.edu', role: 'Director of Accountability', staffId: 'ASSESS001' },
      { name: 'Ms. Firsichbaum', email: 'firsichbaum@cjcp.edu', role: 'Elementary Supervisor', staffId: 'ELEM001' },
      { name: 'Ms. Gettelfinger', email: 'gettelfinger@cjcp.edu', role: 'Elementary Coach', staffId: 'COACH001' },
      { name: 'Dr. Mathews', email: 'mathews@cjcp.edu', role: 'US Supervisor - Humanities', staffId: 'USHUM001' },
      { name: 'Ms. Gibbs', email: 'gibbs@cjcp.edu', role: 'US Supervisor - Electives', staffId: 'USELEC001' },
      { name: 'Mr. Bright', email: 'bright@cjcp.edu', role: 'Director of Student Support Services', staffId: 'SUPPORT001' },
      { name: 'Ms. Grossmann', email: 'grossmann@cjcp.edu', role: 'Assistant Director of Student Support Services', staffId: 'SUPPORT002' },
      { name: 'Ms. Keskin', email: 'keskin@cjcp.edu', role: 'Academic Counselor', staffId: 'ACAD001' },
      { name: 'Ms. Neval', email: 'neval@cjcp.edu', role: 'Academic Counselor', staffId: 'ACAD002' },
      { name: 'Ms. Alvarez', email: 'alvarez@cjcp.edu', role: 'Elementary Counselor (K-5)', staffId: 'COUNS001' },
      { name: 'Ms. Hauser', email: 'hauser@cjcp.edu', role: 'Middle School Counselor', staffId: 'COUNS002' },
      { name: 'Ms. Cerone', email: 'cerone@cjcp.edu', role: 'Middle School Counselor', staffId: 'COUNS003' },
      { name: 'Ms. Dobrin', email: 'dobrin@cjcp.edu', role: 'Grade 9 Counselor', staffId: 'COUNS004' },
      { name: 'Ms. Barkohani', email: 'barkohani@cjcp.edu', role: 'Grade 10-11 Counselor', staffId: 'COUNS005' },
      { name: 'Ms. Mladenovic', email: 'mladenovic@cjcp.edu', role: 'Grade 11-12 Counselor', staffId: 'COUNS006' },
      { name: 'Ms. Tadros', email: 'tadros@cjcp.edu', role: 'Social Worker', staffId: 'SOCIAL001' },
      { name: 'Ms. Simon', email: 'simon@cjcp.edu', role: 'Social Worker', staffId: 'SOCIAL002' },
      { name: 'Ms. Orhan', email: 'orhan@cjcp.edu', role: 'Social Worker', staffId: 'SOCIAL003' },
      { name: 'Ms. Jacobs', email: 'jacobs@cjcp.edu', role: 'Middle School Behavioral Specialist', staffId: 'BEHAV001' },
      { name: 'Ms. Keating', email: 'keating@cjcp.edu', role: 'School Psychologist', staffId: 'PSYCH001' },
      { name: 'Dr. Vesper', email: 'vesper@cjcp.edu', role: 'Director of Special Education', staffId: 'SPED001' },
      { name: 'Mr. Tempalsky', email: 'tempalsky@cjcp.edu', role: 'Head of Security', staffId: 'SEC001' },
      { name: 'Ms. Salley', email: 'salley@cjcp.edu', role: 'Main Office Secretary', staffId: 'ADMIN001' },
      { name: 'Ms. Espinoza', email: 'espinoza@cjcp.edu', role: 'Main Office Secretary', staffId: 'ADMIN002' },
      { name: 'Ms. Raybon', email: 'raybon@cjcp.edu', role: 'Chronic Absenteeism Specialist', staffId: 'ATTEND001' },
      { name: 'Ms. Mercedes', email: 'mercedes@cjcp.edu', role: 'Executive Administrative Assistant', staffId: 'EXEC001' },
      { name: 'Ms. Meyer', email: 'meyer@cjcp.edu', role: 'Business Specialist (Grants)', staffId: 'GRANTS001' },
      { name: 'Ms. Ramos', email: 'ramos@cjcp.edu', role: 'Purchasing Specialist', staffId: 'PURCH001' },
      { name: 'Ms. Mancuso', email: 'mancuso@cjcp.edu', role: 'Accounts Payable Specialist', staffId: 'AP001' },
      { name: 'Ms. Pagliuca', email: 'pagliuca@cjcp.edu', role: 'Registrar & Data Management Specialist', staffId: 'REG001' },
      { name: 'Ms. Goldstein', email: 'goldstein@cjcp.edu', role: 'HR Payroll & Benefits Specialist', staffId: 'HR001' },
      { name: 'Ms. LaLindez', email: 'lalindez@cjcp.edu', role: 'HR Specialist', staffId: 'HR002' },
      { name: 'Ms. Querijero', email: 'querijero@cjcp.edu', role: 'Main School Nurse', staffId: 'NURSE001' },
      { name: 'Ms. Montgomery', email: 'montgomery@cjcp.edu', role: 'Assistant School Nurse', staffId: 'NURSE002' },
      { name: 'Ms. Antonacci', email: 'antonacci@cjcp.edu', role: 'Elementary School Nurse', staffId: 'NURSE003' },
      { name: 'Mr. Tayfur', email: 'tayfur@cjcp.edu', role: 'IT Manager', staffId: 'IT001' },
      { name: 'Mr. Kahraman', email: 'kahraman@cjcp.edu', role: 'IT Manager', staffId: 'IT002' },
      { name: 'Mr. Daryl', email: 'daryl@cjcp.edu', role: 'IT Specialist', staffId: 'IT003' },
      { name: 'Ms. Bibiana', email: 'bibiana@cjcp.edu', role: 'IT Specialist', staffId: 'IT004' },
      { name: 'Mr. Ahmet', email: 'ahmet@cjcp.edu', role: 'IT Specialist', staffId: 'IT005' },
      { name: 'Mr. Mert', email: 'mert@cjcp.edu', role: 'IT Specialist', staffId: 'IT006' }
    ];

    // Create staff records
    for (const person of keyPersonnel) {
      // Create user if doesn't exist
      const user = await prisma.user.upsert({
        where: { email: person.email },
        update: {},
        create: {
          email: person.email,
          name: person.name,
          staff_id: person.staffId,
          emailVerified: new Date()
        }
      });

      // Check if staff record exists
      const existingStaff = await prisma.staff.findFirst({
        where: { user_id: user.id }
      });

      if (!existingStaff) {
        // Create staff record
        const staff = await prisma.staff.create({
          data: {
            user_id: user.id,
            role_id: createdRoles[person.role].id,
            department_id: createdRoles[person.role].department_id,
            school_id: school.id,
            district_id: district.id
          }
        });
        console.log(`✅ Created staff record for ${person.name} (${person.role})`);
      } else {
        console.log(`⏭️  Staff record already exists for ${person.name}`);
      }
    }

    // Create admin staff record if doesn't exist
    const existingAdminStaff = await prisma.staff.findFirst({
      where: { user_id: adminUser.id }
    });

    if (!existingAdminStaff) {
      const adminStaff = await prisma.staff.create({
        data: {
          user_id: adminUser.id,
          role_id: createdRoles['Chief Education Officer (CEO)'].id,
          department_id: createdDepartments['EXEC'].id,
          school_id: school.id,
          district_id: district.id
        }
      });
      console.log('✅ Admin staff record created');
    } else {
      console.log('⏭️  Admin staff record already exists');
    }

    console.log('\n🎉 CJCP Somerset hierarchy setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- District: ${district.name}`);
    console.log(`- School: ${school.name}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Roles: ${roles.length}`);
    console.log(`- Key Personnel: ${keyPersonnel.length}`);
    console.log(`- Admin User: ${adminUser.email} (password: admin123)`);

  } catch (error) {
    console.error('❌ Error setting up hierarchy:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupCJCPHierarchy().catch(console.error); 