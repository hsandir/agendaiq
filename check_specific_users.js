const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Belirtilen email adreslerini kontrol et
    const emails = [
      'admin@school.edu',
      'sysadmin@cjcollegeprep.org',
      'nsercan@cjcollegeprep.org',
      'fbarker@cjcollegeprep.org'
    ];

    console.log('=== KULLANICI BİLGİLERİ ===\n');
    
    for (const email of emails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          Staff: {
            include: {
              Role: true,
              Department: true,
              School: true
            }
          }
        }
      });

      if (user) {
        console.log('Email: ' + user.email);
        console.log('İsim: ' + (user.name || 'Belirtilmemiş'));
        console.log('ID: ' + user.id);
        if (user.Staff) {
          console.log('Rol: ' + (user.Staff.Role?.title || 'Yok'));
          console.log('Departman: ' + (user.Staff.Department?.name || 'Yok'));
          console.log('Okul: ' + (user.Staff.School?.name || 'Yok'));
        }
        console.log('Email Doğrulandı: ' + (user.emailVerified ? 'Evet' : 'Hayır'));
        console.log('Oluşturma Tarihi: ' + user.createdAt);
        console.log('---');
      } else {
        console.log(email + ' - BULUNAMADI');
        console.log('---');
      }
    }

    console.log('\n=== ŞİFRE BİLGİLERİ ===');
    console.log('Güvenlik nedeniyle şifreler veritabanında hashlenmiş olarak saklanır.');
    console.log('Varsayılan şifreler genellikle şunlardır:');
    console.log('- admin@school.edu: Admin123! veya admin123');
    console.log('- sysadmin@cjcollegeprep.org: Admin123! veya sysadmin123');
    console.log('- nsercan@cjcollegeprep.org: Test123! veya nsercan123');
    console.log('- fbarker@cjcollegeprep.org: Test123! veya fbarker123');
    console.log('\nEğer bu şifreler çalışmazsa, "Forgot Password" özelliğini kullanın.');

    // Tüm kullanıcıları say
    const totalUsers = await prisma.user.count();
    console.log('\nToplam kullanıcı sayısı: ' + totalUsers);

  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();