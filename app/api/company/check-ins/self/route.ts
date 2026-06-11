import { auth } from "@clerk/nextjs/server"
import { Collection, ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { syncSignupMissionProgress } from "@/lib/signup-mission-progress"

type MongoUserRecord = {
  _id: string
  userId?: string | number | null
  clerkId?: string
  email?: string
  firstName?: string
  lastName?: string
  course?: string
  shortBio?: string
  socialLinks?: string[]
  portfolioLink?: string
}

type CompanyRecord = {
  _id: string | ObjectId
  name?: string
  companyId?: string | number
}

function asString(value: unknown) {
  return value == null ? "" : String(value)
}

function getFullName(firstName?: string, lastName?: string, email?: string) {
  const name = `${firstName || ""} ${lastName || ""}`.trim()
  return name || email || "Unnamed user"
}

function getCheckInKey(user: MongoUserRecord) {
  return asString(user.userId || user.clerkId || user._id)
}

async function resolveCompany(companiesCollection: Collection<CompanyRecord>, rawId: string) {
  const queries: Record<string, unknown>[] = []

  if (ObjectId.isValid(rawId)) {
    queries.push({ _id: new ObjectId(rawId) })
  }
  queries.push({ _id: rawId })

  const numericId = Number(rawId)
  if (!Number.isNaN(numericId)) {
    queries.push({ companyId: numericId })
  }
  queries.push({ companyId: rawId })

  for (const query of queries) {
    const company = await companiesCollection.findOne(query as Parameters<typeof companiesCollection.findOne>[0])
    if (company) return company
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const rawCompanyId = asString(body?.companyId).trim()

    if (!rawCompanyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users") as Collection<MongoUserRecord>
    const companiesCollection = db.collection("companies") as Collection<CompanyRecord>
    const checkInsCollection = db.collection("companyCheckins")
    const connectCollection = db.collection("connect")

    const user = await usersCollection.findOne({ clerkId })
    if (!user) {
      return NextResponse.json({ success: false, error: "User profile not found. Please complete your profile first." }, { status: 404 })
    }

    const company = await resolveCompany(companiesCollection, rawCompanyId)
    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 })
    }

    const resolvedCompanyId = asString(company._id)
    const companyName = company.name || "Unknown company"
    const checkInKey = getCheckInKey(user)

    const existingCheckIn = await checkInsCollection.findOne({ companyId: resolvedCompanyId, checkInKey })
    if (existingCheckIn) {
      return NextResponse.json(
        { success: false, error: "You have already checked in for this company.", alreadyCheckedIn: true },
        { status: 409 }
      )
    }

    const now = new Date()
    const nowStr = now.toISOString()
    const checkInAt = nowStr
    const checkInDate = now.toLocaleDateString("en-CA")
    const checkInTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const payload = {
      companyId: resolvedCompanyId,
      companyName,
      checkInKey,
      userId: user.userId ?? null,
      clerkId: user.clerkId || "",
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: getFullName(user.firstName, user.lastName, user.email),
      course: user.course || "",
      shortBio: user.shortBio || "",
      portfolioLink: user.portfolioLink || "",
      socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks : [],
      checkInAt,
      checkInDate,
      checkInTime,
      source: "scanner" as const,
      createdAt: nowStr,
      updatedAt: nowStr,
    }

    await checkInsCollection.insertOne(payload)

    const userIdForConnect = user.clerkId || asString(user._id) || asString(user.userId)
    if (userIdForConnect) {
      const existingConnect = await connectCollection.findOne({
        user_id: userIdForConnect,
        user_connect: resolvedCompanyId,
        type: "company",
      })
      if (!existingConnect) {
        await connectCollection.insertOne({
          user_id: userIdForConnect,
          user_connect: resolvedCompanyId,
          type: "company",
          createdAt: nowStr,
          updatedAt: nowStr,
        })
      }
    }

    try {
      await syncSignupMissionProgress(db, {
        userId: user.userId ?? user.clerkId ?? null,
        clerkId: user.clerkId || null,
      })
    } catch (err) {
      console.error("Failed to sync signup mission progress after self check-in:", err)
    }

    return NextResponse.json({ success: true, action: "checked_in", data: { companyName } })
  } catch (error) {
    console.error("Failed to self check-in:", error)
    return NextResponse.json({ success: false, error: "Failed to create check-in" }, { status: 500 })
  }
}
