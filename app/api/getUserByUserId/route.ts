import clientPromise from "@/lib/mongodb"
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const url = new URL(req.url)
    const id = url.searchParams.get("user_id")

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "No search parameter given.",
      })
    }

    const numericId = Number(id)
    const query = Number.isNaN(numericId)
      ? { userId: id }
      : { userId: numericId }

    const data = await db.collection("users").findOne(query)

    if (!data) {
      return NextResponse.json({ success: true, data: null })
    }

    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(data.clerkId)

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          imageUrl: clerkUser.imageUrl,
          fullName: clerkUser.fullName || data.fullName,
          email: clerkUser.emailAddresses[0]?.emailAddress || data.email,
        },
      })
    } catch (clerkError) {
      console.error("Failed to fetch Clerk user data:", clerkError)
      return NextResponse.json({ success: true, data })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}