"use server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { put } from "@vercel/blob"
import { ObjectId } from "mongodb"
import { headers } from "next/headers"

import clientPromise from "@/lib/mongodb"
import { canAccessManagementPath, type ManagementAccessMetadata } from "@/lib/management-access"

export async function UploadImageToBlobStorage(file: File, filename: string) {
  // return {url: "https://www.prospace.com"}
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    maximumSizeInBytes: 15 * 1024 * 1024, // 15MB
  })
  return blob
}

export async function getCollectionData(collection: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/getCollectionData?collection=${collection}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch collection data")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching collection data:", error)
    throw error
  }
}

export async function getUser(user_id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/getUser?user_id=${user_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error
  }
}

export async function addLogoToLoop(
  companyName: string,
  companyUrl: string,
  logoUrl: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/addLogoToLoop`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName, companyUrl, logoUrl }),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to add logo to loop")
    }
    return response.json()
  } catch (error) {
    console.error("Error adding logo to loop:", error)
    throw error
  }
}

export async function deleteLogoFromLoop(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/deleteLogoFromLoop?id=${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },  
      }
    )
    if (!response.ok) {
      throw new Error("Failed to delete logo from loop")
    }
    return response.json()
  } catch (error) {
    console.error("Error deleting logo from loop:", error)
    throw error
  }
}

export async function updateLogoInLoop(
  id: string,
  companyName: string,
  companyUrl: string,
  logoUrl: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/updateLogoInLoop`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, companyName, companyUrl, logoUrl }),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to update logo in loop")
    }
    return response.json()
  } catch (error) {
    console.error("Error updating logo in loop:", error)
    throw error
  }
}

export type CompanySocialLink = {
  platform: string
  url: string
}

export type CompanyRecord = {
  imageUrl: string
  name: string
  logoUrl: string
  socialLinks: CompanySocialLink[]
  companyEmail: string
  moderatorEmails: string[]
  moderatorPasswords?: Record<string, string>
  description: string
}

export async function addCompanyToCollection(data: CompanyRecord) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/addCompany`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to add company")
    }
    return response.json()
  } catch (error) {
    console.error("Error adding company:", error)
    throw error
  }
}

export async function updateCompanyInCollection(
  id: string,
  data: CompanyRecord
) {
  try {
    const requestHeaders = await headers()
    const cookieHeader = requestHeaders.get("cookie")

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/updateCompany`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        body: JSON.stringify({ id, ...data }),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to update company")
    }
    return response.json()
  } catch (error) {
    console.error("Error updating company:", error)
    throw error
  }
}

export async function deleteCompanyFromCollection(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/deleteCompany?id=${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to delete company")
    }
    return response.json()
  } catch (error) {
    console.error("Error deleting company:", error)
    throw error
  }
}

type UserMissionRecord = {
  id: string
  userId: string | number | null
  firstName: string
  lastName: string
  email: string
  course: string
  shortBio: string
  fullName: string
  completedCount: number
  completedMissionIds: string[]
  completedMissions: Array<{
    missionId: string
    title: string
    description: string
    categoryId: string
    categoryName: string
    completionMethod: string
    completedAt: string
  }>
}

type UserMissionResponse = {
  users: UserMissionRecord[]
  missions: Array<{
    id: string
    title: string
    description: string
    categoryId: string
    categoryName: string
    completionMethod: string
  }>
  categories: Array<{
    id: string
    categoryName: string
  }>
  lastUpdated: string
}

function asString(value: unknown) {
  return value == null ? "" : String(value)
}

function getDisplayName(firstName?: string, lastName?: string, email?: string) {
  const name = `${firstName || ""} ${lastName || ""}`.trim()
  return name || email || "Unnamed user"
}

function normalizeMissionTitle(mission: { missionTitle?: string; title?: string }) {
  return mission.missionTitle || mission.title || "Unknown mission"
}

function isAuthorized(metadata: ManagementAccessMetadata | undefined) {
  return Boolean(metadata?.isAdmin) && canAccessManagementPath("/admin/user-missions", metadata?.pageAccess ?? undefined, metadata?.adminRole)
}

export async function getAdminUserMissionsData(): Promise<{ success: boolean; error?: string; data?: UserMissionResponse }> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return { success: false, error: "Unauthorized" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)

    const [userRows, missionRows, categoryRows, completionRows] = await Promise.all([
      db.collection("users").find({}).toArray(),
      db.collection("missions").find({}).toArray(),
      db.collection("missionCategories").find({}).toArray(),
      db.collection("missionCompletions").find({}).toArray(),
    ])

    const users = userRows as unknown as Array<{ _id: string; userId?: string | number; clerkId?: string; firstName?: string; lastName?: string; email?: string; course?: string; shortBio?: string }>
    const missionsSource = missionRows as unknown as Array<{ _id: string; missionTitle?: string; title?: string; description?: string; categoryId?: string; categoryName?: string; completionMethod?: string }>
    const categoriesSource = categoryRows as unknown as Array<{ _id: string; categoryName?: string }>
    const completionsSource = completionRows as unknown as Array<{ _id: string; userId?: string | number; missionId?: string; createdAt?: string; updatedAt?: string }>

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

    const missionsById = new Map<string, { id: string; title: string; description: string; categoryId: string; categoryName: string; completionMethod: string }>()

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

    const completionsByUser = new Map<string, Map<string, { createdAt?: string; updatedAt?: string }>>()
    for (const completion of completionsSource) {
      const userKey = asString(completion.userId)
      const missionKey = asString(completion.missionId)
      if (!userKey || !missionKey) continue

      const existing = completionsByUser.get(userKey) ?? new Map<string, { createdAt?: string; updatedAt?: string }>()
      existing.set(missionKey, { createdAt: completion.createdAt, updatedAt: completion.updatedAt })
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
          .filter((mission) => Boolean(mission))
          .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }))

        return {
          id: user._id,
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
      .filter(Boolean) as unknown as UserMissionRecord[]

    compiledUsers.sort((left, right) => {
      if (right.completedCount !== left.completedCount) {
        return right.completedCount - left.completedCount
      }

      const nameOrder = left.fullName.localeCompare(right.fullName, undefined, { sensitivity: "base" })
      if (nameOrder !== 0) return nameOrder

      return asString(left.userId).localeCompare(asString(right.userId), undefined, { sensitivity: "base" })
    })

    return {
      success: true,
      data: {
        users: compiledUsers,
        missions,
        categories,
        lastUpdated: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Failed to load admin user missions data:", error)
    return { success: false, error: "Failed to load user missions" }
  }
}

export async function getDataUserMissionsData(): Promise<{ success: boolean; error?: string; data?: UserMissionResponse }> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !Boolean(metadata?.isAdmin) || !canAccessManagementPath("/data/missions", metadata?.pageAccess ?? undefined, metadata?.adminRole)) {
      return { success: false, error: "Unauthorized" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)

    const [userRows, missionRows, categoryRows, completionRows] = await Promise.all([
      db.collection("users").find({}).toArray(),
      db.collection("missions").find({}).toArray(),
      db.collection("missionCategories").find({}).toArray(),
      db.collection("missionCompletions").find({}).toArray(),
    ])

    const users = userRows as unknown as Array<{ _id: string; userId?: string | number; clerkId?: string; firstName?: string; lastName?: string; email?: string; course?: string; shortBio?: string }>
    const missionsSource = missionRows as unknown as Array<{ _id: string; missionTitle?: string; title?: string; description?: string; categoryId?: string; categoryName?: string; completionMethod?: string }>
    const categoriesSource = categoryRows as unknown as Array<{ _id: string; categoryName?: string }>
    const completionsSource = completionRows as unknown as Array<{ _id: string; userId?: string | number; missionId?: string; createdAt?: string; updatedAt?: string }>

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

    const missionsById = new Map<string, { id: string; title: string; description: string; categoryId: string; categoryName: string; completionMethod: string }>()

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

    const completionsByUser = new Map<string, Map<string, { createdAt?: string; updatedAt?: string }>>()
    for (const completion of completionsSource) {
      const userKey = asString(completion.userId)
      const missionKey = asString(completion.missionId)
      if (!userKey || !missionKey) continue

      const existing = completionsByUser.get(userKey) ?? new Map<string, { createdAt?: string; updatedAt?: string }>()
      existing.set(missionKey, { createdAt: completion.createdAt, updatedAt: completion.updatedAt })
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
          .filter((mission) => Boolean(mission))
          .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }))

        return {
          id: user._id,
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
      .filter(Boolean) as unknown as UserMissionRecord[]

    compiledUsers.sort((left, right) => {
      if (right.completedCount !== left.completedCount) {
        return right.completedCount - left.completedCount
      }

      const nameOrder = left.fullName.localeCompare(right.fullName, undefined, { sensitivity: "base" })
      if (nameOrder !== 0) return nameOrder

      return asString(left.userId).localeCompare(asString(right.userId), undefined, { sensitivity: "base" })
    })

    return {
      success: true,
      data: {
        users: compiledUsers,
        missions,
        categories,
        lastUpdated: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Failed to load data user missions data:", error)
    return { success: false, error: "Failed to load user missions" }
  }
}

export async function updateAdminUserMissions(data: {
  userId: string | number | null
  missionIds: string[]
}) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorized(metadata)) {
      return { success: false, error: "Unauthorized" }
    }

    if (data.userId == null || !Array.isArray(data.missionIds)) {
      return { success: false, error: "userId and missionIds are required" }
    }

    const normalizedMissionIds = Array.from(new Set(data.missionIds.map((missionId) => asString(missionId).trim()).filter(Boolean)))
    if (normalizedMissionIds.some((missionId) => !ObjectId.isValid(missionId))) {
      return { success: false, error: "One or more mission ids are invalid" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")
    const missionsCollection = db.collection("missions")
    const completionsCollection = db.collection("missionCompletions")

    const numericUserId = Number(data.userId)
    const userQuery = Number.isNaN(numericUserId)
      ? { userId: data.userId }
      : { $or: [{ userId: numericUserId }, { userId: data.userId }] }

    const userDoc = (await usersCollection.findOne(userQuery)) as { userId?: string | number } | null
    if (!userDoc) {
      return { success: false, error: "User not found" }
    }

    const resolvedUserId = userDoc.userId ?? data.userId
    const missionObjectIds = normalizedMissionIds.map((missionId) => new ObjectId(missionId))

    const existingMissions = await missionsCollection.find({ _id: { $in: missionObjectIds } }).project({ _id: 1 }).toArray()
    if (existingMissions.length !== normalizedMissionIds.length) {
      return { success: false, error: "One or more missions were not found" }
    }

    const currentCompletions = (await completionsCollection.find({ userId: resolvedUserId }).toArray()) as unknown as Array<{ missionId?: string }>
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

    return {
      success: true,
      data: {
        userId: resolvedUserId,
        added: missionIdsToAdd.length,
        removed: missionIdsToRemove.length,
        missionIds: normalizedMissionIds,
      },
    }
  } catch (error) {
    console.error("Failed to update user mission completions:", error)
    return { success: false, error: "Failed to update user missions" }
  }
}

export async function updateDataUserMissions(data: {
  userId: string | number | null
  missionIds: string[]
}) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !Boolean(metadata?.isAdmin) || !canAccessManagementPath("/data/missions", metadata?.pageAccess ?? undefined, metadata?.adminRole)) {
      return { success: false, error: "Unauthorized" }
    }

    if (data.userId == null || !Array.isArray(data.missionIds)) {
      return { success: false, error: "userId and missionIds are required" }
    }

    const normalizedMissionIds = Array.from(new Set(data.missionIds.map((missionId) => asString(missionId).trim()).filter(Boolean)))
    if (normalizedMissionIds.some((missionId) => !ObjectId.isValid(missionId))) {
      return { success: false, error: "One or more mission ids are invalid" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")
    const missionsCollection = db.collection("missions")
    const completionsCollection = db.collection("missionCompletions")

    const numericUserId = Number(data.userId)
    const userQuery = Number.isNaN(numericUserId)
      ? { userId: data.userId }
      : { $or: [{ userId: numericUserId }, { userId: data.userId }] }

    const userDoc = (await usersCollection.findOne(userQuery)) as { userId?: string | number } | null
    if (!userDoc) {
      return { success: false, error: "User not found" }
    }

    const resolvedUserId = userDoc.userId ?? data.userId
    const missionObjectIds = normalizedMissionIds.map((missionId) => new ObjectId(missionId))

    const existingMissions = await missionsCollection.find({ _id: { $in: missionObjectIds } }).project({ _id: 1 }).toArray()
    if (existingMissions.length !== normalizedMissionIds.length) {
      return { success: false, error: "One or more missions were not found" }
    }

    const currentCompletions = (await completionsCollection.find({ userId: resolvedUserId }).toArray()) as unknown as Array<{ missionId?: string }>
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

    return {
      success: true,
      data: {
        userId: resolvedUserId,
        added: missionIdsToAdd.length,
        removed: missionIdsToRemove.length,
        missionIds: normalizedMissionIds,
      },
    }
  } catch (error) {
    console.error("Failed to update data mission completions:", error)
    return { success: false, error: "Failed to update user missions" }
  }
}

export async function scanClerkUsersToMongo(): Promise<{ success: boolean; totalScanned?: number; totalAdded?: number; totalExisting?: number; error?: string }> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !Boolean(metadata?.isAdmin) || !canAccessManagementPath("/admin/users", metadata?.pageAccess ?? undefined, metadata?.adminRole)) {
      return { success: false, error: "Unauthorized" }
    }

    const clerk = await clerkClient()
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")

    let page = 1
    const limit = 100
    let totalScanned = 0
    let totalAdded = 0
    let totalExisting = 0

    while (true) {
      const listRes = await clerk.users.getUserList({ limit, offset: (page - 1) * limit })
      const entries: any[] = Array.isArray(listRes) ? listRes : (listRes as any).data || (listRes as any).users || []
      if (!entries || entries.length === 0) break

      for (const clerkUser of entries) {
        totalScanned += 1
        const clerkId = clerkUser.id
        const existing = await usersCollection.findOne({ clerkId })
        if (existing) {
          totalExisting += 1
          continue
        }

        const firstNameVal = (clerkUser.firstName || "").trim()
        const lastNameVal = (clerkUser.lastName || "").trim()
        const emailVal = (clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) || (clerkUser.primaryEmailAddress as string) || ""

        await usersCollection.insertOne({
          clerkId,
          firstName: firstNameVal,
          lastName: lastNameVal,
          email: emailVal,
          course: "",
          shortBio: "",
          socialLinks: [],
          portfolioLink: "",
          resumeUpdate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).catch((error) => {
          console.error("Error inserting user into MongoDB during scan:", error)
        })

        totalAdded += 1
      }

      if (entries.length < limit) break
      page += 1
    }

    return { success: true, totalScanned, totalAdded, totalExisting }
  } catch (error) {
    console.error("Failed to scan Clerk users:", error)
    return { success: false, error: "Failed to scan Clerk users" }
  }
}

export async function getCompaniesForAssignment(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string }>
  error?: string
}> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !Boolean(metadata?.isAdmin)) {
      return { success: false, error: "Unauthorized" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const companies = await db.collection("companies").find({}).project({ _id: 1, name: 1 }).sort({ name: 1 }).toArray()

    return {
      success: true,
      data: companies.map((c) => ({
        id: String(c._id),
        name: String(c.name || ""),
      })),
    }
  } catch (error) {
    console.error("Failed to fetch companies for assignment:", error)
    return { success: false, error: "Failed to fetch companies" }
  }
}

export async function inspectOrCreateMongoUserByEmail(data: {
  email: string
  createIfMissing?: boolean
}): Promise<{
  success: boolean
  clerkFound?: boolean
  mongoExists?: boolean
  created?: boolean
  clerkId?: string
  email?: string
  firstName?: string
  lastName?: string
  error?: string
}> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !Boolean(metadata?.isAdmin) || !canAccessManagementPath("/admin/users", metadata?.pageAccess ?? undefined, metadata?.adminRole)) {
      return { success: false, error: "Unauthorized" }
    }

    const email = data.email.trim().toLowerCase()
    if (!email) {
      return { success: false, error: "Email is required" }
    }

    const clerk = await clerkClient()
    const mongoClient = await clientPromise
    const db = mongoClient.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")

    const existingUsers = await clerk.users.getUserList({ emailAddress: [email], limit: 1 })
    const clerkUser = existingUsers.data[0]

    if (!clerkUser) {
      return { success: false, clerkFound: false, mongoExists: false, error: "No Clerk account found for that email" }
    }

    const existingMongoUser = await usersCollection.findOne({ clerkId: clerkUser.id })
    if (existingMongoUser) {
      return {
        success: true,
        clerkFound: true,
        mongoExists: true,
        created: false,
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
      }
    }

    if (!data.createIfMissing) {
      return {
        success: true,
        clerkFound: true,
        mongoExists: false,
        created: false,
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
      }
    }

    const firstName = clerkUser.firstName ?? ""
    const lastName = clerkUser.lastName ?? ""

    await usersCollection.insertOne({
      clerkId: clerkUser.id,
      firstName,
      lastName,
      email,
      course: "",
      shortBio: "",
      socialLinks: [],
      portfolioLink: "",
      resumeUpdate: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch((error) => {
      console.error("Error inserting user into MongoDB:", error)
      throw error
    })

    return {
      success: true,
      clerkFound: true,
      mongoExists: false,
      created: true,
      clerkId: clerkUser.id,
      email,
      firstName,
      lastName,
    }
  } catch (error) {
    console.error("Failed to inspect or create Mongo user by email:", error)
    return { success: false, error: "Failed to inspect or create user data" }
  }
}

// ── User Check-ins ──────────────────────────────────────────────────────────

type CheckInCompanySummary = {
  checkInId: string
  companyId: string
  companyName: string
  checkInAt: string
  checkInDate: string
  source: "manual" | "scanner"
}

export type UserCheckInRecord = {
  id: string
  userId: string | number | null
  clerkId: string
  checkInKey: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  course: string
  checkInCount: number
  checkedInCompanyIds: string[]
  checkedInCompanies: CheckInCompanySummary[]
}

export type UserCheckInsResponse = {
  users: UserCheckInRecord[]
  companies: Array<{ id: string; name: string }>
  lastUpdated: string
}

function isAuthorizedForUserCheckIns(metadata: ManagementAccessMetadata | undefined) {
  return Boolean(metadata?.isAdmin) && canAccessManagementPath("/admin/user-checkins", metadata?.pageAccess ?? undefined, metadata?.adminRole)
}

export async function getAdminUserCheckInsData(): Promise<{
  success: boolean
  error?: string
  data?: UserCheckInsResponse
}> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorizedForUserCheckIns(metadata)) {
      return { success: false, error: "Unauthorized" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)

    const [userRows, companyRows, checkInRows] = await Promise.all([
      db.collection("users").find({}).toArray(),
      db.collection("companies").find({}).project({ _id: 1, name: 1 }).sort({ name: 1 }).toArray(),
      db.collection("companyCheckins").find({}).toArray(),
    ])

    const users = userRows as unknown as Array<{
      _id: string
      userId?: string | number | null
      clerkId?: string
      firstName?: string
      lastName?: string
      email?: string
      course?: string
    }>

    const companies = companyRows.map((c) => ({
      id: asString(c._id),
      name: asString(c.name || "Unnamed company"),
    }))

    const companyNamesById = new Map(companies.map((c) => [c.id, c.name]))

    const checkIns = checkInRows as unknown as Array<{
      _id: string
      checkInKey?: string
      companyId?: string
      companyName?: string
      checkInAt?: string
      checkInDate?: string
      source?: string
    }>

    const checkInsByKey = new Map<string, CheckInCompanySummary[]>()
    for (const checkIn of checkIns) {
      const key = checkIn.checkInKey || ""
      if (!key || !checkIn.companyId) continue
      const list = checkInsByKey.get(key) ?? []
      list.push({
        checkInId: asString(checkIn._id),
        companyId: checkIn.companyId,
        companyName: companyNamesById.get(checkIn.companyId) || checkIn.companyName || "Unknown company",
        checkInAt: checkIn.checkInAt || "",
        checkInDate: checkIn.checkInDate || "",
        source: checkIn.source === "scanner" ? "scanner" : "manual",
      })
      checkInsByKey.set(key, list)
    }

    const compiledUsers: UserCheckInRecord[] = users
      .map((user) => {
        const checkInKey = asString(user.userId || user.clerkId || user._id)
        if (!checkInKey) return null

        const checkedInCompanies = checkInsByKey.get(checkInKey) ?? []

        return {
          id: asString(user._id),
          userId: user.userId ?? null,
          clerkId: user.clerkId || "",
          checkInKey,
          fullName: getDisplayName(user.firstName, user.lastName, user.email),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          course: user.course || "",
          checkInCount: checkedInCompanies.length,
          checkedInCompanyIds: checkedInCompanies.map((c) => c.companyId),
          checkedInCompanies,
        }
      })
      .filter(Boolean) as UserCheckInRecord[]

    compiledUsers.sort((a, b) => {
      const countDiff = b.checkInCount - a.checkInCount
      if (countDiff !== 0) return countDiff
      return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" })
    })

    return {
      success: true,
      data: { users: compiledUsers, companies, lastUpdated: new Date().toISOString() },
    }
  } catch (error) {
    console.error("Failed to load admin user check-ins:", error)
    return { success: false, error: "Failed to load user check-ins" }
  }
}

export async function updateAdminUserCheckIns(data: {
  userMongoId: string
  companyIds: string[]
}): Promise<{ success: boolean; error?: string; data?: { added: number; removed: number } }> {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

    if (!userId || !isAuthorizedForUserCheckIns(metadata)) {
      return { success: false, error: "Unauthorized" }
    }

    if (!data.userMongoId || !Array.isArray(data.companyIds)) {
      return { success: false, error: "userMongoId and companyIds are required" }
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")
    const companiesCollection = db.collection("companies")
    const checkInsCollection = db.collection("companyCheckins")
    const connectCollection = db.collection("connect")

    const userQuery = ObjectId.isValid(data.userMongoId)
      ? { _id: new ObjectId(data.userMongoId) }
      : { _id: data.userMongoId as unknown }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (await usersCollection.findOne(userQuery as any)) as {
      _id: string | ObjectId
      userId?: string | number | null
      clerkId?: string
      firstName?: string
      lastName?: string
      email?: string
      course?: string
      shortBio?: string
      portfolioLink?: string
      socialLinks?: string[]
    } | null

    if (!user) {
      return { success: false, error: "User not found" }
    }

    const checkInKey = asString(user.userId || user.clerkId || user._id)
    const targetCompanyIds = Array.from(new Set(data.companyIds.filter(Boolean)))

    const existingCheckIns = (await checkInsCollection.find({ checkInKey }).toArray()) as unknown as Array<{
      _id: ObjectId
      companyId?: string
    }>

    const existingCompanyIds = new Set(existingCheckIns.map((c) => c.companyId || "").filter(Boolean))
    const targetSet = new Set(targetCompanyIds)

    const toAdd = targetCompanyIds.filter((id) => !existingCompanyIds.has(id))
    const toRemove = existingCheckIns.filter((c) => c.companyId && !targetSet.has(c.companyId))

    const now = new Date()
    const nowStr = now.toISOString()
    const checkInAt = nowStr
    const checkInDate = now.toLocaleDateString("en-CA")
    const checkInTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })

    if (toAdd.length > 0) {
      const companyQueryIds = toAdd.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)) as unknown as ObjectId[]
      const companyDocs = (await companiesCollection.find({ _id: { $in: companyQueryIds } }).toArray()) as unknown as Array<{
        _id: string | ObjectId
        name?: string
      }>
      const companyNamesById = new Map(companyDocs.map((c) => [asString(c._id), c.name || "Unknown company"]))
      const fullName = getDisplayName(user.firstName, user.lastName, user.email)

      await checkInsCollection.insertMany(
        toAdd.map((companyId) => ({
          companyId,
          companyName: companyNamesById.get(companyId) || "Unknown company",
          checkInKey,
          userId: user.userId ?? null,
          clerkId: user.clerkId || "",
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          fullName,
          course: user.course || "",
          shortBio: user.shortBio || "",
          portfolioLink: user.portfolioLink || "",
          socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks : [],
          checkInAt,
          checkInDate,
          checkInTime,
          source: "manual" as const,
          createdAt: nowStr,
          updatedAt: nowStr,
        }))
      )

      const userIdForConnect = user.clerkId || asString(user._id) || asString(user.userId)
      if (userIdForConnect) {
        for (const companyId of toAdd) {
          const existingConnect = await connectCollection.findOne({ user_id: userIdForConnect, user_connect: companyId, type: "company" })
          if (!existingConnect) {
            await connectCollection.insertOne({ user_id: userIdForConnect, user_connect: companyId, type: "company", createdAt: nowStr, updatedAt: nowStr })
          }
        }
      }
    }

    if (toRemove.length > 0) {
      await checkInsCollection.deleteMany({ _id: { $in: toRemove.map((c) => c._id) } })
    }

    return { success: true, data: { added: toAdd.length, removed: toRemove.length } }
  } catch (error) {
    console.error("Failed to update user check-ins:", error)
    return { success: false, error: "Failed to update user check-ins" }
  }
}