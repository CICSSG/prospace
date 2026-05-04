import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(req: Request) {
  try {
    const {
      topicPictureUrl,
      logoUrl,
      sessionTitle,
      startTime,
      endTime,
      sessionDate,
      company,
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
    const sessionsCollection = db.collection("sessions")

    await sessionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          topicPictureUrl,
          logoUrl,
          sessionTitle,
          startTime,
          endTime,
          sessionDate,
          company,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: "Session updated successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating session:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update session" }),
      { status: 500 }
    )
  }
}
