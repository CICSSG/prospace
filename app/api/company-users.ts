import clientPromise from "@/lib/mongodb"
import { clerkClient } from "@clerk/nextjs/server"
import { buildExplicitPageAccess } from "@/lib/management-access"

const companyModeratorPageAccess = buildExplicitPageAccess({
  company: {
    "/company/dashboard": "edit",
    "/company/check-ins": "edit",
  },
})

export function normalizeEmailList(emails: string[]) {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))]
}

export async function ensureCompanyModeratorAccounts({
  companyId,
  companyName,
  moderatorEmails,
  passwords,
}: {
  companyId: string
  companyName: string
  moderatorEmails: string[]
  passwords?: Record<string, string>
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

      const meta = {
        role: "admin",
        isAdmin: true,
        adminRole: "admin",
        companyId,
        assignedCompany: companyId,
        companyName,
        pageAccess: companyModeratorPageAccess,
      }

      const password = passwords?.[email]
      let clerkUser

      if (existingUsers.data.length > 0) {
        const existingUser = existingUsers.data[0]
        clerkUser = await clerk.users.updateUser(existingUser.id, {
          publicMetadata: { ...(existingUser.publicMetadata ?? {}), ...meta },
          ...(password ? { password } : {}),
        })
      } else {
        clerkUser = await clerk.users.createUser({
          firstName: companyName,
          lastName: "Moderator",
          emailAddress: [email],
          ...(password ? { password } : {}),
          publicMetadata: meta,
        })
      }

      await usersCollection.updateOne(
        { clerkId: clerkUser.id },
        {
          $set: {
            clerkId: clerkUser.id,
            email,
            role: "admin",
            adminRole: "admin",
            isAdmin: true,
            companyId,
            assignedCompany: companyId,
            companyName,
            pageAccess: companyModeratorPageAccess,
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
