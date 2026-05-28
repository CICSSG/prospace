import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

type MongoUserRecord = {
  _id: string
  clerkId?: string
  firstName?: string
  lastName?: string
  email?: string
  course?: string
  shortBio?: string
  resumeLink?: string
  createdAt?: string
  updatedAt?: string
  role?: "admin" | "data" | "user" | null
  adminRole?: "superadmin" | "admin" | null
  isAdmin?: boolean
}

type MongoSessionRecord = {
  _id: string
  topicPictureUrl?: string
  logoUrl?: string
  sessionTitle?: string
  startTime?: string
  endTime?: string
  sessionDate?: string
  company?: string
  sessionLinks?: string[]
  sessionSet?: string
  createdAt?: string
}

type MongoCompanyRecord = {
  _id: string
  name?: string
  description?: string
  createdAt?: string
}

type MongoLogoLoopRecord = {
  _id: string
  companyName?: string
  companyUrl?: string
  logoUrl?: string
}

type ClerkUserRecord = {
  id: string
  firstName?: string | null
  lastName?: string | null
  emailAddresses?: Array<{ emailAddress: string }>
  publicMetadata?: {
    role?: string | null
  }
}

function displayName(firstName?: string, lastName?: string, email?: string) {
  const name = `${firstName || ""} ${lastName || ""}`.trim()
  return name || email || "Unnamed user"
}

function toDate(value?: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function getAllClerkUsers(): Promise<ClerkUserRecord[]> {
  const clerk = await clerkClient()
  const limit = 100
  let offset = 0
  const allUsers: ClerkUserRecord[] = []

  while (true) {
    const response = await clerk.users.getUserList({ limit, offset })
    const batch = response.data as ClerkUserRecord[]
    allUsers.push(...batch)

    if (batch.length < limit) break
    offset += limit
  }

  return allUsers
}

export async function GET() {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as
      | {
          isAdmin?: boolean
          role?: string
        }
      | undefined

    if (!userId || !metadata?.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)

    const [mongoUsers, mongoSessions, mongoCompanies, mongoLogoLoop, clerkUsers] = await Promise.all([
      db.collection("users").find({}).sort({ createdAt: -1 }).toArray() as unknown as Promise<MongoUserRecord[]>,
      db.collection("sessions").find({}).sort({ createdAt: -1 }).toArray() as unknown as Promise<MongoSessionRecord[]>,
      db.collection("companies").find({}).sort({ createdAt: -1 }).toArray() as unknown as Promise<MongoCompanyRecord[]>,
      db.collection("logoLoop").find({}).sort({ createdAt: -1 }).toArray() as unknown as Promise<MongoLogoLoopRecord[]>,
      getAllClerkUsers().catch((error) => {
        console.error("Error fetching Clerk users for dashboard stats:", error)
        return [] as ClerkUserRecord[]
      }),
    ])

    const clerkRoleById = new Map<string, string | null | undefined>()
    const clerkRoleByEmail = new Map<string, string | null | undefined>()

    clerkUsers.forEach((clerkUser) => {
      clerkRoleById.set(clerkUser.id, clerkUser.publicMetadata?.role)
      clerkUser.emailAddresses?.forEach((emailRecord) => {
        clerkRoleByEmail.set(emailRecord.emailAddress.toLowerCase(), clerkUser.publicMetadata?.role)
      })
    })

    const registeredUsers = mongoUsers.filter((mongoUser) => {
      const mongoRole = mongoUser.role
      if (mongoRole === "user") return true

      const clerkRole =
        (mongoUser.clerkId ? clerkRoleById.get(mongoUser.clerkId) : null) ??
        (mongoUser.email ? clerkRoleByEmail.get(mongoUser.email.toLowerCase()) : null)

      return clerkRole === "user"
    })

    const adminUsers = mongoUsers.filter((mongoUser) => mongoUser.role === "admin")
    const dataUsers = mongoUsers.filter((mongoUser) => mongoUser.role === "data")

    const upcomingSessions = mongoSessions.filter((session) => {
      const sessionDate = toDate(session.sessionDate)
      if (!sessionDate) return false

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return sessionDate >= today
    })

    const recentUsers = mongoUsers.slice(0, 5).map((user) => ({
      id: user._id,
      name: displayName(user.firstName, user.lastName, user.email),
      email: user.email || "",
      role: user.role || "user",
      createdAt: user.createdAt || user.updatedAt || "",
    }))

    const recentSessions = mongoSessions.slice(0, 5).map((session) => ({
      id: session._id,
      title: session.sessionTitle || "Untitled session",
      date: session.sessionDate || "",
      companyId: session.company || "",
      linkCount: Array.isArray(session.sessionLinks) ? session.sessionLinks.length : 0,
      sessionSet: (session as any).sessionSet || null,
    }))

    const recentCompanies = mongoCompanies.slice(0, 5).map((company) => ({
      id: company._id,
      name: company.name || "Unnamed company",
      description: company.description || "",
      createdAt: company.createdAt || "",
    }))

    return NextResponse.json({
      success: true,
      data: {
        registeredUsers: registeredUsers.length,
        totalUsers: mongoUsers.length,
        adminUsers: adminUsers.length,
        dataUsers: dataUsers.length,
        companies: mongoCompanies.length,
        sessions: mongoSessions.length,
        upcomingSessions: upcomingSessions.length,
        logoLoop: mongoLogoLoop.length,
        recentUsers,
        recentSessions,
        recentCompanies,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error building dashboard stats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard stats" },
      { status: 500 }
    )
  }
}
