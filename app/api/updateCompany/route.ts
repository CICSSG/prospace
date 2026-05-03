import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ensureCompanyModeratorAccounts, normalizeEmailList, removeCompanyModeratorAccounts } from "../company-users"

export async function PUT(req: Request) {
  try {
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

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const companiesCollection = db.collection("companies")

    const companyId = new ObjectId(id).toString()

    // Fetch old company to detect removed moderator emails
    const oldCompany = await companiesCollection.findOne({ _id: new ObjectId(id) })
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
      { _id: new ObjectId(id) },
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
