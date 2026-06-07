import { auth } from "@clerk/nextjs/server"
import { ObjectId } from "mongodb"
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
}

type MongoMissionRecord = {
  _id: string
  missionTitle?: string
  title?: string
  description?: string
  categoryId?: string
  categoryName?: string
  completionMethod?: string
}

type MongoMissionCategoryRecord = {
  _id: string
  categoryName?: string
}

type MongoMissionCompletionRecord = {
  _id: string
  userId?: string | number
  missionId?: string
  createdAt?: string
  updatedAt?: string
}

function getDisplayName(firstName?: string, lastName?: string, email?: string) {
  const name = `${firstName || ""} ${lastName || ""}`.trim()
  return name || email || "Unnamed user"
}

function asString(value: unknown) {
  return value == null ? "" : String(value)
}

function normalizeMissionTitle(mission: MongoMissionRecord | undefined) {
  return mission?.missionTitle || mission?.title || "Unknown mission"
}

function isAuthorized(metadata: ManagementAccessMetadata | undefined) {
  return Boolean(metadata?.isAdmin) && canAccessManagementPath("/admin/user-missions", metadata?.pageAccess ?? undefined, metadata?.adminRole)
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

    const [userRows, missionRows, categoryRows, completionRows] = await Promise.all([
      db.collection("users").find({}).toArray(),
      db.collection("missions").find({}).toArray(),
      db.collection("missionCategories").find({}).toArray(),
      db.collection("missionCompletions").find({}).toArray(),
    ])

    const users = userRows as unknown as MongoUserRecord[]
    const missionsSource = missionRows as unknown as MongoMissionRecord[]
    const categoriesSource = categoryRows as unknown as MongoMissionCategoryRecord[]
    const completionsSource = completionRows as unknown as MongoMissionCompletionRecord[]

    const categoryById = new Map<string, string>()
    const categories = categoriesSource
      .map((category) => ({
        id: asString(category._id),
        categoryName: category.categoryName?.trim() || "Uncategorized",
      }))
      .filter((category) => Boolean(category.id))
      .sort((left, right) => left.categoryName.localeCompare(right.categoryName, undefined, { sensitivity: "base" }))

    categories.forEach((category) => {
      categoryById.set(category.id, category.categoryName)
    })

    const missionsById = new Map<string, {
      id: string
      title: string
      description: string
      categoryId: string
      categoryName: string
      completionMethod: string
    }>()

    const missions = missionsSource
      .map((mission) => {
        const id = asString(mission._id)
        const categoryId = asString(mission.categoryId)
        const categoryName = mission.categoryName?.trim() || (categoryId ? categoryById.get(categoryId) : undefined) || "Uncategorized"

        const normalizedMission = {
          id,
          title: normalizeMissionTitle(mission),
          description: mission.description || "",
          categoryId,
          categoryName,
          completionMethod: mission.completionMethod || "",
        }

        if (id) {
          missionsById.set(id, normalizedMission)
        }

        return normalizedMission
      })
      .filter((mission) => Boolean(mission.id))
      .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }))

    const completionsByUser = new Map<string, Map<string, MongoMissionCompletionRecord>>()
    for (const completion of completionsSource) {
      const userKey = asString(completion.userId)
      const missionKey = asString(completion.missionId)

      if (!userKey || !missionKey) continue

      const existing = completionsByUser.get(userKey) ?? new Map<string, MongoMissionCompletionRecord>()
      existing.set(missionKey, completion)
      completionsByUser.set(userKey, existing)
    }

    const compiledUsers = users
      .map((user) => {
        const userKey = asString(user.userId)
        if (!userKey) return null

        const userCompletions = completionsByUser.get(userKey)

        const completedMissionIds = userCompletions ? Array.from(userCompletions.keys()) : []
        const completedMissions = completedMissionIds
          .map((missionId) => {
            const mission = missionsById.get(missionId)
            const completion = userCompletions ? userCompletions.get(missionId) : undefined

            return {
              missionId,
              title: mission?.title || "Unknown mission",
              description: mission?.description || "",
              categoryId: mission?.categoryId || "",
              categoryName: mission?.categoryName || "Uncategorized",
              completionMethod: mission?.completionMethod || "",
              completedAt: completion?.updatedAt || completion?.createdAt || "",
            }
          })
          .filter((mission): mission is NonNullable<typeof mission> => Boolean(mission))
          .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }))

        return {
          mongoId: user._id,
          userId: user.userId ?? userKey,
          clerkId: user.clerkId || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          fullName: getDisplayName(user.firstName, user.lastName, user.email),
          email: user.email || "",
          course: user.course || "",
          shortBio: user.shortBio || "",
          completedCount: completedMissions.length,
          completedMissionIds,
          completedMissions,
        }
      })
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .sort((left, right) => {
        if (right.completedCount !== left.completedCount) {
          return right.completedCount - left.completedCount
        }

        const nameOrder = left.fullName.localeCompare(right.fullName, undefined, { sensitivity: "base" })
        if (nameOrder !== 0) return nameOrder

        return asString(left.userId).localeCompare(asString(right.userId), undefined, { sensitivity: "base" })
      })

    return NextResponse.json({
      success: true,
      data: {
        users: compiledUsers,
        missions,
        categories,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to load admin user missions data:", error)
    return NextResponse.json({ success: false, error: "Failed to load user missions" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const targetUserId = body?.userId
    const missionIds = Array.isArray(body?.missionIds)
      ? body.missionIds.map((missionId: unknown) => asString(missionId).trim()).filter(Boolean)
      : null

    if (targetUserId == null || !missionIds) {
      return NextResponse.json({ success: false, error: "userId and missionIds are required" }, { status: 400 })
    }

    const normalizedMissionIds = Array.from(new Set(missionIds)) as string[]
    if (normalizedMissionIds.some((missionId) => !ObjectId.isValid(missionId))) {
      return NextResponse.json({ success: false, error: "One or more mission ids are invalid" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")
    const missionsCollection = db.collection("missions")
    const completionsCollection = db.collection("missionCompletions")

    const numericUserId = Number(targetUserId)
    const userQuery = Number.isNaN(numericUserId)
      ? { userId: targetUserId }
      : { $or: [{ userId: numericUserId }, { userId: targetUserId }] }

    const userDoc = (await usersCollection.findOne(userQuery)) as MongoUserRecord | null
    if (!userDoc) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const resolvedUserId = userDoc.userId ?? targetUserId
    const missionObjectIds = normalizedMissionIds.map((missionId) => new ObjectId(missionId))

    const existingMissions = await missionsCollection.find({ _id: { $in: missionObjectIds } }).project({ _id: 1 }).toArray()

    if (existingMissions.length !== normalizedMissionIds.length) {
      return NextResponse.json({ success: false, error: "One or more missions were not found" }, { status: 404 })
    }

    const currentCompletions = (await completionsCollection.find({ userId: resolvedUserId }).toArray()) as unknown as MongoMissionCompletionRecord[]
    const currentMissionIds = new Set(currentCompletions.map((completion) => asString(completion.missionId)).filter(Boolean))
    const targetMissionIds = new Set(normalizedMissionIds)

    const missionIdsToAdd = normalizedMissionIds.filter((missionId) => !currentMissionIds.has(missionId))
    const missionIdsToRemove = Array.from(currentMissionIds).filter((missionId) => !targetMissionIds.has(missionId))
    const now = new Date().toISOString()

    if (missionIdsToAdd.length > 0) {
      await completionsCollection.insertMany(
        missionIdsToAdd.map((missionId) => ({
          userId: resolvedUserId,
          missionId,
          createdAt: now,
          updatedAt: now,
        }))
      )
    }

    if (missionIdsToRemove.length > 0) {
      await completionsCollection.deleteMany({
        userId: resolvedUserId,
        missionId: { $in: missionIdsToRemove },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: resolvedUserId,
        added: missionIdsToAdd.length,
        removed: missionIdsToRemove.length,
        missionIds: normalizedMissionIds,
      },
    })
  } catch (error) {
    console.error("Failed to update user mission completions:", error)
    return NextResponse.json({ success: false, error: "Failed to update user missions" }, { status: 500 })
  }
}
