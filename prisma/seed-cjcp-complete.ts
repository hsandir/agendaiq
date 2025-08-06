import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CJCP Somerset Complete Database...');

  // Create District and School
  const district = await prisma.district.create({
    data: {
      name: 'CJCP Somerset',
      code: 'CJCPS',
      address: 'Somerset, NJ',
    },
  });

  const school = await prisma.school.create({
    data: {
      name: 'CJCP Somerset Campus',
      code: 'CJCPS-SOM',
      address: 'Somerset, NJ',
      district_id: district.id,
    },
  });

  // Create all departments
  const departments = await createDepartments(school.id);
  
  // Create all roles
  const roles = await createRoles(departments);
  
  // Create all users and staff
  const { users, staff } = await createUsersAndStaff(roles, departments, school.id, district.id);
  
  // Create role hierarchies
  const hierarchies = await createRoleHierarchies(roles);

  console.log('✅ CJCP Somerset Complete Database Seeded!');
  console.log(`📊 Created:`);
  console.log(`   - 1 District: ${district.name}`);
  console.log(`   - 1 School: ${school.name}`);
  console.log(`   - ${departments.length} Departments`);
  console.log(`   - ${roles.length} Roles`);
  console.log(`   - ${users.length} Users`);
  console.log(`   - ${staff.length} Staff members`);
  console.log(`   - ${hierarchies.length} Role hierarchy relationships`);
}

async function createDepartments(schoolId: number) {
  const departments = [
    // Level 0
    { code: 'SYS', name: 'System Management', category: 'Administration', level: 0 },
    // Level 1
    { code: 'EXEC', name: 'Executive Leadership', category: 'Administration', level: 1 },
    // Level 2
    { code: 'OPS', name: 'Operations', category: 'Administration', level: 2 },
    { code: 'BUS', name: 'Business & Finance', category: 'Administration', level: 2 },
    { code: 'HUM', name: 'Humanities', category: 'Academic', level: 2 },
    { code: 'STEM', name: 'STEM', category: 'Academic', level: 2 },
    { code: 'CURR', name: 'Curriculum Development', category: 'Academic', level: 2 },
    { code: 'ASSESS', name: 'Assessment & Accountability', category: 'Academic', level: 2 },
    { code: 'SUPPORT', name: 'Student Support', category: 'Student Services', level: 2 },
    { code: 'SPED', name: 'Special Education', category: 'Student Services', level: 2 },
    // Level 3
    { code: 'ELEM', name: 'Elementary Education', category: 'Academic', level: 3 },
    { code: 'ELEM_COACH', name: 'Elementary Coaching', category: 'Academic', level: 3 },
    { code: 'US_HUM', name: 'Upper School Humanities', category: 'Academic', level: 3 },
    { code: 'US_STEM', name: 'Upper School STEM', category: 'Academic', level: 3 },
    { code: 'ELECTIVES', name: 'Electives & Arts', category: 'Academic', level: 3 },
    { code: 'SEC', name: 'Security & Safety', category: 'Administration', level: 3 },
    { code: 'ADMIN_SUPPORT', name: 'Administrative Support', category: 'Administration', level: 3 },
    { code: 'ATTENDANCE', name: 'Attendance Services', category: 'Administration', level: 3 },
    { code: 'EXEC_SUPPORT', name: 'Executive Support', category: 'Administration', level: 3 },
    { code: 'GRANTS', name: 'Grants & Funding', category: 'Finance', level: 3 },
    { code: 'PURCHASE', name: 'Purchasing', category: 'Finance', level: 3 },
    { code: 'AP', name: 'Accounts Payable', category: 'Finance', level: 3 },
    { code: 'DATA', name: 'Data Management', category: 'Administration', level: 3 },
    { code: 'HR', name: 'Human Resources', category: 'Administration', level: 3 },
    { code: 'HEALTH', name: 'Health Services', category: 'Student Services', level: 3 },
    { code: 'IT', name: 'Information Technology', category: 'Administration', level: 3 },
  ];

  return Promise.all(
    departments.map(dept => 
      prisma.department.create({
        data: {
          code: dept.code,
          name: dept.name,
          category: dept.category,
          level: dept.level,
          school_id: schoolId,
        },
      })
    )
  );
}

async function createRoles(departments: any[]) {
  const roles = [
    // Level 0 - System Administrator
    {
      title: 'System Administrator',
      priority: 0,
      level: 0,
      is_leadership: true,
      is_supervisor: true,
      extension: '9999',
      room: 'Server Room',
      department_code: 'SYS',
    },
    // Level 1 - Chief Education Officer
    {
      title: 'Chief Education Officer',
      priority: 1,
      level: 1,
      is_leadership: true,
      is_supervisor: true,
      extension: '1001',
      room: '501',
      department_code: 'EXEC',
    },
    // Level 2 - Directors
    {
      title: 'Director of Operations',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1125',
      room: '125',
      department_code: 'OPS',
    },
    {
      title: 'Business Administrator',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      department_code: 'BUS',
    },
    {
      title: 'Assistant Business Administrator',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1509',
      room: '3rd Floor',
      department_code: 'BUS',
    },
    {
      title: 'Director of Curriculum - Humanities',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1124',
      room: '124',
      department_code: 'HUM',
    },
    {
      title: 'Director of Curriculum - STEM',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1126',
      room: '126',
      department_code: 'STEM',
    },
    {
      title: 'Supervisors - Curriculum/Professional Development',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1127',
      room: '127',
      department_code: 'CURR',
    },
    {
      title: 'Director of Accountability',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1696',
      room: '130',
      department_code: 'ASSESS',
    },
    {
      title: 'Director of Student Support Services',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1105',
      room: '105',
      department_code: 'SUPPORT',
    },
    {
      title: 'Assistant Director of Student Support Services',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1201',
      room: '201',
      department_code: 'SUPPORT',
    },
    {
      title: 'Director of Special Education',
      priority: 2,
      level: 2,
      is_leadership: true,
      is_supervisor: true,
      extension: '1695',
      room: '130',
      department_code: 'SPED',
    },
    // Level 3 - Supervisors
    {
      title: 'Elementary Supervisor',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      extension: '1122',
      room: '122',
      department_code: 'ELEM',
    },
    {
      title: 'Elementary Coach',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      extension: '1131',
      room: '131',
      department_code: 'ELEM_COACH',
    },
    {
      title: 'US Supervisor - Humanities',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      department_code: 'US_HUM',
    },
    {
      title: 'US Supervisor - STEM',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      extension: '1126',
      room: '126',
      department_code: 'US_STEM',
    },
    {
      title: 'US Supervisor - Electives',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      department_code: 'ELECTIVES',
    },
    {
      title: 'Head of Security',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      extension: '1101',
      room: '101',
      department_code: 'SEC',
    },
    {
      title: 'School Secretary',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1100',
      room: 'Main Office',
      department_code: 'ADMIN_SUPPORT',
    },
    {
      title: 'Chronic Absenteeism Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1702',
      room: 'Main Office',
      department_code: 'ATTENDANCE',
    },
    {
      title: 'Executive Administrative Assistant',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1508',
      room: '3rd Floor',
      department_code: 'EXEC_SUPPORT',
    },
    {
      title: 'Business Specialist (Grants)',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1503',
      room: '3rd Floor',
      department_code: 'GRANTS',
    },
    {
      title: 'Purchasing Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1501',
      room: '3rd Floor',
      department_code: 'PURCHASE',
    },
    {
      title: 'Accounts Payable Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1502',
      room: '3rd Floor',
      department_code: 'AP',
    },
    {
      title: 'Registrar & Data Management Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1506',
      room: '3rd Floor',
      department_code: 'DATA',
    },
    {
      title: 'HR Payroll & Benefits Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1504',
      room: '3rd Floor',
      department_code: 'HR',
    },
    {
      title: 'HR Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1507',
      room: '3rd Floor',
      department_code: 'HR',
    },
    {
      title: 'School Nurse',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1694',
      room: '630',
      department_code: 'HEALTH',
    },
    {
      title: 'IT Manager',
      priority: 3,
      level: 3,
      is_leadership: true,
      is_supervisor: true,
      extension: '1650',
      room: '600 hw',
      department_code: 'IT',
    },
    {
      title: 'IT Specialist',
      priority: 3,
      level: 3,
      is_leadership: false,
      is_supervisor: false,
      extension: '1652',
      room: '200 hw',
      department_code: 'IT',
    },
    // Level 4 - Staff
    {
      title: 'Academic Counselor',
      priority: 4,
      level: 4,
      is_leadership: false,
      is_supervisor: false,
      extension: '1697',
      room: '634',
      department_code: 'SUPPORT',
    },
    {
      title: 'School Counselor',
      priority: 4,
      level: 4,
      is_leadership: false,
      is_supervisor: false,
      extension: '1103',
      room: '104',
      department_code: 'SUPPORT',
    },
    {
      title: 'Social Worker',
      priority: 4,
      level: 4,
      is_leadership: false,
      is_supervisor: false,
      extension: '1104',
      room: '104',
      department_code: 'SUPPORT',
    },
    {
      title: 'Behavioral Specialist',
      priority: 4,
      level: 4,
      is_leadership: false,
      is_supervisor: false,
      extension: '1701',
      room: 'TBD',
      department_code: 'SUPPORT',
    },
    {
      title: 'School Psychologist',
      priority: 4,
      level: 4,
      is_leadership: false,
      is_supervisor: false,
      extension: '1704',
      room: '123',
      department_code: 'SUPPORT',
    },
    {
      title: 'Teacher',
      priority: 4,
      level: 4,
      is_leadership: false,
      is_supervisor: false,
      department_code: 'HUM',
    },
  ];

  return Promise.all(
    roles.map(role => {
      const department = departments.find(d => d.code === role.department_code);
      return prisma.role.create({
        data: {
          title: role.title,
          priority: role.priority,
          level: role.level,
          is_leadership: role.is_leadership,
          is_supervisor: role.is_supervisor,
          extension: role.extension,
          room: role.room,
          department_id: department?.id,
        },
      });
    })
  );
}

async function createUsersAndStaff(roles: any[], departments: any[], schoolId: number, districtId: number) {
  const hashedPassword = await hash('password123', 12);

  // Define all users from the hierarchy
  const userData = [
    // System Administrator
    { email: 'sysadmin@cjcollegeprep.org', name: 'System Administrator', role: 'System Administrator' },
    
    // Level 1 - CEO
    { email: 'nsercan@cjcollegeprep.org', name: 'Dr. Namik Sercan', role: 'Chief Education Officer' },
    
    // Level 2 - Directors
    { email: 'namin@cjcollegeprep.org', name: 'Ms. Nima Amin', role: 'Director of Operations' },
    { email: 'manar@cjcollegeprep.org', name: 'Mr. Anar', role: 'Business Administrator' },
    { email: 'sba@cjcollegeprep.org', name: 'Ms. Daubon', role: 'Assistant Business Administrator' },
    { email: 'cthomas@cjcollegeprep.org', name: 'Ms. Thomas', role: 'Director of Curriculum - Humanities' },
    { email: 'fbrown@cjcollegeprep.org', name: 'Ms. Brown', role: 'Director of Curriculum - STEM' },
    { email: 'lmignogno@cjcollegeprep.org', name: 'Ms. Mignogno', role: 'Supervisors - Curriculum/Professional Development' },
    { email: 'skaeli@cjcollegeprep.org', name: 'Ms. Kaeli', role: 'Director of Accountability' },
    { email: 'vsuslu@cjcollegeprep.org', name: 'Mr. Bright', role: 'Director of Student Support Services' },
    { email: 'bgrossmann@cjcollegeprep.org', name: 'Ms. Grossmann', role: 'Assistant Director of Student Support Services' },
    { email: 'dvesper@cjcollegeprep.org', name: 'Dr. Vesper', role: 'Director of Special Education' },
    
    // Level 3 - Supervisors
    { email: 'mfirsichbaum@cjcollegeprep.org', name: 'Ms. Firsichbaum', role: 'Elementary Supervisor' },
    { email: 'amygettelfinger@cjcollegeprep.org', name: 'Ms. Gettelfinger', role: 'Elementary Coach' },
    { email: 'cmathews@cjcollegeprep.org', name: 'Dr. Mathews', role: 'US Supervisor - Humanities' },
    { email: 'fbarker@cjcollegeprep.org', name: 'Ms. Brown', role: 'US Supervisor - STEM' },
    { email: 'mgibbs@cjcollegeprep.org', name: 'Ms. Gibbs', role: 'US Supervisor - Electives' },
    { email: 'ktemplasky@cjcollegeprep.org', name: 'Mr. Tempalsky', role: 'Head of Security' },
    { email: 'tsalley@cjcollegeprep.org', name: 'Ms. Salley', role: 'School Secretary' },
    { email: 'pespinoza@cjcollegeprep.org', name: 'Ms. Espinoza', role: 'School Secretary' },
    { email: 'braybon@cjcollegeprep.org', name: 'Ms. Raybon', role: 'Chronic Absenteeism Specialist' },
    { email: 'kmercedes@cjcollegeprep.org', name: 'Ms. Mercedes', role: 'Executive Administrative Assistant' },
    { email: 'smeyer@cjcollegeprep.org', name: 'Ms. Meyer', role: 'Business Specialist (Grants)' },
    { email: 'purchasing@cjcollegeprep.org', name: 'Ms. Ramos', role: 'Purchasing Specialist' },
    { email: 'accountspayable@cjcollegeprep.org', name: 'Ms. Mancuso', role: 'Accounts Payable Specialist' },
    { email: 'cpagliuca@cjcollegeprep.org', name: 'Ms. Pagliuca', role: 'Registrar & Data Management Specialist' },
    { email: 'hr@cjcollegeprep.org', name: 'Ms. Goldstein', role: 'HR Payroll & Benefits Specialist' },
    { email: 'hrdept@cjcollegeprep.org', name: 'Ms. LaLindez', role: 'HR Specialist' },
    { email: 'cquerijero@cjcollegeprep.org', name: 'Ms. Querijero', role: 'School Nurse' },
    { email: 'mmontgomery@cjcollegeprep.org', name: 'Ms. Montgomery', role: 'School Nurse' },
    { email: 'jantonacci@cjcollegeprep.org', name: 'Ms. Antonacci', role: 'School Nurse' },
    { email: 'stayfur@cjcollegeprep.org', name: 'Mr. Tayfur', role: 'IT Manager' },
    { email: 'akahraman@cjcollegeprep.org', name: 'Mr. Kahraman', role: 'IT Manager' },
    { email: 'dcua@cjcollegeprep.org', name: 'Mr. Daryl', role: 'IT Specialist' },
    { email: 'bagudelo@cjcollegeprep.org', name: 'Ms. Bibiana', role: 'IT Specialist' },
    { email: 'abicer@cjcollegeprep.org', name: 'Mr. Ahmet', role: 'IT Specialist' },
    { email: 'myilmaz@cjcollegeprep.org', name: 'Mr. Mert', role: 'IT Specialist' },
    
    // Level 4 - Counselors and Support
    { email: 'skeskin@cjcollegeprep.org', name: 'Ms. Keskin', role: 'Academic Counselor' },
    { email: 'ninanir@cjcollegeprep.org', name: 'Ms. Neval', role: 'Academic Counselor' },
    { email: 'palvarez@cjcollegeprep.org', name: 'Ms. Alvarez', role: 'School Counselor' },
    { email: 'ahauser@cjcollegeprep.org', name: 'Ms. Hauser', role: 'School Counselor' },
    { email: 'scerone@cjcollegeprep.org', name: 'Ms. Cerone', role: 'School Counselor' },
    { email: 'ldobrin@cjcollegeprep.org', name: 'Ms. Dobrin', role: 'School Counselor' },
    { email: 'kbarkohani@cjcollegeprep.org', name: 'Ms. Barkohani', role: 'School Counselor' },
    { email: 'imlladenovic@cjcollegeprep.org', name: 'Ms. Mladenovic', role: 'School Counselor' },
    { email: 'jtadros@cjcollegeprep.org', name: 'Ms. Tadros', role: 'Social Worker' },
    { email: 'asimon@cjcollegeprep.org', name: 'Ms. Simon', role: 'Social Worker' },
    { email: 'rorhan@cjcollegeprep.org', name: 'Ms. Orhan', role: 'Social Worker' },
    { email: 'djacobs@cjcollegeprep.org', name: 'Ms. Jacobs', role: 'Behavioral Specialist' },
    { email: 'ekeating@cjcollegeprep.org', name: 'Ms. Keating', role: 'School Psychologist' },
  ];

  // Create users
  const users = await Promise.all(
    userData.map(user => 
      prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          hashedPassword,
          is_admin: user.role === 'System Administrator' || user.role === 'Chief Education Officer',
        },
      })
    )
  );

  // Create staff records
  const staff = await Promise.all(
    userData.map((user, index) => {
      const role = roles.find(r => r.title === user.role);
      const department = role ? departments.find(d => d.id === role.department_id) : null;
      
      return prisma.staff.create({
        data: {
          user_id: users[index].id,
          department_id: department?.id || departments[0].id,
          role_id: role?.id || roles[0].id,
          school_id: schoolId,
          district_id: districtId,
          extension: role?.extension,
          room: role?.room,
          flags: ['active'],
          endorsements: [],
        },
      });
    })
  );

  return { users, staff };
}

async function createRoleHierarchies(roles: any[]) {
  const hierarchies = [
    // System Administrator -> Chief Education Officer
    { parent: 'System Administrator', child: 'Chief Education Officer' },
    // Chief Education Officer -> Directors
    { parent: 'Chief Education Officer', child: 'Director of Operations' },
    { parent: 'Chief Education Officer', child: 'Business Administrator' },
    { parent: 'Chief Education Officer', child: 'Director of Curriculum - Humanities' },
    { parent: 'Chief Education Officer', child: 'Director of Curriculum - STEM' },
    { parent: 'Chief Education Officer', child: 'Director of Student Support Services' },
    { parent: 'Chief Education Officer', child: 'Director of Special Education' },
    // Director of Operations -> Supervisors
    { parent: 'Director of Operations', child: 'Elementary Supervisor' },
    { parent: 'Director of Operations', child: 'Head of Security' },
    // Business Administrator -> Specialists
    { parent: 'Business Administrator', child: 'Assistant Business Administrator' },
    { parent: 'Business Administrator', child: 'Business Specialist (Grants)' },
    { parent: 'Business Administrator', child: 'Purchasing Specialist' },
    { parent: 'Business Administrator', child: 'Accounts Payable Specialist' },
  ];

  return Promise.all(
    hierarchies.map(hierarchy => {
      const parentRole = roles.find(r => r.title === hierarchy.parent);
      const childRole = roles.find(r => r.title === hierarchy.child);
      
      if (parentRole && childRole) {
        return prisma.roleHierarchy.create({
          data: {
            parent_role_id: parentRole.id,
            child_role_id: childRole.id,
            hierarchy_level: 1,
          },
        });
      }
      return null;
    }).filter(Boolean)
  );
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 