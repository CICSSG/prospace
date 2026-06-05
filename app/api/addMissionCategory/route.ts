import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { categoryName } = await req.json()

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

    const now = new Date().toISOString()
    const insertResult = await missionCategoriesCollection.insertOne({
      categoryName: trimmedCategoryName,
      createdAt: now,
      updatedAt: now,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mission category added successfully",
        categoryId: insertResult.insertedId.toString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding mission category:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to add mission category" }),
      { status: 500 }
    )
  }
}