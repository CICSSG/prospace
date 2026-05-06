import clientPromise from "@/lib/mongodb"
import { clerkClient } from "@clerk/nextjs/server"

export function normalizeEmailList(emails: string[]) {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))]
}

export async function ensureCompanyModeratorAccounts({
  companyId,
  companyName,
  moderatorEmails,
}: {
  companyId: string
  companyName: string
  moderatorEmails: string[]
}) {
  const normalizedEmails = normalizeEmailList(moderatorEmails)
  if (normalizedEmails.length === 0) {
    return { createdCount: 0 }
  }

  const clerk = await clerkClient()
  const mongoClient = await clientPromise
  const db = mongoClient.db(process.env.MONGODB_DATABASE)
  const usersCollection = db.collection("users")

  const results = await Promise.all(
    normalizedEmails.map(async (email) => {
      const existingUsers = await clerk.users.getUserList({
        emailAddress: [email],
        limit: 1,
      })

      let clerkUser

      if (existingUsers.data.length > 0) {
        const existingUser = existingUsers.data[0]
        clerkUser = await clerk.users.updateUser(existingUser.id, {
          publicMetadata: {
            ...(existingUser.publicMetadata ?? {}),
            role: "data",
            companyId,
            companyName,
          },
        })
      } else {
        clerkUser = await clerk.users.createUser({
          firstName: companyName,
          lastName: "Moderator",
          emailAddress: [email],
          publicMetadata: {
            role: "data",
            companyId,
            companyName,
          },
        })
      }

      await usersCollection.updateOne(
        { clerkId: clerkUser.id },
        {
          $set: {
            clerkId: clerkUser.id,
            email,
            role: "data",
            companyId,
            companyName,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      )

      return clerkUser.id
    })
  )

  return { createdCount: results.length }
}

export async function removeCompanyModeratorAccounts(removedEmails: string[]) {
  const normalizedEmails = normalizeEmailList(removedEmails)
  if (normalizedEmails.length === 0) {
    return { deletedCount: 0 }
  }

  const clerk = await clerkClient()
  const mongoClient = await clientPromise
  const db = mongoClient.db(process.env.MONGODB_DATABASE)
  const usersCollection = db.collection("users")

  const results = await Promise.all(
    normalizedEmails.map(async (email) => {
      const existingUsers = await clerk.users.getUserList({
        emailAddress: [email],
        limit: 1,
      })

      if (existingUsers.data.length > 0) {
        const existingUser = existingUsers.data[0]
        // Delete the Clerk user
        await clerk.users.deleteUser(existingUser.id)

        // Delete from Mongo users collection
        await usersCollection.deleteOne({
          clerkId: existingUser.id,
        })

        return existingUser.id
      }

      return null
    })
  )

  return { deletedCount: results.filter((id) => id !== null).length }
}
