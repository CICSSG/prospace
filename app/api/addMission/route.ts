import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const {
      missionTitle,
      missionLink,
    } = await req.json()

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const missionsCollection = db.collection("missions")

    const insertResult = await missionsCollection.insertOne({
      missionTitle,
      missionLink,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mission added successfully",
        missionId: insertResult.insertedId.toString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding mission:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to add mission" }),
      { status: 500 }
    )
  }
}
