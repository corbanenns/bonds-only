import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function restoreData() {
  try {
    console.log("Starting database restore...")

    const backupPath = path.join(process.cwd(), "backup-data.json")

    if (!fs.existsSync(backupPath)) {
      console.error("❌ Backup file not found!")
      process.exit(1)
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"))

    console.log(`📊 Restoring data from backup created at: ${backup.timestamp}`)

    // Restore users first (without relations)
    for (const user of backup.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          password: user.password,
          role: user.role,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          agencyName: user.agencyName,
          address: user.address,
          notifyEmail: user.notifyEmail,
          notifySms: user.notifySms,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      })
    }
    console.log(`✅ Restored ${backup.users.length} users`)

    // Restore posts
    for (const post of backup.posts) {
      await prisma.post.create({
        data: {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.authorId,
          imageUrl: post.imageUrl,
          parentId: post.parentId,
          isEdited: post.isEdited,
          editedAt: post.editedAt ? new Date(post.editedAt) : null,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
        },
      })
    }
    console.log(`✅ Restored ${backup.posts.length} posts`)

    // Restore events
    for (const event of backup.events) {
      await prisma.event.create({
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          location: event.location,
          createdBy: event.createdBy,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        },
      })
    }
    console.log(`✅ Restored ${backup.events.length} events`)

    // Restore links
    for (const link of backup.links) {
      await prisma.link.create({
        data: {
          id: link.id,
          title: link.title,
          url: link.url,
          description: link.description,
          category: link.category,
          addedBy: link.addedBy,
          createdAt: new Date(link.createdAt),
          updatedAt: new Date(link.updatedAt),
        },
      })
    }
    console.log(`✅ Restored ${backup.links.length} links`)

    // Restore post reactions
    for (const reaction of backup.postReactions) {
      await prisma.postReaction.create({
        data: {
          id: reaction.id,
          postId: reaction.postId,
          userId: reaction.userId,
          type: reaction.type,
          createdAt: new Date(reaction.createdAt),
        },
      })
    }
    console.log(`✅ Restored ${backup.postReactions.length} reactions`)

    console.log("\n🎉 Database restore complete!")
  } catch (error) {
    console.error("❌ Restore failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()
