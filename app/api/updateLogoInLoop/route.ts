import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(req: Request) {
  try {
    const { id, companyName, companyUrl, logoUrl } = await req.json()

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID is required" }),
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const logoLoopCollection = db.collection("logoLoop")

    await logoLoopCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          companyName,
          companyUrl,
          logoUrl,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    return new Response(
      JSON.stringify({ success: true, message: "Logo updated successfully" }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating logo in loop:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update logo in loop" }),
      { status: 500 }
    )
  }
}
