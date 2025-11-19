/**
 * Verify that the lastLogin field was added to the database
 * and show current login status for all users
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function verifySchema() {
  try {
    console.log('🔍 Verifying Database Schema\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    console.log(`Found ${users.length} users:\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Account Created: ${user.createdAt.toLocaleString()}`)
      console.log(`   Last Login: ${user.lastLogin ? user.lastLogin.toLocaleString() : '❌ Never (null)'}`)
      console.log()
    })

    const neverLoggedIn = users.filter(u => !u.lastLogin).length
    const hasLoggedIn = users.filter(u => u.lastLogin).length

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📊 Summary:')
    console.log(`   Total users: ${users.length}`)
    console.log(`   Never logged in (lastLogin = null): ${neverLoggedIn}`)
    console.log(`   Has logged in (lastLogin set): ${hasLoggedIn}`)
    console.log()

    if (neverLoggedIn === users.length) {
      console.log('ℹ️  All users have lastLogin = null')
      console.log('   This is expected if users haven\'t logged in since the migration.')
      console.log('   The lastLogin field will be set automatically when users log in.')
    }

    console.log('\n✅ Schema verification complete!\n')

    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)

    if (error.message.includes('Unknown field')) {
      console.error('\n⚠️  The lastLogin field does not exist in the database.')
      console.error('   Run: npx prisma db push')
    } else {
      console.error('Stack:', error.stack)
    }

    await prisma.$disconnect()
    process.exit(1)
  }
}

verifySchema()
