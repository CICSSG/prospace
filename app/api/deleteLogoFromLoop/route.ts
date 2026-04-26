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
    const logoLoopCollection = db.collection("logoLoop")
    await logoLoopCollection.deleteOne({ _id: new ObjectId(id) })

    return new Response(
      JSON.stringify({ success: true, message: "Logo deleted successfully" }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting logo from loop:", error)
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to delete logo from loop",
      }),
      { status: 500 }
    )
  }
}
