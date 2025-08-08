const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateOrganizationStructure() {
  console.log('🚀 Starting organization structure update...');
  
  try {
    // Find admin user first
    const adminUser = await prisma.user.findFirst({
      where: {
        Staff: {
          some: {
            Role: {
              title: 'Administrator'
            }
          }
        }
      },
      include: {
        Staff: {
          include: {
            School: true,
            District: true,
            Role: true
          }
        }
      }
    });

    if (!adminUser || !adminUser.Staff.length) {
      throw new Error('❌ Admin user not found. Cannot proceed without admin user.');
    }

    const schoolId = adminUser.Staff[0].school_id;
    console.log(`✅ Found admin user: ${adminUser.email}`);
    console.log(`🏫 School ID: ${schoolId}`);

    // Organization data based on the JSON schema
    const departments = [
      { name: "Elementary Education Department", code: "ELEM" },
      { name: "Middle School Department", code: "MIDDLE" },
      { name: "High School Department", code: "HIGH" },
      { name: "Mathematics Department", code: "MATH" },
      { name: "Science Department", code: "SCI" },
      { name: "English / Language Arts Department", code: "ELA" },
      { name: "Social Studies Department", code: "SOCIAL" },
      { name: "World Languages Department", code: "LANG" },
      { name: "Arts Department", code: "ARTS" },
      { name: "Physical Education & Health Department", code: "PE" },
      { name: "STEM & Technology Department", code: "STEM" },
      { name: "Special Education Department", code: "SPED" },
      { name: "English as a Second Language (ESL) Department", code: "ESL" },
      { name: "Guidance & Counseling Department", code: "GUID" },
      { name: "Nursing & Health Services", code: "NURSE" },
      { name: "Library & Media Center", code: "LIB" },
      { name: "Academic Intervention Services (AIS)", code: "AIS" },
      { name: "Speech and Language Services", code: "SPEECH" },
      { name: "Psychological Services", code: "PSYCH" },
      { name: "School Leadership – Campus Level", code: "LEAD" },
      { name: "School Leadership – Central Office", code: "CENTRAL" },
      { name: "Department-Level Coordination", code: "COORD" },
      { name: "Curriculum & Instruction", code: "CURR" },
      { name: "Assessment and Data Team", code: "ASSESS" },
      { name: "Facilities & Maintenance", code: "MAINT" },
      { name: "Security", code: "SEC" },
      { name: "Transportation", code: "TRANS" },
      { name: "Food Services", code: "FOOD" },
      { name: "Human Resources", code: "HR" },
      { name: "Finance & Budget", code: "FIN" },
      { name: "Information Technology", code: "IT" },
      { name: "Clerical & Front Office", code: "OFFICE" }
    ];

    const jobTitles = [
      "Superintendent", "Assistant Superintendent", "Principal", "Vice Principal / Assistant Principal",
      "Academic Director", "Department Head", "Grade-Level Coordinator", "Curriculum Coordinator",
      "Assessment Coordinator", "Instructional Coach", "Instructional Supervisor", "STEM Chair",
      "Director of Student Support Services", "Director of Accountability", "Elementary School Teacher",
      "Middle School Teacher", "High School Teacher", "Mathematics Teacher", "Science Teacher",
      "English/Language Arts Teacher", "Social Studies Teacher", "Foreign Language Teacher",
      "Art Teacher", "Music Teacher", "Physical Education Teacher", "Computer Science / Technology Teacher",
      "STEM Integration Teacher", "Special Education Teacher", "ESL Teacher", "In-Class Support Teacher",
      "Substitute Teacher (Fulltime)", "Teaching Assistant", "Intervention Specialist", "School Counselor",
      "Guidance Counselor", "College & Career Counselor", "School Psychologist", "Social Worker",
      "Behavior Interventionist", "Speech-Language Pathologist", "School Nurse", "Librarian / Media Specialist",
      "Library Assistant", "Academic Coach", "Testing Coordinator", "Facilities Manager",
      "Maintenance Technician", "Custodian", "Security Guard", "Safety Coordinator",
      "Transportation Coordinator", "Bus Driver", "Food Services Manager", "Cafeteria Worker",
      "Office Manager", "Registrar", "Administrative Assistant", "Front Desk Secretary",
      "Human Resources Manager", "HR Assistant", "Finance Manager / Accountant", "Bookkeeper",
      "IT Specialist", "Network Administrator", "Data Systems Manager", "Substitute Teacher",
      "Long-term Substitute", "Volunteer Coordinator", "After-School Program Instructor",
      "Summer School Teacher", "Tutor"
    ];

    // First, create/get all departments outside of transaction
    console.log('📊 Creating departments...');
    const createdDepartments = [];
    
    for (const dept of departments) {
      try {
        // Check if department already exists
        const existingDept = await prisma.department.findUnique({
          where: { code: dept.code }
        });
        
        if (existingDept) {
          console.log(`⚠️  Department ${dept.code} already exists, using existing`);
          createdDepartments.push(existingDept);
        } else {
          const department = await prisma.department.create({
            data: {
              code: dept.code,
              name: dept.name,
              school_id: schoolId,
              category: 'Academic'
            }
          });
          createdDepartments.push(department);
          console.log(`✅ Created department: ${dept.name}`);
        }
      } catch (error) {
        console.log(`❌ Error with department ${dept.name}: ${error.message}`);
      }
    }

    // Now create roles in a transaction
    console.log('👥 Creating roles...');
    let priority = 100;
    const createdRoles = [];
    
    for (const jobTitle of jobTitles) {
      try {
        const existingRole = await prisma.role.findFirst({
          where: { title: jobTitle }
        });
        
        if (existingRole) {
          console.log(`⚠️  Role "${jobTitle}" already exists, skipping`);
          continue;
        }
        
        // Find appropriate department
        let targetDept = createdDepartments[0];
        
        if (jobTitle.includes('Elementary')) {
          targetDept = createdDepartments.find(d => d.name.includes('Elementary')) || targetDept;
        } else if (jobTitle.includes('Middle')) {
          targetDept = createdDepartments.find(d => d.name.includes('Middle')) || targetDept;
        } else if (jobTitle.includes('High')) {
          targetDept = createdDepartments.find(d => d.name.includes('High')) || targetDept;
        } else if (jobTitle.includes('Math')) {
          targetDept = createdDepartments.find(d => d.name.includes('Mathematics')) || targetDept;
        } else if (jobTitle.includes('Science')) {
          targetDept = createdDepartments.find(d => d.name.includes('Science')) || targetDept;
        } else if (jobTitle.includes('English')) {
          targetDept = createdDepartments.find(d => d.name.includes('English')) || targetDept;
        } else if (jobTitle.includes('Social')) {
          targetDept = createdDepartments.find(d => d.name.includes('Social')) || targetDept;
        } else if (jobTitle.includes('Language')) {
          targetDept = createdDepartments.find(d => d.name.includes('World Languages')) || targetDept;
        } else if (jobTitle.includes('Art') || jobTitle.includes('Music')) {
          targetDept = createdDepartments.find(d => d.name.includes('Arts')) || targetDept;
        } else if (jobTitle.includes('Physical Education')) {
          targetDept = createdDepartments.find(d => d.name.includes('Physical Education')) || targetDept;
        } else if (jobTitle.includes('STEM') || jobTitle.includes('Technology')) {
          targetDept = createdDepartments.find(d => d.name.includes('STEM')) || targetDept;
        } else if (jobTitle.includes('Special Education')) {
          targetDept = createdDepartments.find(d => d.name.includes('Special Education')) || targetDept;
        } else if (jobTitle.includes('ESL')) {
          targetDept = createdDepartments.find(d => d.name.includes('ESL')) || targetDept;
        } else if (jobTitle.includes('Counselor') || jobTitle.includes('Guidance')) {
          targetDept = createdDepartments.find(d => d.name.includes('Guidance')) || targetDept;
        } else if (jobTitle.includes('Nurse')) {
          targetDept = createdDepartments.find(d => d.name.includes('Nursing')) || targetDept;
        } else if (jobTitle.includes('Librarian')) {
          targetDept = createdDepartments.find(d => d.name.includes('Library')) || targetDept;
        } else if (jobTitle.includes('Speech')) {
          targetDept = createdDepartments.find(d => d.name.includes('Speech')) || targetDept;
        } else if (jobTitle.includes('Psychologist')) {
          targetDept = createdDepartments.find(d => d.name.includes('Psychological')) || targetDept;
        } else if (jobTitle.includes('Principal') || jobTitle.includes('Superintendent') || jobTitle.includes('Director')) {
          targetDept = createdDepartments.find(d => d.name.includes('Leadership')) || targetDept;
        } else if (jobTitle.includes('Maintenance') || jobTitle.includes('Custodian') || jobTitle.includes('Facilities')) {
          targetDept = createdDepartments.find(d => d.name.includes('Facilities')) || targetDept;
        } else if (jobTitle.includes('Security')) {
          targetDept = createdDepartments.find(d => d.name.includes('Security')) || targetDept;
        } else if (jobTitle.includes('Transportation') || jobTitle.includes('Bus')) {
          targetDept = createdDepartments.find(d => d.name.includes('Transportation')) || targetDept;
        } else if (jobTitle.includes('Food') || jobTitle.includes('Cafeteria')) {
          targetDept = createdDepartments.find(d => d.name.includes('Food')) || targetDept;
        } else if (jobTitle.includes('HR') || jobTitle.includes('Human Resources')) {
          targetDept = createdDepartments.find(d => d.name.includes('Human Resources')) || targetDept;
        } else if (jobTitle.includes('Finance') || jobTitle.includes('Accountant') || jobTitle.includes('Bookkeeper')) {
          targetDept = createdDepartments.find(d => d.name.includes('Finance')) || targetDept;
        } else if (jobTitle.includes('IT') || jobTitle.includes('Network') || jobTitle.includes('Data Systems')) {
          targetDept = createdDepartments.find(d => d.name.includes('Information Technology')) || targetDept;
        } else if (jobTitle.includes('Office') || jobTitle.includes('Secretary') || jobTitle.includes('Administrative') || jobTitle.includes('Registrar')) {
          targetDept = createdDepartments.find(d => d.name.includes('Clerical')) || targetDept;
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
        console.log(`✅ Created role: ${jobTitle} in ${targetDept.name}`);
      } catch (error) {
        console.log(`❌ Error creating role ${jobTitle}: ${error.message}`);
      }
    }

    console.log('\n✨ Organization structure update completed!');
    console.log(`📊 Total departments: ${createdDepartments.length}`);
    console.log(`👥 Total roles: ${createdRoles.length}`);
    console.log(`🔒 Admin user preserved`);
    
  } catch (error) {
    console.error('❌ Error updating organization structure:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateOrganizationStructure()
  .then(() => {
    console.log('🎉 Organization structure update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to update organization structure:', error);
    process.exit(1);
  }); 