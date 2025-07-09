const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupNestedHierarchy() {
  try {
    console.log('🚀 Setting up nested role hierarchy...');
    
    // Read the nested hierarchy JSON
    const hierarchyPath = path.join(__dirname, '..', 'organization_structure', 'nested_role_hierarchy_final.json');
    const hierarchyData = JSON.parse(fs.readFileSync(hierarchyPath, 'utf8'));
    
    // First, let's create initial data (admin user, school, district, etc.)
    console.log('📊 Creating initial organization structure...');
    
    // Create district
    const district = await prisma.district.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'AgendaIQ School District',
        code: 'AIQSD',
        address: '123 Education Street, Learning City, LC 12345'
      }
    });
    
    // Create school
    const school = await prisma.school.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'AgendaIQ Primary School',
        code: 'AIQPS',
        address: '456 School Avenue, Learning City, LC 12345',
        district_id: district.id
      }
    });
    
    // Create main departments based on hierarchy
    const departments = [
      { code: 'ADMIN', name: 'Administration', category: 'Leadership' },
      { code: 'INSTRUCT', name: 'Instruction', category: 'Academic' },
      { code: 'OPERATIONS', name: 'Operations', category: 'Support' },
      { code: 'STEM', name: 'STEM Department', category: 'Academic' },
      { code: 'HUMANITIES', name: 'Arts & Humanities', category: 'Academic' },
      { code: 'SPECIAL', name: 'Special Programs', category: 'Academic' },
      { code: 'MATH', name: 'Mathematics Department', category: 'Academic' },
      { code: 'SCIENCE', name: 'Science Department', category: 'Academic' },
      { code: 'STEMTECH', name: 'STEM/Technology Department', category: 'Academic' },
      { code: 'LANGARTS', name: 'Language Arts Department', category: 'Academic' },
      { code: 'SOCIAL', name: 'Social Studies Department', category: 'Academic' },
      { code: 'ARTS', name: 'Arts Department', category: 'Academic' },
      { code: 'WORLDLANG', name: 'World Languages Department', category: 'Academic' },
      { code: 'SPED', name: 'Special Education Department', category: 'Academic' },
      { code: 'ESL', name: 'ESL Department', category: 'Academic' },
      { code: 'HR', name: 'Human Resources', category: 'Support' },
      { code: 'FINANCE', name: 'Finance', category: 'Support' },
      { code: 'OFFICE', name: 'Office Administration', category: 'Support' }
    ];
    
    console.log('🏢 Creating departments...');
    const createdDepartments = {};
    for (const dept of departments) {
      const department = await prisma.department.upsert({
        where: { code: dept.code },
        update: { name: dept.name, category: dept.category },
        create: {
          code: dept.code,
          name: dept.name,
          category: dept.category,
          school_id: school.id
        }
      });
      createdDepartments[dept.code] = department;
      console.log(`✅ Created department: ${dept.name}`);
    }
    
    // Create roles with hierarchy
    console.log('👑 Creating hierarchical roles...');
    const roleMapping = {};
    
    // Function to create roles recursively
    async function createRoleHierarchy(roleData, parentId = null, level = 0, departmentCode = 'ADMIN') {
      for (const [roleName, children] of Object.entries(roleData)) {
        // Determine department based on role name
        let deptCode = departmentCode;
        if (roleName.includes('Mathematics')) deptCode = 'MATH';
        else if (roleName.includes('Science')) deptCode = 'SCIENCE';
        else if (roleName.includes('STEM')) deptCode = 'STEMTECH';
        else if (roleName.includes('Language Arts')) deptCode = 'LANGARTS';
        else if (roleName.includes('Social Studies')) deptCode = 'SOCIAL';
        else if (roleName.includes('Arts') && !roleName.includes('Language')) deptCode = 'ARTS';
        else if (roleName.includes('World Languages')) deptCode = 'WORLDLANG';
        else if (roleName.includes('Special Education')) deptCode = 'SPED';
        else if (roleName.includes('ESL')) deptCode = 'ESL';
        else if (roleName.includes('Human Resources')) deptCode = 'HR';
        else if (roleName.includes('Finance')) deptCode = 'FINANCE';
        else if (roleName.includes('Office')) deptCode = 'OFFICE';
        else if (roleName.includes('Operations')) deptCode = 'OPERATIONS';
        else if (roleName.includes('Instruction')) deptCode = 'INSTRUCT';
        
        // Determine if it's a leadership role
        const isLeadership = level <= 2 || roleName.includes('Superintendent') || 
                           roleName.includes('Director') || roleName.includes('Chair') || 
                           roleName.includes('Head') || roleName.includes('Manager') || 
                           roleName.includes('Supervisor');
        
        const role = await prisma.role.upsert({
          where: { title: roleName },
          update: {
            level: level,
            parent_id: parentId,
            is_leadership: isLeadership,
            department_id: createdDepartments[deptCode]?.id || createdDepartments['ADMIN'].id
          },
          create: {
            title: roleName,
            priority: (level * 10) + Object.keys(roleMapping).length,
            category: isLeadership ? 'Leadership' : 'Staff',
            level: level,
            parent_id: parentId,
            is_leadership: isLeadership,
            department_id: createdDepartments[deptCode]?.id || createdDepartments['ADMIN'].id
          }
        });
        
        roleMapping[roleName] = role;
        console.log(`✅ Created role: ${roleName} (Level ${level}, Dept: ${deptCode})`);
        
        // Create hierarchy relationship if there's a parent
        if (parentId) {
          await prisma.roleHierarchy.upsert({
            where: {
              parent_role_id_child_role_id: {
                parent_role_id: parentId,
                child_role_id: role.id
              }
            },
            update: {},
            create: {
              parent_role_id: parentId,
              child_role_id: role.id,
              hierarchy_level: level
            }
          });
        }
        
        // Process children
        if (typeof children === 'object' && !Array.isArray(children)) {
          await createRoleHierarchy(children, role.id, level + 1, deptCode);
        } else if (Array.isArray(children)) {
          // Create leaf roles (teachers)
          for (const teacherRole of children) {
            const teacherRoleObj = await prisma.role.upsert({
              where: { title: teacherRole },
              update: {
                level: level + 1,
                parent_id: role.id,
                is_leadership: false,
                department_id: createdDepartments[deptCode]?.id || createdDepartments['ADMIN'].id
              },
              create: {
                title: teacherRole,
                priority: ((level + 1) * 10) + Object.keys(roleMapping).length,
                category: 'Teacher',
                level: level + 1,
                parent_id: role.id,
                is_leadership: false,
                department_id: createdDepartments[deptCode]?.id || createdDepartments['ADMIN'].id
              }
            });
            
            roleMapping[teacherRole] = teacherRoleObj;
            console.log(`✅ Created teacher role: ${teacherRole} (Level ${level + 1}, Dept: ${deptCode})`);
            
            // Create hierarchy relationship
            await prisma.roleHierarchy.upsert({
              where: {
                parent_role_id_child_role_id: {
                  parent_role_id: role.id,
                  child_role_id: teacherRoleObj.id
                }
              },
              update: {},
              create: {
                parent_role_id: role.id,
                child_role_id: teacherRoleObj.id,
                hierarchy_level: level + 1
              }
            });
          }
        }
      }
    }
    
    // Start creating the hierarchy
    await createRoleHierarchy(hierarchyData);
    
    // Create Administrator role if it doesn't exist
    const adminRole = await prisma.role.upsert({
      where: { title: 'Administrator' },
      update: {},
      create: {
        title: 'Administrator',
        priority: 1,
        category: 'Leadership',
        level: 0,
        is_leadership: true,
        department_id: createdDepartments['ADMIN'].id
      }
    });
    
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@school.edu' },
      update: { name: 'System Administrator' },
      create: {
        email: 'admin@school.edu',
        name: 'System Administrator',
        hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6wE/9qKm4G' // password123
      }
    });
    
    // Create admin staff record
    const existingStaff = await prisma.staff.findFirst({
      where: { user_id: adminUser.id }
    });
    
    if (!existingStaff) {
      await prisma.staff.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id,
          department_id: createdDepartments['ADMIN'].id,
          school_id: school.id,
          district_id: district.id
        }
      });
    }
    
    console.log('\n✨ Nested role hierarchy setup completed!');
    console.log(`📊 Total roles created: ${Object.keys(roleMapping).length + 1}`);
    console.log(`🏢 Total departments: ${Object.keys(createdDepartments).length}`);
    console.log(`👑 Admin user: admin@school.edu (password: password123)`);
    
    // Display hierarchy summary
    console.log('\n📋 Hierarchy Summary:');
    const topLevelRoles = await prisma.role.findMany({
      where: { level: 0 },
      include: {
        Children: {
          include: {
            Children: {
              include: {
                Children: true
              }
            }
          }
        }
      }
    });
    
    function printHierarchy(roles, indent = '') {
      for (const role of roles) {
        console.log(`${indent}${role.title} (Level ${role.level})`);
        if (role.Children && role.Children.length > 0) {
          printHierarchy(role.Children, indent + '  ');
        }
      }
    }
    
    printHierarchy(topLevelRoles);
    
  } catch (error) {
    console.error('❌ Error setting up nested hierarchy:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupNestedHierarchy()
  .then(() => {
    console.log('🎉 Nested hierarchy setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to setup nested hierarchy:', error);
    process.exit(1);
  }); 