import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { syncSignupMissionProgress } from "@/lib/signup-mission-progress"

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const userDoc = await db.collection("users").findOne(
      { clerkId: clerkUserId },
      { projection: { userId: 1, clerkId: 1 } }
    )

    const syncResult = await syncSignupMissionProgress(db, {
      userId: userDoc?.userId ?? clerkUserId,
      clerkId: userDoc?.clerkId || clerkUserId,
    })

    return NextResponse.json({
      success: true,
      data: syncResult,
    })
  } catch (error) {
    console.error("Failed to load signup mission progress:", error)
    return NextResponse.json({ success: false, error: "Failed to load signup mission progress" }, { status: 500 })
  }
}
