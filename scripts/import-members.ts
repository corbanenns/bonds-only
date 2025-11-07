import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Parse email field to extract clean email address
function extractEmail(emailField: string): string {
  // Handle formats like "Name <email@domain.com>" or just "email@domain.com"
  const emailMatch = emailField.match(/<([^>]+)>/)
  if (emailMatch) {
    return emailMatch[1].trim().toLowerCase()
  }
  return emailField.trim().toLowerCase()
}

// Generate a phone number placeholder based on index
function generatePlaceholderPhone(index: number): string {
  const basePhone = 5550000000 + index
  return `+1${basePhone}`
}

async function importMembers() {
  const csvPath = path.join(__dirname, '../../Bonds Only Master List.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n')

  // Skip header rows (first 2 lines)
  const dataLines = lines.slice(2).filter(line => line.trim())

  console.log(`Found ${dataLines.length} members to import`)

  let imported = 0
  let skipped = 0
  let errors = 0

  // Default password for all imported users
  const defaultPassword = await bcrypt.hash('BondsOnly2025!', 10)

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    const [nameField, emailField] = line.split(',').map(s => s.trim())

    if (!nameField || !emailField) {
      console.log(`⚠️  Skipping line ${i + 3}: Missing name or email`)
      skipped++
      continue
    }

    // Extract clean name and email
    const name = nameField.trim()
    const email = extractEmail(emailField)

    if (!email || !email.includes('@')) {
      console.log(`⚠️  Skipping ${name}: Invalid email`)
      skipped++
      continue
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        console.log(`⏭️  Skipping ${name} (${email}): Already exists`)
        skipped++
        continue
      }

      // Create new user
      await prisma.user.create({
        data: {
          email,
          name,
          phone: generatePlaceholderPhone(i),
          password: defaultPassword,
          role: 'MEMBER',
        }
      })

      console.log(`✅ Imported: ${name} (${email})`)
      imported++
    } catch (error) {
      console.error(`❌ Error importing ${name}:`, error)
      errors++
    }
  }

  console.log('\n📊 Import Summary:')
  console.log(`   ✅ Successfully imported: ${imported}`)
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`\n📝 Note: All users imported with default password: BondsOnly2025!`)
  console.log(`   Phone numbers are placeholders - update them in Settings`)
}

importMembers()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
