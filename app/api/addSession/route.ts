import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
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

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const sessionsCollection = db.collection("sessions")

    const insertResult = await sessionsCollection.insertOne({
      topicPictureUrl,
      logoUrl,
      sessionTitle,
      startTime,
      endTime,
      sessionDate,
      company,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Session added successfully",
        sessionId: insertResult.insertedId.toString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding session:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to add session" }),
      { status: 500 }
    )
  }
}
