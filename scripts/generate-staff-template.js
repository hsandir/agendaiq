const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Hiyerarşik role yapısı (Level 0-5 hiyerarşi)
const hierarchyTemplate = [
  // Level 0-1: Yönetici roller (her rolde 1 kişi)
  { role: 'Superintendent', department: 'Administration', count: 1, level: 0 },
  { role: 'Assistant Superintendent for Instruction', department: 'Instruction', count: 1, level: 1 },
  { role: 'Assistant Superintendent for Operations', department: 'Operations', count: 1, level: 1 },
  
  // Level 2-3: Direktör/Chair roller (her rolde 1 kişi)
  { role: 'Director of Accountability', department: 'Administration', count: 1, level: 2 },
  { role: 'Academic Director', department: 'Instruction', count: 1, level: 2 },
  { role: 'Director of Student Support Services', department: 'Instruction', count: 1, level: 2 },
  { role: 'Operations Director', department: 'Operations', count: 1, level: 2 },
  { role: 'Human Resources Manager', department: 'Human Resources', count: 1, level: 2 },
  { role: 'Finance Manager', department: 'Finance', count: 1, level: 2 },
  { role: 'Office Manager', department: 'Office Administration', count: 1, level: 2 },
  { role: 'STEM Chair', department: 'STEM/Technology Department', count: 1, level: 3 },
  { role: 'Arts & Humanities Chair', department: 'Arts Department', count: 1, level: 3 },
  { role: 'Special Programs Chair', department: 'Instruction', count: 1, level: 3 },
  { role: 'Grade-Level Supervisor', department: 'Instruction', count: 2, level: 3 },
  
  // Level 4: Department Head roller (her rolde 1 kişi)
  { role: 'Department Head – Mathematics', department: 'Mathematics Department', count: 1, level: 4 },
  { role: 'Department Head – Science', department: 'Science Department', count: 1, level: 4 },
  { role: 'Department Head – STEM/Technology', department: 'STEM/Technology Department', count: 1, level: 4 },
  { role: 'Department Head – Language Arts', department: 'Language Arts Department', count: 1, level: 4 },
  { role: 'Department Head – Social Studies', department: 'Social Studies Department', count: 1, level: 4 },
  { role: 'Department Head – Arts', department: 'Arts Department', count: 1, level: 4 },
  { role: 'Department Head – World Languages', department: 'World Languages Department', count: 1, level: 4 },
  { role: 'Department Head – Special Education', department: 'Special Education Department', count: 1, level: 4 },
  
  // Level 5: Öğretmen roller (fazla sayıda - matematik ve İngilizce'de daha fazla)
  { role: 'Mathematics Teacher', department: 'Mathematics Department', count: 8, level: 5 },
  { role: 'English/Language Arts Teacher', department: 'Language Arts Department', count: 8, level: 5 },
  { role: 'Science Teacher', department: 'Science Department', count: 6, level: 5 },
  { role: 'Social Studies Teacher', department: 'Social Studies Department', count: 5, level: 5 },
  { role: 'Special Education Teacher', department: 'Special Education Department', count: 5, level: 5 },
  { role: 'Computer Science / Technology Teacher', department: 'Science Department', count: 3, level: 5 },
  { role: 'STEM Integration Teacher', department: 'STEM/Technology Department', count: 3, level: 5 },
  { role: 'Art Teacher', department: 'Arts Department', count: 3, level: 5 },
  { role: 'Music Teacher', department: 'Arts Department', count: 3, level: 5 },
  { role: 'Foreign Language Teacher', department: 'World Languages Department', count: 3, level: 5 },
  { role: 'ESL Teacher', department: 'ESL Department', count: 3, level: 5 },
];

// Cross-role assignments (bazı öğretmenler birden fazla rolde)
const crossRoleAssignments = [
  { mainRole: 'Mathematics Teacher', extraRole: 'Grade-Level Supervisor', count: 1 },
  { mainRole: 'English/Language Arts Teacher', extraRole: 'Grade-Level Supervisor', count: 1 },
  { mainRole: 'Science Teacher', extraRole: 'STEM Integration Teacher', count: 1 },
];

const firstNames = [
  'Robert', 'Sarah', 'Maria', 'James', 'Lisa', 'David', 'Susan', 'Christopher', 'Patricia', 'Daniel',
  'Nancy', 'Emily', 'Marcus', 'Rachel', 'Thomas', 'Helen', 'Mark', 'Carol', 'Linda', 'Paul',
  'Sandra', 'Michael', 'Jennifer', 'Matthew', 'John', 'Mary', 'Amanda', 'Joshua', 'Jessica', 'Ashley',
  'Michelle', 'Ryan', 'Nicole', 'Anthony', 'Stephanie', 'Kevin', 'Brandon', 'Samantha', 'Timothy', 'Vanessa',
  'Jacob', 'Brittany', 'Nathan', 'Heather', 'Tyler', 'Courtney', 'Aaron', 'Megan', 'Justin', 'Tiffany',
  'Jonathan', 'Danielle', 'Steven', 'Melissa', 'Eric', 'Kimberly', 'Gregory', 'Christina', 'Patrick', 'Alicia',
  'Benjamin', 'Jasmine', 'Nicholas', 'Alexis', 'Jordan', 'Destiny', 'Cameron', 'Brianna', 'Zachary', 'Gabrielle',
  'Mason', 'Natalie', 'Ethan', 'Olivia', 'Caleb', 'Sophia', 'Isaiah', 'Emma', 'Elijah', 'Ava',
  'Logan', 'Mia', 'Lucas', 'Chloe', 'Abigail', 'Alexander', 'William', 'Madison', 'Andrew', 'Grace'
];

const lastNames = [
  'Johnson', 'Williams', 'Rodriguez', 'Wilson', 'Anderson', 'Thompson', 'Miller', 'Garcia', 'Martinez', 'Jones',
  'Taylor', 'Chen', 'Green', 'Lee', 'Stevens', 'Davis', 'Brown', 'Adams', 'Baker', 'Campbell',
  'Clark', 'Edwards', 'Flores', 'Harris', 'Jackson', 'King', 'Lewis', 'Moore', 'Nelson', 'Parker',
  'Phillips', 'Roberts', 'Smith', 'Thomas', 'Turner', 'Walker', 'White', 'Wright', 'Young', 'Allen',
  'Collins', 'Evans', 'Hall', 'Hill', 'Mitchell', 'Cooper', 'Ward', 'Foster', 'Gonzalez', 'Rivera'
];

async function generateStaffTemplate() {
  try {
    console.log('🚀 Hiyerarşik staff template oluşturuluyor...');
    
    // Mevcut kullanıcıları database'den al
    const existingUsers = await prisma.user.findMany({
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true
          }
        }
      }
    });

    console.log(`📊 Database'de ${existingUsers.length} mevcut kullanıcı bulundu`);

    const staffData = [];
    const usedEmails = new Set();
    let staffIdCounter = 1;

    function getUniqueNameAndEmail() {
      let firstName, lastName, email;
      do {
        firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@agendaiq.edu`;
      } while (usedEmails.has(email));
      usedEmails.add(email);
      return { firstName, lastName, email };
    }

    // Mevcut kullanıcılardan bazılarını template'e ekle (test için)
    const existingToInclude = existingUsers.slice(0, Math.min(10, existingUsers.length));
    existingToInclude.forEach(user => {
      if (user.Staff && user.Staff.length > 0) {
        const staff = user.Staff[0];
        staffData.push({
          Email: user.email,
          Name: user.name || `${user.email.split('@')[0]}`,
          StaffId: `STAFF${staffIdCounter.toString().padStart(4, '0')}`,
          Role: staff.Role?.title || 'Staff Member',
          Department: staff.Department?.name || 'Administration'
        });
        usedEmails.add(user.email);
        staffIdCounter++;
      }
    });

    console.log(`✅ ${existingToInclude.length} mevcut kullanıcı template'e eklendi`);

    // Hiyerarşik yapıya göre kullanıcıları oluştur
    hierarchyTemplate.forEach(template => {
      for (let i = 0; i < template.count; i++) {
        const { firstName, lastName, email } = getUniqueNameAndEmail();
        
        staffData.push({
          Email: email,
          Name: `${firstName} ${lastName}`,
          StaffId: `STAFF${staffIdCounter.toString().padStart(4, '0')}`,
          Role: template.role,
          Department: template.department
        });
        staffIdCounter++;
      }
    });

    // Cross-role assignments ekle
    crossRoleAssignments.forEach(assignment => {
      for (let i = 0; i < assignment.count; i++) {
        // Ana rolü olan birini bul
        const mainRoleStaff = staffData.find(staff => 
          staff.Role === assignment.mainRole && 
          !staff.Role.includes(',') // Henüz ek rol almamış
        );
        
        if (mainRoleStaff) {
          // Ek rolü ekle
          mainRoleStaff.Role = `${mainRoleStaff.Role}, ${assignment.extraRole}`;
        }
      }
    });

    // Toplam 100 kişi olana kadar ek öğretmenler ekle
    while (staffData.length < 100) {
      const teacherRoles = [
        'Mathematics Teacher',
        'English/Language Arts Teacher',
        'Science Teacher',
        'Social Studies Teacher',
        'Special Education Teacher',
        'ESL Teacher'
      ];
      
      const departments = {
        'Mathematics Teacher': 'Mathematics Department',
        'English/Language Arts Teacher': 'Language Arts Department',
        'Science Teacher': 'Science Department',
        'Social Studies Teacher': 'Social Studies Department',
        'Special Education Teacher': 'Special Education Department',
        'ESL Teacher': 'ESL Department'
      };
      
      const role = teacherRoles[Math.floor(Math.random() * teacherRoles.length)];
      const { firstName, lastName, email } = getUniqueNameAndEmail();
      
      staffData.push({
        Email: email,
        Name: `${firstName} ${lastName}`,
        StaffId: `STAFF${staffIdCounter.toString().padStart(4, '0')}`,
        Role: role,
        Department: departments[role]
      });
      staffIdCounter++;
    }

    // CSV oluştur
    const csvHeader = 'Email,Name,StaffId,Role,Department\n';
    const csvRows = staffData.map(staff =>
      `${staff.Email},${staff.Name},${staff.StaffId},"${staff.Role}",${staff.Department}`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    const outputPath = path.join(__dirname, '..', 'public', 'templates', 'staff-upload-template.csv');
    fs.writeFileSync(outputPath, csvContent);

    console.log(`✅ Hiyerarşik yapıya uygun ${staffData.length} kişilik staff-upload-template.csv oluşturuldu`);
    console.log(`📁 File saved to: ${outputPath}`);

    // İstatistikler
    const roleCounts = {};
    
    staffData.forEach(staff => {
      const roles = staff.Role.split(',').map(r => r.trim());
      roles.forEach(role => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
    });

    console.log('\n📊 Role dağılımı:');
    Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([role, count]) => {
        console.log(`  ${role}: ${count} kişi`);
      });

    console.log(`\n📋 Template özeti:`);
    console.log(`  - Mevcut kullanıcılar: ${existingToInclude.length}`);
    console.log(`  - Yeni kullanıcılar: ${staffData.length - existingToInclude.length}`);
    console.log(`  - Cross-role assignments: ${crossRoleAssignments.reduce((sum, a) => sum + a.count, 0)}`);
    console.log(`  - Toplam kayıt: ${staffData.length}`);

    // Örnek kayıtları göster
    console.log('\n📋 Örnek kayıtlar:');
    staffData.slice(0, 10).forEach((staff, index) => {
      const status = existingToInclude.some(u => u.email === staff.Email) ? '[MEVCUT]' : '[YENİ]';
      console.log(`${index + 1}. ${staff.Name} (${staff.Email}) - ${staff.Role} ${status}`);
    });

  } catch (error) {
    console.error('❌ Template oluşturma hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateStaffTemplate(); 