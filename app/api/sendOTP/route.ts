import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const { email, firstName, lastName, course } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const mongoClient = await clientPromise
    const db = mongoClient.db(process.env.MONGODB_DATABASE)
    const usersCollection = db.collection("users")
    const tempUsersCollection = db.collection("tempUsers")

    // Check if email already exists in users collection
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please use a different email or sign in." },
        { status: 409 }
      )
    }

    // Check if email already exists in tempUsers collection (incomplete registration)
    const existingTempUser = await tempUsersCollection.findOne({ email })
    if (existingTempUser) {
      // Determine which step to send them to
      if (existingTempUser.emailVerified) {
        // Step 2 already complete, go to step 3
        return NextResponse.json(
          {
            message: "Registration found. Continuing to complete your profile.",
            nextStep: 3,
            userData: {
              firstName: existingTempUser.firstName,
              lastName: existingTempUser.lastName,
              email: existingTempUser.email,
              course: existingTempUser.course,
            },
          },
          { status: 200 }
        )
      } else {
        // Step 1 complete but Step 2 pending, go to step 2
        return NextResponse.json(
          {
            message: "Registration found. Please verify your email.",
            nextStep: 2,
            userData: {
              firstName: existingTempUser.firstName,
              lastName: existingTempUser.lastName,
              email: existingTempUser.email,
              course: existingTempUser.course,
            },
          },
          { status: 200 }
        )
      }
    }

    const otp = generateOTP()
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    const otpCollection = db.collection("otps")

    // Save OTP to database
    await otpCollection.updateOne(
      { email },
      {
        $set: {
          email,
          otp,
          expiryTime,
          used: false,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    )

    // Save initial user data temporarily
    await tempUsersCollection.updateOne(
      { email },
      {
        $set: {
          email,
          firstName,
          lastName,
          course,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    )

    // Send OTP email
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [email],
        subject: "Email Verification - Your OTP for ProSpace",
        content: {
          title: "Verify Your Email",
          name: firstName,
          content: `Your OTP is: ${otp}. This OTP is valid for 5 minutes. Do not share it with anyone.`,
        },
      }),
    }).catch((error) => {
      console.error("Error sending OTP email:", error)
    })

    return NextResponse.json({ message: "OTP sent successfully" })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
}
