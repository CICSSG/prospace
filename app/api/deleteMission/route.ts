import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(req: Request) {
  try {
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

    await missionsCollection.deleteOne({ _id: new ObjectId(id) })

    return new Response(
      JSON.stringify({ success: true, message: "Mission deleted successfully" }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting mission:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to delete mission" }),
      { status: 500 }
    )
  }
}
