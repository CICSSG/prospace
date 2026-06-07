import { auth } from "@clerk/nextjs/server"
import { Collection, ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { canAccessManagementPath, type ManagementAccessMetadata } from "@/lib/management-access"

type MongoUserRecord = {
  _id: string
  userId?: string | number
  clerkId?: string
  firstName?: string
  lastName?: string
  email?: string
  course?: string
  shortBio?: string
  createdAt?: string
  updatedAt?: string
}

type AttendanceRecord = {
  _id: string
  attendanceKey?: string
  userId?: string | number | null
  clerkId?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  attendanceAt?: string
  attendanceDate?: string
  attendanceTime?: string
  source?: "manual" | "scanner"
  createdAt?: string
  updatedAt?: string
}

type AttendanceDbRecord = Omit<AttendanceRecord, "_id"> & {
  _id?: ObjectId
}

type AttendanceResponseRecord = Omit<AttendanceRecord, "_id"> & {
  id: string
}

type AttendanceCompiledUser = {
  id: string
  attendanceKey: string
  userId: string | number | null
  clerkId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  course: string
  hasAttendanceToday: boolean
  attendanceRecord: AttendanceResponseRecord | null
  latestAttendanceRecord: AttendanceResponseRecord | null
  createdAt: string
  updatedAt: string
}

function asString(value: unknown) {
  return value == null ? "" : String(value)
}

function getFullName(firstName?: string, lastName?: string, email?: string) {
  const name = `${firstName || ""} ${lastName || ""}`.trim()
  return name || email || "Unnamed user"
}

function getAttendanceKey(user: MongoUserRecord) {
  return asString(user.userId || user.clerkId || user._id)
}

function formatAttendanceParts(date = new Date()) {
  return {
    attendanceAt: date.toISOString(),
    attendanceDate: date.toLocaleDateString("en-CA"),
    attendanceTime: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  }
}

function isAuthorized(metadata: ManagementAccessMetadata | undefined) {
  return Boolean(metadata?.isAdmin) && canAccessManagementPath("/data/attendance", metadata?.pageAccess ?? undefined, metadata?.adminRole)
}

function toAttendanceResponse(record: AttendanceDbRecord | null): AttendanceResponseRecord | null {
  if (!record) return null

  return {
    id: String(record._id || ""),
    attendanceKey: record.attendanceKey || "",
    userId: record.userId ?? null,
    clerkId: record.clerkId || "",
    email: record.email || "",
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    fullName: record.fullName || getFullName(record.firstName, record.lastName, record.email),
    attendanceAt: record.attendanceAt || "",
    attendanceDate: record.attendanceDate || "",
    attendanceTime: record.attendanceTime || "",
    source: record.source || "manual",
    createdAt: record.createdAt || "",
    updatedAt: record.updatedAt || "",
  }
}

function getAttendanceDateKey(value?: string) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleDateString("en-CA")
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

export async function GET() {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users") as Collection<MongoUserRecord>
    const attendanceCollection = db.collection("attendance") as Collection<AttendanceDbRecord>

    const [users, attendanceRecords] = await Promise.all([
      usersCollection.find({}).toArray(),
      attendanceCollection.find({}).toArray(),
    ])

    const attendanceByKey = new Map<string, AttendanceDbRecord[]>()
    const attendanceByDayKey = new Map<string, AttendanceDbRecord>()
    attendanceRecords.forEach((record) => {
      const key = asString(record.attendanceKey || record.userId || record.clerkId)
      if (key) {
        const recordsForKey = attendanceByKey.get(key) || []
        recordsForKey.push(record)
        attendanceByKey.set(key, recordsForKey)

        const dayKey = `${key}:${record.attendanceDate || getAttendanceDateKey(record.attendanceAt)}`
        if (dayKey && record.attendanceDate) {
          attendanceByDayKey.set(dayKey, record)
        }
      }
    })

    const todayKey = new Date().toLocaleDateString("en-CA")

    const compiledUsers: AttendanceCompiledUser[] = users
      .map((user) => {
        const attendanceKey = getAttendanceKey(user)
        const userAttendanceRecords = attendanceByKey.get(attendanceKey) || []
        const latestAttendanceRecord = userAttendanceRecords
          .slice()
          .sort((left, right) => {
            const leftAttendanceAt = left.attendanceAt || ""
            const rightAttendanceAt = right.attendanceAt || ""

            return rightAttendanceAt.localeCompare(leftAttendanceAt, undefined, { sensitivity: "base" })
          })[0] || null
        const todayAttendanceRecord = attendanceByDayKey.get(`${attendanceKey}:${todayKey}`) || null

        return {
          id: user._id,
          attendanceKey,
          userId: user.userId ?? null,
          clerkId: user.clerkId || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          fullName: getFullName(user.firstName, user.lastName, user.email),
          email: user.email || "",
          course: user.course || "",
          hasAttendanceToday: Boolean(todayAttendanceRecord),
          attendanceRecord: toAttendanceResponse(todayAttendanceRecord),
          latestAttendanceRecord: toAttendanceResponse(latestAttendanceRecord),
          createdAt: user.createdAt || "",
          updatedAt: user.updatedAt || "",
        }
      })
      .sort((left, right) => {
        if (left.hasAttendanceToday !== right.hasAttendanceToday) {
          return left.hasAttendanceToday ? -1 : 1
        }

        return left.fullName.localeCompare(right.fullName, undefined, { sensitivity: "base" })
      })

    const compiledAttendance = attendanceRecords
      .map(toAttendanceResponse)
      .filter((record): record is NonNullable<typeof record> => Boolean(record))
      .sort((left, right) => {
        const leftAttendanceAt = left.attendanceAt || ""
        const rightAttendanceAt = right.attendanceAt || ""

        return rightAttendanceAt.localeCompare(leftAttendanceAt, undefined, { sensitivity: "base" })
      })

    return NextResponse.json({
      success: true,
      data: {
        users: compiledUsers,
        attendanceRecords: compiledAttendance,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to load attendance data:", error)
    return NextResponse.json({ success: false, error: "Failed to load attendance data" }, { status: 500 })
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
    const identifier = asString(body?.email || body?.userId || body?.identifier || body?.scannedUserId)
    const source: "manual" | "scanner" = body?.source === "scanner" ? "scanner" : "manual"

    if (!identifier) {
      return NextResponse.json({ success: false, error: "Email or userId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users") as Collection<MongoUserRecord>
    const attendanceCollection = db.collection("attendance") as Collection<AttendanceDbRecord>

    const user = await resolveUserByIdentifier(usersCollection, identifier)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const providedDate = body?.attendanceAt ? new Date(body.attendanceAt) : new Date()
    if (Number.isNaN(providedDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid attendance date and time" }, { status: 400 })
    }

    const attendanceParts = formatAttendanceParts(providedDate)
    const attendanceKey = getAttendanceKey(user)
    const existingAttendance = await attendanceCollection.findOne({
      attendanceKey,
      attendanceDate: attendanceParts.attendanceDate,
    })

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance has already been logged for today.",
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const payload = {
      attendanceKey,
      userId: user.userId ?? null,
      clerkId: user.clerkId || "",
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName: getFullName(user.firstName, user.lastName, user.email),
      ...attendanceParts,
      source,
      updatedAt: now,
    }

    await attendanceCollection.insertOne({
      ...payload,
      createdAt: now,
    })

    const savedAttendance = await attendanceCollection.findOne({
      attendanceKey,
      attendanceDate: attendanceParts.attendanceDate,
    })

    return NextResponse.json({
      success: true,
      action: existingAttendance ? "updated" : "created",
      data: {
        user: {
          id: user._id,
          attendanceKey,
          userId: user.userId ?? null,
          clerkId: user.clerkId || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          fullName: getFullName(user.firstName, user.lastName, user.email),
          email: user.email || "",
          course: user.course || "",
        },
        attendanceRecord: toAttendanceResponse(savedAttendance as AttendanceDbRecord | null),
      },
    })
  } catch (error) {
    console.error("Failed to save attendance record:", error)
    return NextResponse.json({ success: false, error: "Failed to save attendance record" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    void request
    return NextResponse.json({ success: false, error: "Editing attendance records is disabled." }, { status: 405 })
  } catch (error) {
    console.error("Failed to update attendance record:", error)
    return NextResponse.json({ success: false, error: "Failed to update attendance record" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const attendanceId = asString(body?.attendanceId)

    if (!attendanceId || !ObjectId.isValid(attendanceId)) {
      return NextResponse.json({ success: false, error: "attendanceId is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const attendanceCollection = db.collection("attendance") as Collection<AttendanceDbRecord>

    const deleteResult = await attendanceCollection.deleteOne({ _id: new ObjectId(attendanceId) })
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Attendance record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error("Failed to delete attendance record:", error)
    return NextResponse.json({ success: false, error: "Failed to delete attendance record" }, { status: 500 })
  }
}