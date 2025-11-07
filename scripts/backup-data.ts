import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function backupData() {
  try {
    console.log("Starting database backup...")

    const users = await prisma.user.findMany()
    const posts = await prisma.post.findMany()
    const events = await prisma.event.findMany()
    const links = await prisma.link.findMany()
    const postReactions = await prisma.postReaction.findMany()

    const backup = {
      users,
      posts,
      events,
      links,
      postReactions,
      timestamp: new Date().toISOString(),
    }

    const backupPath = path.join(process.cwd(), "backup-data.json")
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))

    console.log(`✅ Backup complete! Saved to: ${backupPath}`)
    console.log(`📊 Backed up:`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${posts.length} posts`)
    console.log(`   - ${events.length} events`)
    console.log(`   - ${links.length} links`)
    console.log(`   - ${postReactions.length} reactions`)
  } catch (error) {
    console.error("❌ Backup failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backupData()
