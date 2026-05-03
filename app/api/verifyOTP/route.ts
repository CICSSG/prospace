import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      )
    }

    const mongoClient = await clientPromise
    const db = mongoClient.db(process.env.MONGODB_DATABASE)
    const otpCollection = db.collection("otps")

    // Verify OTP
    const otpRecord = await otpCollection.findOne({ email })

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP not found. Please request a new OTP." },
        { status: 404 }
      )
    }

    if (otpRecord.used) {
      return NextResponse.json(
        { error: "OTP has already been used" },
        { status: 400 }
      )
    }

    if (new Date() > otpRecord.expiryTime) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      )
    }

    if (otpRecord.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    // Mark OTP as used
    await otpCollection.updateOne({ email }, { $set: { used: true } })

    // Mark temp user as verified
    const tempUsersCollection = db.collection("tempUsers")
    await tempUsersCollection.updateOne(
      { email },
      { $set: { emailVerified: true, verifiedAt: new Date().toISOString() } }
    )

    return NextResponse.json({ message: "OTP verified successfully" })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    )
  }
}
