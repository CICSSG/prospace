import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { ManagementAccessMetadata } from "@/lib/management-access"

type BucketPoint = { month: string; count: number }  // "month" keeps the key name for compat
type SourcePoint = { source: string; count: number }

export type CompanyRankEntry = {
  rank: number
  companyId: string
  companyName: string
  checkInCount: number
  uniqueUsers: number
  percentage: number
  firstCheckIn: string
}

export type MissionRankEntry = {
  missionTitle: string
  count: number
}

export type AnalyticsData = {
  totalUsers: number
  regularUsers: number
  adminUsers: number
  usersWithPortfolio: number
  usersWithResume: number
  usersWithSocialLinks: number
  totalCompanies: number
  totalSessions: number
  upcomingSessions: number
  totalCheckIns: number
  totalAttendance: number
  attendanceSources: SourcePoint[]
  totalMissions: number
  totalMissionCompletions: number
  totalConnections: number
  usersByMonth: BucketPoint[]
  checkInsByMonth: BucketPoint[]
  attendanceByMonth: BucketPoint[]
  missionCompletionsByMonth: BucketPoint[]
  checkInSources: SourcePoint[]
  companyRanking: CompanyRankEntry[]
  topMissions: MissionRankEntry[]
  lastUpdated: string
  rangeFrom: string
  rangeTo: string
  bucketMs: number   // ms per bucket — tells the client how to label each of the 12 slots
}

// ─── Bucketing helpers ──────────────────────────────────────────────────────────

// MongoDB _id expression: maps any date/ISO field to a 0-based bucket index string.
// Works for both ISO timestamp strings (createdAt) and YYYY-MM-DD strings (checkInDate).
function buildGroupId(
  field: string,
  startMs: number,
  bucketMs: number
): Record<string, unknown> {
  return {
    $toString: {
      $floor: {
        $divide: [
          { $subtract: [{ $toLong: { $toDate: `$${field}` } }, startMs] },
          bucketMs,
        ],
      },
    },
  }
}

// The 12 expected keys for zero-filling: ["0", "1", ..., "11"]
const INDEX_KEYS = Array.from({ length: 12 }, (_, i) => String(i))

function fillBuckets(raw: Array<{ _id: unknown; count: unknown }>): BucketPoint[] {
  const map = new Map(raw.map((r) => [String(r._id), Number(r.count) || 0]))
  return INDEX_KEYS.map((k) => ({ month: k, count: map.get(k) ?? 0 }))
}

export async function GET(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !metadata?.isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const now = new Date()
    const todayISO = now.toISOString().slice(0, 10)
    const defaultFromDate = new Date(now)
    defaultFromDate.setFullYear(defaultFromDate.getFullYear() - 1)
    const defaultFrom = defaultFromDate.toISOString().slice(0, 10)

    const from = request.nextUrl.searchParams.get("from") || defaultFrom
    const to = (() => {
      const raw = request.nextUrl.searchParams.get("to") || todayISO
      return raw > todayISO ? todayISO : raw
    })()

    // ISO bounds for createdAt fields
    const fromISO = new Date(from + "T00:00:00.000Z").toISOString()
    const toISO   = new Date(to   + "T23:59:59.999Z").toISOString()

    // Epoch bounds used for bucket arithmetic
    const startMs  = new Date(from + "T00:00:00.000Z").getTime()
    const endMs    = new Date(to   + "T23:59:59.999Z").getTime()

    // Always exactly 12 evenly-spaced buckets covering [startMs, endMs]
    const bucketMs = Math.ceil((endMs - startMs) / 12)

    const todayDate = todayISO

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)

    const [
      totalUsers,
      regularUsers,
      adminUsers,
      usersWithPortfolio,
      usersWithResume,
      usersWithSocialLinks,
      totalCompanies,
      allCompanies,
      totalSessions,
      upcomingSessions,
      totalCheckIns,
      checkInsByMonthRaw,
      checkInSourcesRaw,
      companyCheckInRaw,
      totalAttendance,
      attendanceByMonthRaw,
      attendanceSourcesRaw,
      totalMissions,
      allMissions,
      totalMissionCompletions,
      missionCompletionsByMonthRaw,
      topMissionsRaw,
      usersByMonthRaw,
      totalConnections,
    ] = await Promise.all([
      // Users registered in range
      db.collection("users").countDocuments({ createdAt: { $gte: fromISO, $lte: toISO } }),
      db.collection("users").countDocuments({ role: "user",  createdAt: { $gte: fromISO, $lte: toISO } }),
      db.collection("users").countDocuments({ role: "admin", createdAt: { $gte: fromISO, $lte: toISO } }),
      // Profile completeness — current state, no date filter
      db.collection("users").countDocuments({ portfolioLink: { $exists: true, $ne: "" } }),
      db.collection("users").countDocuments({ resumeLink:    { $exists: true, $ne: "" } }),
      db.collection("users").countDocuments({ "socialLinks.0": { $exists: true } }),
      // Companies added in range
      db.collection("companies").countDocuments({ createdAt: { $gte: fromISO, $lte: toISO } }),
      // All companies for ranking join
      db.collection("companies").find({}, { projection: { name: 1 } }).toArray(),
      // Sessions in range
      db.collection("sessions").countDocuments({ sessionDate: { $gte: from, $lte: to } }),
      // Upcoming sessions: from today through end of range
      db.collection("sessions").countDocuments({ sessionDate: { $gte: todayDate, $lte: to } }),
      // Check-ins in range — bucket by epoch index
      db.collection("companyCheckins").countDocuments({ checkInDate: { $gte: from, $lte: to } }),
      db.collection("companyCheckins").aggregate([
        { $match: { checkInDate: { $gte: from, $lte: to } } },
        { $group: { _id: buildGroupId("checkInAt", startMs, bucketMs), count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("companyCheckins").aggregate([
        { $match: { checkInDate: { $gte: from, $lte: to } } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("companyCheckins").aggregate([
        { $match: { checkInDate: { $gte: from, $lte: to } } },
        { $group: {
          _id: "$companyId",
          companyName:  { $first: "$companyName" },
          count:        { $sum: 1 },
          uniqueUsers:  { $addToSet: "$clerkId" },
          firstCheckIn: { $min: "$checkInDate" },
        }},
        { $sort: { count: -1 } },
      ]).toArray(),
      // Attendance in range — bucket by epoch index
      db.collection("attendance").countDocuments({ attendanceDate: { $gte: from, $lte: to } }),
      db.collection("attendance").aggregate([
        { $match: { attendanceDate: { $gte: from, $lte: to } } },
        { $group: { _id: buildGroupId("attendanceAt", startMs, bucketMs), count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("attendance").aggregate([
        { $match: { attendanceDate: { $gte: from, $lte: to } } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]).toArray(),
      // Missions — all-time inventory
      db.collection("missions").countDocuments({}),
      db.collection("missions").find({}, { projection: { missionTitle: 1, title: 1 } }).toArray(),
      // Mission completions in range — bucket by epoch index
      db.collection("missionCompletions").countDocuments({ createdAt: { $gte: fromISO, $lte: toISO } }),
      db.collection("missionCompletions").aggregate([
        { $match: { createdAt: { $gte: fromISO, $lte: toISO } } },
        { $group: { _id: buildGroupId("createdAt", startMs, bucketMs), count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("missionCompletions").aggregate([
        { $match: { createdAt: { $gte: fromISO, $lte: toISO } } },
        { $group: { _id: "$missionId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),
      // Users by registration — bucket by epoch index
      db.collection("users").aggregate([
        { $match: { createdAt: { $gte: fromISO, $lte: toISO } } },
        { $group: { _id: buildGroupId("createdAt", startMs, bucketMs), count: { $sum: 1 } } },
      ]).toArray(),
      // Connections — all time
      db.collection("connect").countDocuments({}),
    ])

    const checkInByCompanyId = new Map(companyCheckInRaw.map((c) => [String(c._id), c]))
    const companyRanking: CompanyRankEntry[] = allCompanies
      .map((company) => {
        const id = String(company._id)
        const ci = checkInByCompanyId.get(id)
        return {
          companyId:    id,
          companyName:  String(company.name || "Unnamed company"),
          checkInCount: Number(ci?.count) || 0,
          uniqueUsers:  Array.isArray(ci?.uniqueUsers) ? (ci.uniqueUsers as unknown[]).length : 0,
          firstCheckIn: String(ci?.firstCheckIn || ""),
          percentage:   0,
          rank:         0,
        }
      })
      .sort((a, b) => b.checkInCount - a.checkInCount)
      .map((entry, i) => ({
        ...entry,
        rank:       i + 1,
        percentage: totalCheckIns > 0 ? Math.round((entry.checkInCount / totalCheckIns) * 1000) / 10 : 0,
      }))

    const missionTitleById = new Map(
      allMissions.map((m) => [
        String(m._id),
        String((m as Record<string, unknown>).missionTitle || (m as Record<string, unknown>).title || "Untitled mission"),
      ])
    )
    const topMissions: MissionRankEntry[] = topMissionsRaw.map((m) => ({
      missionTitle: missionTitleById.get(String(m._id)) ?? "Unknown mission",
      count: Number(m.count) || 0,
    }))

    const data: AnalyticsData = {
      totalUsers,
      regularUsers,
      adminUsers,
      usersWithPortfolio,
      usersWithResume,
      usersWithSocialLinks,
      totalCompanies,
      totalSessions,
      upcomingSessions,
      totalCheckIns,
      totalAttendance,
      attendanceSources: (attendanceSourcesRaw as Array<{ _id: unknown; count: unknown }>).map((s) => ({
        source: String(s._id || "unknown"),
        count:  Number(s.count) || 0,
      })),
      totalMissions,
      totalMissionCompletions,
      totalConnections,
      usersByMonth:             fillBuckets(usersByMonthRaw             as Array<{ _id: unknown; count: unknown }>),
      checkInsByMonth:          fillBuckets(checkInsByMonthRaw          as Array<{ _id: unknown; count: unknown }>),
      attendanceByMonth:        fillBuckets(attendanceByMonthRaw        as Array<{ _id: unknown; count: unknown }>),
      missionCompletionsByMonth:fillBuckets(missionCompletionsByMonthRaw as Array<{ _id: unknown; count: unknown }>),
      checkInSources: (checkInSourcesRaw as Array<{ _id: unknown; count: unknown }>).map((s) => ({
        source: String(s._id || "unknown"),
        count:  Number(s.count) || 0,
      })),
      companyRanking,
      topMissions,
      lastUpdated: new Date().toISOString(),
      rangeFrom: from,
      rangeTo:   to,
      bucketMs,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Failed to build analytics:", error)
    return NextResponse.json({ success: false, error: "Failed to load analytics" }, { status: 500 })
  }
}
