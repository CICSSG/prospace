import type { Db } from "mongodb"

type MissionRecord = {
  _id: unknown
  missionTitle?: string
  title?: string
  completionMethod?: string
  requiredSignups?: number | string | null
}

type UserIdentity = {
  userId?: string | number | null
  clerkId?: string | null
}

type SignupMissionProgress = {
  missionId: string
  title: string
  requiredSignups: number
  currentSignups: number
  isComplete: boolean
}

type SyncSignupMissionProgressResult = {
  currentSignups: number
  progress: SignupMissionProgress[]
  completedMissionIds: string[]
  addedCompletionIds: string[]
  removedCompletionIds: string[]
}

function asString(value: unknown) {
  return value == null ? "" : String(value)
}

function toPositiveInteger(value: unknown, fallback = 1) {
  const parsed = typeof value === "number" ? value : Number.parseInt(asString(value), 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.floor(parsed)
}

function buildCheckInQuery(userIdentity: UserIdentity) {
  const userIdCandidates: Array<string | number> = []
  const clerkIdCandidates: string[] = []

  if (userIdentity.userId !== null && userIdentity.userId !== undefined && userIdentity.userId !== "") {
    userIdCandidates.push(userIdentity.userId)

    const stringValue = asString(userIdentity.userId)
    if (stringValue) {
      userIdCandidates.push(stringValue)
    }
  }

  if (userIdentity.clerkId) {
    clerkIdCandidates.push(userIdentity.clerkId)
  }

  const queryParts: Array<Record<string, unknown>> = []

  if (userIdCandidates.length > 0) {
    queryParts.push({ userId: { $in: Array.from(new Set(userIdCandidates)) } })
  }

  if (clerkIdCandidates.length > 0) {
    queryParts.push({ clerkId: { $in: clerkIdCandidates } })
  }

  return queryParts.length > 0 ? { $or: queryParts } : null
}

export async function syncSignupMissionProgress(db: Db, userIdentity: UserIdentity): Promise<SyncSignupMissionProgressResult> {
  const completionUserId = userIdentity.userId ?? userIdentity.clerkId ?? null
  const checkInQuery = buildCheckInQuery(userIdentity)

  if (completionUserId === null || completionUserId === undefined || !checkInQuery) {
    return {
      currentSignups: 0,
      progress: [],
      completedMissionIds: [],
      addedCompletionIds: [],
      removedCompletionIds: [],
    }
  }

  const [checkInRows, missionRows, completionRows] = await Promise.all([
    db.collection("companyCheckins").find(checkInQuery).project({ companyId: 1 }).toArray(),
    db.collection("missions").find({ completionMethod: "sign-up" }).toArray(),
    db.collection("missionCompletions").find({ userId: completionUserId }).project({ missionId: 1 }).toArray(),
  ])

  const currentSignups = new Set<string>()
  for (const row of checkInRows as Array<{ companyId?: string }>) {
    const companyId = asString(row.companyId).trim()
    if (companyId) {
      currentSignups.add(companyId)
    }
  }

  const currentCompletionIds = new Set(
    (completionRows as Array<{ missionId?: string }>)
      .map((completion) => asString(completion.missionId).trim())
      .filter(Boolean)
  )

  const progress = (missionRows as MissionRecord[]).map((mission) => {
    const missionId = asString(mission._id)
    const requiredSignups = toPositiveInteger(mission.requiredSignups, 1)
    const currentCount = currentSignups.size
    const isComplete = currentCount >= requiredSignups

    return {
      missionId,
      title: mission.missionTitle || mission.title || "Untitled mission",
      requiredSignups,
      currentSignups: currentCount,
      isComplete,
    }
  })

  const targetCompleteMissionIds = progress.filter((item) => item.isComplete && item.missionId).map((item) => item.missionId)
  const missionIdsToAdd = targetCompleteMissionIds.filter((missionId) => !currentCompletionIds.has(missionId))

  const now = new Date().toISOString()

  if (missionIdsToAdd.length > 0) {
    await db.collection("missionCompletions").insertMany(
      missionIdsToAdd.map((missionId) => ({
        userId: completionUserId,
        missionId,
        createdAt: now,
        updatedAt: now,
      }))
    )
  }

  return {
    currentSignups: currentSignups.size,
    progress,
    completedMissionIds: targetCompleteMissionIds,
    addedCompletionIds: missionIdsToAdd,
    removedCompletionIds: [],
  }
}
