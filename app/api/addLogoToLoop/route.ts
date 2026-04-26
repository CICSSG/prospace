import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { companyName, companyUrl, logoUrl } = await req.json()

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const logoLoopCollection = db.collection("logoLoop")
    await logoLoopCollection.insertOne({
      companyName,
      companyUrl,
      logoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // console.log("Received data:", { companyName, companyUrl, logoUrl })

    return new Response(
      JSON.stringify({ success: true, message: "Logo added successfully" }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error adding logo to loop:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to add logo to loop" }),
      { status: 500 }
    )
  }
}
