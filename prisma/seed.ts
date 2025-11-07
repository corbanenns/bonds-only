import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('BondsOnly2025!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'corban@comharconsulting.com' },
    update: {},
    create: {
      email: 'corban@comharconsulting.com',
      name: 'Corban Enns',
      phone: '+15038817225',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created:', admin.email)
  console.log('📧 Email: corban@comharconsulting.com')
  console.log('🔑 Password: BondsOnly2025!')
  console.log('📱 Phone: +15038817225')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
