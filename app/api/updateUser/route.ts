import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { clerkClient } from "@clerk/nextjs/server"
import { buildExplicitPageAccess, hasAnyManagementPageAccess, type PageAccess } from "@/lib/management-access"

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      clerkId,
      role,
      adminRole,
      isAdmin,
      pageAccess,
      update,
      assignedCompany,
      companyId,
      companyName,
      assignedCompanies,
    } = body

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")

    if (role === "admin" && !hasAnyManagementPageAccess(pageAccess as PageAccess | undefined)) {
      return new Response(
        JSON.stringify({ success: false, message: "At least one view or edit permission is required for admin accounts" }),
        { status: 400 }
      )
    }

    if (update && clerkId) {
      const filter = id ? { _id: new ObjectId(id) } : { clerkId }

      const userUpdate: Record<string, unknown> = {
        firstName: update.firstName ?? null,
        lastName: update.lastName ?? null,
        shortBio: update.shortBio ?? null,
        course: update.course ?? null,
        portfolioLink: update.portfolioLink ?? null,
        socialLinks: Array.isArray(update.socialLinks) ? update.socialLinks : [],
        resumeUpdate: update.resumeUpdate ?? null,
        updatedAt: new Date().toISOString(),
      }

      if (Object.prototype.hasOwnProperty.call(update, "showResumeInConnect")) {
        userUpdate.showResumeInConnect = update.showResumeInConnect ?? null
      }

      const updateResult = await usersCollection.findOneAndUpdate(
        filter,
        {
          $set: userUpdate,
        },
        { returnDocument: "after" }
      )

      return new Response(
        JSON.stringify({
          success: true,
          message: "Profile updated successfully",
          data: updateResult?.value || null,
        }),
        { status: 200 }
      )
    }

    if (!id || !clerkId) {
      return new Response(
        JSON.stringify({ success: false, message: "ID and clerkId are required" }),
        { status: 400 }
      )
    }

    // Update MongoDB

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          updatedAt: new Date().toISOString(),
          role: role === "admin" ? "admin" : "user",
          adminRole: role === "admin" ? adminRole || "admin" : null,
          isAdmin: role === "admin",
          pageAccess: role === "admin" ? buildExplicitPageAccess(pageAccess as PageAccess | undefined) : null,
          assignedCompany: assignedCompany ?? null,
          companyId: companyId ?? null,
          companyName: companyName ?? null,
          assignedCompanies: Array.isArray(assignedCompanies) ? assignedCompanies : null,
        },
      }
    )

    // Update Clerk publicMetadata
    try {
      const publicMetadata: {
        isAdmin: boolean
        role: string | null
        adminRole: string | null
        pageAccess: unknown
        assignedCompany: string | null
        companyId: string | null
        companyName: string | null
        assignedCompanies: Array<{ id: string; name: string }> | null
      } = {
        isAdmin: role === "admin",
        role: null,
        adminRole: null,
        pageAccess: role === "admin" ? buildExplicitPageAccess(pageAccess as PageAccess | undefined) : null,
        assignedCompany: assignedCompany ?? null,
        companyId: companyId ?? null,
        companyName: companyName ?? null,
        assignedCompanies: Array.isArray(assignedCompanies) ? assignedCompanies : null,
      }

      if (role === "admin") {
        publicMetadata.role = "admin"
        publicMetadata.adminRole = adminRole || "admin"
      } else {
        publicMetadata.role = "user"
        publicMetadata.adminRole = null
      }

      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(clerkId, {
        publicMetadata,
      })
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError)
      // Continue anyway, the MongoDB update was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User updated successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating user:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update user" }),
      { status: 500 }
    )
  }
}
