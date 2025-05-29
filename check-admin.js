const { PrismaClient } = require('./prisma/generated/client')

async function checkAdminStatus() {
  const prisma = new PrismaClient()
  
  try {
    // Kullanıcıyı admin yap
    const updatedUser = await prisma.user.update({
      where: {
        email: 'fevziyenurksbr1@gmail.com'
      },
      data: {
        isAdmin: true,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Kullanıcı admin yapıldı:', updatedUser)
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminStatus() 