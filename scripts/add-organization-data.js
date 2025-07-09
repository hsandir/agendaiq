const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function addOrganizationData() {
  try {
    console.log('Adding organization data from JSON...');
    
    // Read the JSON file
    const jsonPath = path.join(__dirname, '..', 'organization_structure.json');
    const orgData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Get admin staff info for school reference
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
      include: { 
        staff: {
          include: {
            school: true
          }
        }
      }
    });
    
    if (!adminUser || !adminUser.staff.length) {
      throw new Error('Admin user not found. Cannot proceed without admin user.');
    }
    
    const schoolId = adminUser.staff[0].school_id;
    
    console.log('Adding departments...');
    
    // Add departments from staff_departments array
    const createdDepartments = [];
    for (const dept of orgData.staff_departments) {
      try {
        const department = await prisma.department.create({
          data: {
            code: dept.code,
            name: dept.name,
            school_id: schoolId,
            category: 'Staff'
          }
        });
        createdDepartments.push(department);
        console.log(`✓ Created department: ${dept.name} (${dept.code})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`- Department ${dept.code} already exists, skipping`);
          // Get existing department
          const existing = await prisma.department.findUnique({
            where: { code: dept.code }
          });
          if (existing) {
            createdDepartments.push(existing);
          }
        } else {
          console.error(`Error creating department ${dept.name}:`, error.message);
        }
      }
    }
    
    console.log('Adding roles...');
    
    // Add roles from job_titles array
    let priority = 100; // Start high to avoid conflicts with existing roles
    const createdRoles = [];
    for (const jobTitle of orgData.job_titles) {
      try {
        // Skip if role already exists
        const existingRole = await prisma.role.findFirst({
          where: { title: jobTitle }
        });
        
        if (existingRole) {
          console.log(`- Role "${jobTitle}" already exists, skipping`);
          createdRoles.push(existingRole);
          continue;
        }
        
        // Assign roles to departments based on job title keywords
        let targetDept = createdDepartments.find(d => d.name === 'Professional Staff') || createdDepartments[0];
        
        // Map job titles to appropriate departments
        if (jobTitle.includes('Teacher') || jobTitle.includes('Curriculum') || jobTitle.includes('Instructional')) {
          targetDept = createdDepartments.find(d => d.name.includes('Teachers')) || targetDept;
        } else if (jobTitle.includes('Administrator') || jobTitle.includes('Principal') || jobTitle.includes('Director') || jobTitle.includes('CEO')) {
          targetDept = createdDepartments.find(d => d.name.includes('Principal')) || targetDept;
        } else if (jobTitle.includes('Secretary') || jobTitle.includes('Administrative Assistant')) {
          targetDept = createdDepartments.find(d => d.name.includes('Secretary')) || targetDept;
        } else if (jobTitle.includes('Nurse')) {
          targetDept = createdDepartments.find(d => d.name.includes('Health')) || targetDept;
        } else if (jobTitle.includes('Counselor') || jobTitle.includes('Social Worker') || jobTitle.includes('Psychologist')) {
          targetDept = createdDepartments.find(d => d.name.includes('Guidance')) || targetDept;
        } else if (jobTitle.includes('IT') || jobTitle.includes('Technology')) {
          targetDept = createdDepartments.find(d => d.name.includes('Information Technology')) || targetDept;
        } else if (jobTitle.includes('Business') || jobTitle.includes('Finance')) {
          targetDept = createdDepartments.find(d => d.name.includes('Business')) || targetDept;
        } else if (jobTitle.includes('Custodian') || jobTitle.includes('Maintenance') || jobTitle.includes('Facilities')) {
          targetDept = createdDepartments.find(d => d.name.includes('Buildings')) || targetDept;
        } else if (jobTitle.includes('Bus Driver')) {
          targetDept = createdDepartments.find(d => d.name.includes('Bus')) || targetDept;
        } else if (jobTitle.includes('Security')) {
          targetDept = createdDepartments.find(d => d.name.includes('Security')) || targetDept;
        }
        
        const role = await prisma.role.create({
          data: {
            title: jobTitle,
            priority: priority++,
            department_id: targetDept.id,
            category: 'Staff'
          }
        });
        createdRoles.push(role);
        console.log(`✓ Created role: ${jobTitle} in department: ${targetDept.name}`);
      } catch (error) {
        console.error(`Error creating role ${jobTitle}:`, error.message);
      }
    }
    
    console.log('\nOrganization data import completed successfully!');
    console.log(`📊 Total departments: ${createdDepartments.length}`);
    console.log(`👥 Total roles: ${createdRoles.length}`);
    console.log('🎯 Admin user and existing data preserved');
    
  } catch (error) {
    console.error('Error importing organization data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addOrganizationData(); 