"use server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { put } from "@vercel/blob"
import { ObjectId } from "mongodb"

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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/updateCompany`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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