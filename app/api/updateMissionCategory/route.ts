import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(req: Request) {
  try {
    const { categoryName } = await req.json()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID is required" }),
        { status: 400 }
      )
    }

    const trimmedCategoryName = typeof categoryName === "string" ? categoryName.trim() : ""

    if (!trimmedCategoryName) {
      return new Response(
        JSON.stringify({ success: false, message: "Category name is required" }),
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const missionCategoriesCollection = db.collection("missionCategories")

    await missionCategoriesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          categoryName: trimmedCategoryName,
          updatedAt: new Date().toISOString(),
        },
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mission category updated successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating mission category:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update mission category" }),
      { status: 500 }
    )
  }
}