import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(req: Request) {
  try {
    const {
      missionTitle,
      missionLink,
    } = await req.json()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID is required" }),
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const missionsCollection = db.collection("missions")

    await missionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          missionTitle,
          missionLink,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mission updated successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating mission:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update mission" }),
      { status: 500 }
    )
  }
}
