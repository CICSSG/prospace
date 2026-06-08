import { auth } from "@clerk/nextjs/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ensureCompanyModeratorAccounts, normalizeEmailList, removeCompanyModeratorAccounts } from "../company-users"
import { getManagementPageAccessState } from "@/lib/management-access"

export async function PUT(req: Request) {
  try {
    const { sessionClaims, userId } = await auth()
    const metadata = sessionClaims?.publicMetadata as
      | {
          role?: "user" | "admin" | null
          adminRole?: "superadmin" | "admin" | null
          assignedCompany?: string | null
          isAdmin?: boolean
        }
      | undefined

    const {
      id,
      imageUrl,
      name,
      logoUrl,
      socialLinks,
      companyEmail,
      moderatorEmails,
      description,
    } = await req.json()

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID is required" }),
        { status: 400 }
      )
    }

    if (!userId || !Boolean(metadata?.isAdmin)) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 403 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const companiesCollection = db.collection("companies")

    const companyObjectId = new ObjectId(id)
    const companyId = companyObjectId.toString()

    const canEditCompanyDashboard = getManagementPageAccessState(
      metadata,
      "company",
      ["/company/dashboard", "company/dashboard"]
    ).canEdit

    if (metadata?.adminRole !== "superadmin") {
      const assignedCompany = String(metadata?.assignedCompany || "").trim()
      if (assignedCompany) {
        if (assignedCompany !== companyId) {
          return new Response(
            JSON.stringify({ success: false, message: "You can only update your assigned company" }),
            { status: 403 }
          )
        }
      } else if (!canEditCompanyDashboard) {
        return new Response(
          JSON.stringify({ success: false, message: "You do not have permission to update companies" }),
          { status: 403 }
        )
      }
    }

    // Fetch old company to detect removed moderator emails
    const oldCompany = await companiesCollection.findOne({ _id: companyObjectId })
    const oldModeratorEmails = normalizeEmailList(oldCompany?.moderatorEmails || [])

    const newModeratorEmails = Array.isArray(moderatorEmails)
      ? normalizeEmailList(moderatorEmails)
      : typeof moderatorEmails === "string"
        ? normalizeEmailList([moderatorEmails])
        : []

    // Find emails that were removed
    const removedEmails = oldModeratorEmails.filter(
      (email) => !newModeratorEmails.includes(email)
    )

    await companiesCollection.updateOne(
      { _id: companyObjectId },
      {
        $set: {
          imageUrl,
          name,
          logoUrl,
          socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
          companyEmail,
          moderatorEmails: newModeratorEmails,
          description,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    // Ensure new/updated moderators have correct company metadata
    await ensureCompanyModeratorAccounts({
      companyId,
      companyName: name,
      moderatorEmails: newModeratorEmails,
    })

    // Revert removed moderators back to user role
    if (removedEmails.length > 0) {
      await removeCompanyModeratorAccounts(removedEmails)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Company updated successfully",
        companyId,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating company:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update company" }),
      { status: 500 }
    )
  }
}
