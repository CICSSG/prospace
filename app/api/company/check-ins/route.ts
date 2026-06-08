import { auth } from "@clerk/nextjs/server"
import { Collection, ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { canAccessManagementPath, type ManagementAccessMetadata } from "@/lib/management-access"
import { syncSignupMissionProgress } from "@/lib/signup-mission-progress"

type MongoUserRecord = {
  _id: string
  userId?: string | number | null
  clerkId?: string
  firstName?: string
  lastName?: string
  email?: string
  course?: string
  shortBio?: string
  socialLinks?: string[]
  portfolioLink?: string
  createdAt?: string
  updatedAt?: string
}

type CompanyRecord = {
  _id: string
  name?: string
  logoUrl?: string
  description?: string
  companyEmail?: string
}

type CompanyCheckInRecord = {
  _id: string
  checkInKey?: string
  companyId?: string
  companyName?: string
  userId?: string | number | null
  clerkId?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  course?: string
  shortBio?: string
  portfolioLink?: string
  socialLinks?: string[]
  checkInAt?: string
  checkInDate?: string
  checkInTime?: string
  source?: "manual" | "scanner"
  createdAt?: string
  updatedAt?: string
}

type CompanyCheckInDbRecord = Omit<CompanyCheckInRecord, "_id"> & {
  _id?: ObjectId
}

type CompanyCheckInResponseRecord = Omit<CompanyCheckInRecord, "_id"> & {
  id: string
}

type CompanyCheckInCompiledRow = {
  id: string
  companyId: string
  companyName: string
  checkInKey: string
  userId: string | number | null
  clerkId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  course: string
  shortBio: string
  portfolioLink: string
  socialLinks: string[]
  checkInAt: string
  checkInDate: string
  checkInTime: string
  source: "manual" | "scanner"
  createdAt: string
  updatedAt: string
}

type CheckInPreviewUser = {
  id: string
  userId: string | number | null
  clerkId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  course: string
  shortBio: string
  portfolioLink: string
  socialLinks: string[]
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

function getDateParts(date = new Date()) {
  return {
    checkInAt: date.toISOString(),
    checkInDate: date.toLocaleDateString("en-CA"),
    checkInTime: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  }
}

function getDateKey(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-CA")
}

function isAuthorized(metadata: ManagementAccessMetadata | undefined) {
  return Boolean(metadata?.isAdmin) && canAccessManagementPath("/company/check-ins", metadata?.pageAccess ?? undefined, metadata?.adminRole, metadata?.assignedCompany)
}

function toResponse(record: CompanyCheckInDbRecord | null): CompanyCheckInResponseRecord | null {
  if (!record) return null

  return {
    id: String(record._id || ""),
    checkInKey: record.checkInKey || "",
    companyId: record.companyId || "",
    companyName: record.companyName || "",
    userId: record.userId ?? null,
    clerkId: record.clerkId || "",
    email: record.email || "",
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    fullName: record.fullName || getFullName(record.firstName, record.lastName, record.email),
    course: record.course || "",
    shortBio: record.shortBio || "",
    portfolioLink: record.portfolioLink || "",
    socialLinks: Array.isArray(record.socialLinks) ? record.socialLinks : [],
    checkInAt: record.checkInAt || "",
    checkInDate: record.checkInDate || "",
    checkInTime: record.checkInTime || "",
    source: record.source || "manual",
    createdAt: record.createdAt || "",
    updatedAt: record.updatedAt || "",
  }
}

function getCompanyScope(metadata: ManagementAccessMetadata | undefined, requestedCompanyId?: string) {
  const assignedCompany = asString(metadata?.assignedCompany).trim()
  const isSuperAdmin = metadata?.adminRole === "superadmin"
  const requested = asString(requestedCompanyId).trim()

  if (isSuperAdmin) {
    if (!requested || requested === "all") {
      return ""
    }

    return requested
  }

  if (!assignedCompany) {
    return ""
  }

  if (requested && requested !== assignedCompany) {
    return "__forbidden__"
  }

  return assignedCompany
}

function buildPreviewUser(user: MongoUserRecord): CheckInPreviewUser {
  return {
    id: asString(user._id),
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
  }
}

async function resolveUserByIdentifier(usersCollection: Collection<MongoUserRecord>, identifier: string) {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  const numericValue = Number(trimmed)
  const queries: Array<Record<string, unknown>> = []

  if (trimmed.includes("@")) {
    queries.push({ email: trimmed.toLowerCase() })
  }

  if (!Number.isNaN(numericValue)) {
    queries.push({ $or: [{ userId: numericValue }, { userId: trimmed }] })
  }

  queries.push({ userId: trimmed }, { clerkId: trimmed })

  for (const query of queries) {
    const user = await usersCollection.findOne(query)
    if (user) return user
  }

  return null
}

function buildFilterQuery(companyId: string, checkInDate?: string) {
  const query: Record<string, unknown> = {}
  if (companyId) query.companyId = companyId
  if (checkInDate) query.checkInDate = checkInDate
  return query
}

export async function GET(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const requestedCompanyId = request.nextUrl.searchParams.get("companyId") || ""
    const companyScope = getCompanyScope(metadata, requestedCompanyId)

    if (!companyScope && metadata?.adminRole !== "superadmin") {
      return NextResponse.json({ success: false, error: "Company access is required" }, { status: 403 })
    }

    if (companyScope === "__forbidden__") {
      return NextResponse.json({ success: false, error: "You can only view your assigned company" }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users") as Collection<MongoUserRecord>
    const companiesCollection = db.collection("companies") as Collection<CompanyRecord>
    const checkInsCollection = db.collection("companyCheckins") as Collection<CompanyCheckInDbRecord>

    const [companyRows, userRows, checkInRows] = await Promise.all([
      metadata?.adminRole === "superadmin"
        ? companiesCollection.find({}).toArray()
        : companyScope
          ? companiesCollection.find({ _id: companyScope }).toArray()
          : [],
      usersCollection.find({}).toArray(),
      checkInsCollection.find(buildFilterQuery(companyScope)).toArray(),
    ])

    const companyById = new Map<string, CompanyRecord>()
    companyRows.forEach((company) => {
      companyById.set(asString(company._id), company)
    })

    const usersByKey = new Map<string, MongoUserRecord>()
    userRows.forEach((user) => {
      const userKey = getCheckInKey(user)
      if (userKey) usersByKey.set(userKey, user)
      if (user.clerkId) usersByKey.set(user.clerkId, user)
      if (user.email) usersByKey.set(user.email.toLowerCase(), user)
    })

    const compiledCheckIns: CompanyCheckInCompiledRow[] = checkInRows
      .map((record) => {
        const user = usersByKey.get(asString(record.userId)) || usersByKey.get(asString(record.clerkId)) || null
        const company = companyById.get(asString(record.companyId)) || null

        return {
          id: String(record._id || ""),
          companyId: record.companyId || "",
          companyName: record.companyName || company?.name || "Unknown company",
          checkInKey: record.checkInKey || "",
          userId: record.userId ?? user?.userId ?? null,
          clerkId: record.clerkId || user?.clerkId || "",
          firstName: record.firstName || user?.firstName || "",
          lastName: record.lastName || user?.lastName || "",
          fullName: record.fullName || getFullName(record.firstName || user?.firstName, record.lastName || user?.lastName, record.email || user?.email),
          email: record.email || user?.email || "",
          course: record.course || user?.course || "",
          shortBio: record.shortBio || user?.shortBio || "",
          portfolioLink: record.portfolioLink || user?.portfolioLink || "",
          socialLinks: Array.isArray(record.socialLinks) ? record.socialLinks : Array.isArray(user?.socialLinks) ? user.socialLinks : [],
          checkInAt: record.checkInAt || "",
          checkInDate: record.checkInDate || getDateKey(record.checkInAt),
          checkInTime: record.checkInTime || "",
          source: record.source || "manual",
          createdAt: record.createdAt || "",
          updatedAt: record.updatedAt || "",
        }
      })
      .filter((record): record is CompanyCheckInCompiledRow => Boolean(record.id))
      .sort((left, right) => {
        const leftAt = left.checkInAt || ""
        const rightAt = right.checkInAt || ""
        return rightAt.localeCompare(leftAt, undefined, { sensitivity: "base" })
      })

    return NextResponse.json({
      success: true,
      data: {
        company: companyScope ? companyById.get(companyScope) ?? null : null,
        companies: Array.from(companyById.values()).map((company) => ({
          id: asString(company._id),
          name: company.name || "Unnamed company",
        })),
        checkIns: compiledCheckIns,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to load company check-ins:", error)
    return NextResponse.json({ success: false, error: "Failed to load company check-ins" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const mode = body?.mode === "preview" ? "preview" : "checkin"
    const identifier = asString(body?.email || body?.userId || body?.identifier || body?.scannedUserId)
    const source: "manual" | "scanner" = body?.source === "scanner" ? "scanner" : "manual"
    const requestedCompanyId = asString(body?.companyId)
    const companyScope = getCompanyScope(metadata, requestedCompanyId)

    if (!companyScope) {
      return NextResponse.json({ success: false, error: "Company access is required" }, { status: 403 })
    }

    if (companyScope === "__forbidden__") {
      return NextResponse.json({ success: false, error: "You can only check in for your assigned company" }, { status: 403 })
    }

    if (!identifier) {
      return NextResponse.json({ success: false, error: "Email or userId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users") as Collection<MongoUserRecord>
    const companiesCollection = db.collection("companies") as Collection<CompanyRecord>
    const checkInsCollection = db.collection("companyCheckins") as Collection<CompanyCheckInDbRecord>

    const user = await resolveUserByIdentifier(usersCollection, identifier)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (mode === "preview") {
      const previewCheckInAtValue = body?.checkInAt ? new Date(body.checkInAt) : new Date()
      if (Number.isNaN(previewCheckInAtValue.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid check-in date and time" }, { status: 400 })
      }

      const previewUser = buildPreviewUser(user)
      const existingCheckIn = await checkInsCollection.findOne({
        companyId: companyScope,
        checkInKey: getCheckInKey(user),
      })

      return NextResponse.json({
        success: true,
        action: "preview",
        data: {
          company: {
            id: companyScope,
            name: (await companiesCollection.findOne({ _id: companyScope }))?.name || "Unknown company",
          },
          user: previewUser,
          existingCheckIn: toResponse(existingCheckIn),
        },
      })
    }

    const companyDoc = await companiesCollection.findOne({ _id: companyScope })
    const companyName = companyDoc?.name || "Unknown company"

    const checkInAtValue = body?.checkInAt ? new Date(body.checkInAt) : new Date()
    if (Number.isNaN(checkInAtValue.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid check-in date and time" }, { status: 400 })
    }

    const dateParts = getDateParts(checkInAtValue)
    const checkInKey = getCheckInKey(user)
    const existingCheckIn = await checkInsCollection.findOne({
      companyId: companyScope,
      checkInKey,
    })

    if (existingCheckIn) {
      return NextResponse.json(
        {
          success: false,
          error: "This user has already checked in for this company.",
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const payload = {
      companyId: companyScope,
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
      ...dateParts,
      source,
      updatedAt: now,
    }

    await checkInsCollection.insertOne({
      ...payload,
      createdAt: now,
    })

    const savedCheckIn = await checkInsCollection.findOne({
      companyId: companyScope,
      checkInKey,
      checkInDate: dateParts.checkInDate,
    })

    // also create a connect record linking the user to the company (if not exists)
    try {
      const connectCollection = db.collection("connect")
      const userIdForConnect = user.clerkId || user._id || asString(user.userId)
      if (userIdForConnect) {
        const existingConnect = await connectCollection.findOne({
          user_id: userIdForConnect,
          user_connect: companyScope,
          type: "company",
        })

        if (!existingConnect) {
          await connectCollection.insertOne({
            user_id: userIdForConnect,
            user_connect: companyScope,
            type: "company",
            createdAt: now,
            updatedAt: now,
          })
        }
      }
    } catch (err) {
      console.error("Failed to create connect record for check-in:", err)
    }

    try {
      await syncSignupMissionProgress(db, {
        userId: user.userId ?? user.clerkId ?? null,
        clerkId: user.clerkId || null,
      })
    } catch (err) {
      console.error("Failed to sync signup mission progress after check-in:", err)
    }

    return NextResponse.json({
      success: true,
      action: "created",
      data: {
        checkIn: toResponse(savedCheckIn),
      },
    })
  } catch (error) {
    console.error("Failed to save company check-in:", error)
    return NextResponse.json({ success: false, error: "Failed to save company check-in" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || metadata?.adminRole !== "superadmin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const checkInId = asString(body?.checkInId)

    if (!checkInId || !ObjectId.isValid(checkInId)) {
      return NextResponse.json({ success: false, error: "checkInId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const checkInsCollection = db.collection("companyCheckins") as Collection<CompanyCheckInDbRecord>

    const checkInAtValue = body?.checkInAt ? new Date(body.checkInAt) : new Date()
    if (Number.isNaN(checkInAtValue.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid check-in date and time" }, { status: 400 })
    }

    const dateParts = getDateParts(checkInAtValue)
    const updateResult = await checkInsCollection.findOneAndUpdate(
      { _id: new ObjectId(checkInId) },
      {
        $set: {
          ...dateParts,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    )

    if (!updateResult) {
      return NextResponse.json({ success: false, error: "Check-in record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        checkIn: toResponse(updateResult),
      },
    })
  } catch (error) {
    console.error("Failed to update company check-in:", error)
    return NextResponse.json({ success: false, error: "Failed to update company check-in" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || metadata?.adminRole !== "superadmin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const checkInId = asString(body?.checkInId)

    if (!checkInId || !ObjectId.isValid(checkInId)) {
      return NextResponse.json({ success: false, error: "checkInId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const checkInsCollection = db.collection("companyCheckins") as Collection<CompanyCheckInDbRecord>

    const deleteResult = await checkInsCollection.deleteOne({ _id: new ObjectId(checkInId) })
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Check-in record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error("Failed to delete company check-in:", error)
    return NextResponse.json({ success: false, error: "Failed to delete company check-in" }, { status: 500 })
  }
}
