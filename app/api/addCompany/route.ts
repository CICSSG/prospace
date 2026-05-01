import clientPromise from "@/lib/mongodb"
import { ensureCompanyModeratorAccounts, normalizeEmailList } from "../company-users"

export async function POST(req: Request) {
  try {
    const {
      imageUrl,
      name,
      logoUrl,
      socialLinks,
      companyEmail,
      moderatorEmails,
      description,
    } = await req.json()

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const companiesCollection = db.collection("companies")

    const insertResult = await companiesCollection.insertOne({
      imageUrl,
      name,
      logoUrl,
      socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
      companyEmail,
      moderatorEmails: Array.isArray(moderatorEmails)
        ? normalizeEmailList(moderatorEmails)
        : typeof moderatorEmails === "string"
          ? normalizeEmailList([moderatorEmails])
          : [],
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await ensureCompanyModeratorAccounts({
      companyId: insertResult.insertedId.toString(),
      companyName: name,
      moderatorEmails: Array.isArray(moderatorEmails)
        ? moderatorEmails
        : typeof moderatorEmails === "string"
          ? [moderatorEmails]
          : [],
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Company added successfully",
        companyId: insertResult.insertedId.toString(),
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error adding company:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to add company" }),
      { status: 500 }
    )
  }
}
