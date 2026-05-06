import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { clerkClient } from "@clerk/nextjs/server"

export async function PUT(req: Request) {
  try {
    const {
      clerkId,
      role,
      adminRole,
      isAdmin,
    } = await req.json()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || !clerkId) {
      return new Response(
        JSON.stringify({ success: false, message: "ID and clerkId are required" }),
        { status: 400 }
      )
    }

    // Update MongoDB
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          updatedAt: new Date().toISOString(),
          role: role || null,
          adminRole: adminRole || null,
          isAdmin: isAdmin || false,
        },
      }
    )

    // Update Clerk publicMetadata
    try {
      const publicMetadata: any = {
        isAdmin: isAdmin || false,
      }

      if (role === "admin") {
        publicMetadata.role = "admin"
        publicMetadata.adminRole = adminRole || "admin"
      } else if (role === "data") {
        publicMetadata.role = "data"
      } else {
        publicMetadata.role = null
        publicMetadata.adminRole = null
      }

      const clerk = await clerkClient()
      await clerk.users.updateUserMetadata(clerkId, {
        publicMetadata,
      })
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError)
      // Continue anyway, the MongoDB update was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User updated successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating user:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update user" }),
      { status: 500 }
    )
  }
}
