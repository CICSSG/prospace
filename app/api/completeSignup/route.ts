import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const client = await clerkClient()
    const { email, shortBio, socialLinks, portfolioLink } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const mongoClient = await clientPromise
    const db = mongoClient.db(process.env.MONGODB_DATABASE)
    const tempUsersCollection = db.collection("tempUsers")

    // Get temporary user data
    const tempUser = await tempUsersCollection.findOne({ email })

    if (!tempUser) {
      return NextResponse.json(
        { error: "User data not found. Please start signup again." },
        { status: 404 }
      )
    }

    if (!tempUser.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified. Please verify your email first." },
        { status: 400 }
      )
    }

    const { firstName, lastName, course } = tempUser

    // Create Clerk user
    const clerkUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      publicMetadata: {
        role: "user",
      },
    }).catch((error) => {
      console.error("Error creating user in Clerk:", error)
      throw error
    })

    // Move to permanent users collection
    const usersCollection = db.collection("users")
    await usersCollection.insertOne({
      clerkId: clerkUser.id,
      firstName,
      lastName,
      email,
      course,
      shortBio: shortBio || "",
      socialLinks: socialLinks || [],
      portfolioLink: portfolioLink || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch((error) => {
      console.error("Error inserting user into MongoDB:", error)
      throw error
    })

    // Send thank you email
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [email],
        subject: "Registration Successful - Welcome to ProSpace!",
        content: {
          title: "Welcome to ProSpace!",
          name: firstName,
          content: `Thank you for registering with ProSpace! We're excited to see you in our event!`,
        },
      }),
    }).catch((error) => {
      console.error("Error sending thank you email:", error)
    })

    // Clean up temporary user data
    await tempUsersCollection.deleteOne({ email })

    return NextResponse.json({
      message: "Registration completed successfully",
      userId: clerkUser.id,
    })
  } catch (error) {
    console.error("Error completing signup:", error)
    return NextResponse.json(
      { error: "Failed to complete signup" },
      { status: 500 }
    )
  }
}
