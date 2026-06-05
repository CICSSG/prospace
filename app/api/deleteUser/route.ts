import { clerkClient } from "@clerk/nextjs/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const clerkId = searchParams.get("clerkId")

    if (!id || !clerkId) {
      return new Response(
        JSON.stringify({ success: false, message: "ID and clerkId are required" }),
        { status: 400 }
      )
    }

    const clerk = await clerkClient()
    await clerk.users.deleteUser(clerkId)

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")

    await usersCollection.deleteOne({ _id: new ObjectId(id) })

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting user:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to delete user" }),
      { status: 500 }
    )
  }
}
