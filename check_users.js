const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Admin kullanıcıyı bul
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@agendaiq.com' },
          { email: 'hakan@agendaiq.com' },
          { Staff: { Role: { title: 'Administrator' } } }
        ]
      },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });

    // Namık Sercan'ı bul
    const testUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Namık Sercan' } },
          { name: { contains: 'Namik Sercan' } },
          { email: { contains: 'namik' } }
        ]
      },
      include: {
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });

    console.log('\n=== ADMIN KULLANICI ===');
    if (adminUser) {
      console.log('Email:', adminUser.email);
      console.log('İsim:', adminUser.name);
      console.log('Rol:', adminUser.Staff?.Role?.title || 'Rol atanmamış');
      console.log('Default Şifre: Admin123\! (eğer değiştirilmediyse)');
    } else {
      console.log('Admin kullanıcı bulunamadı');
    }

    console.log('\n=== TEST KULLANICISI (Namık Sercan) ===');
    if (testUser) {
      console.log('Email:', testUser.email);
      console.log('İsim:', testUser.name);
      console.log('Rol:', testUser.Staff?.Role?.title || 'Rol atanmamış');
      console.log('Default Şifre: Test123\! (eğer değiştirilmediyse)');
    } else {
      console.log('Namık Sercan bulunamadı');
    }

    // Tüm kullanıcıları listele
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        Staff: {
          select: {
            Role: {
              select: {
                title: true
              }
            }
          }
        }
      },
      take: 10
    });

    console.log('\n=== İLK 10 KULLANICI ===');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'İsimsiz'} - ${user.email} - Rol: ${user.Staff?.Role?.title || 'Yok'}`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
