import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  const client = await clerkClient()
  const request = await req.json()
  const { firstName, lastName, email, course, shortBio, resumeLink } =
    request.value

  const user = await client.users.createUser({
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

  const mongoClient = await clientPromise
  const db = mongoClient.db(process.env.MONGODB_DATABASE)
  const usersCollection = db.collection("users")
  await usersCollection.insertOne({
    clerkId: user.id,
    firstName,
    lastName,
    email,
    course,
    shortBio,
    resumeLink,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).catch((error) => {
    console.error("Error inserting user into MongoDB:", error)
    throw error
  })

  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [email],
      subject: "Registration Successful - Welcome to ProSpace!",
      content: {
        title: "Welcome to ProSpace!",
        name: `${firstName} ${lastName}`,
        content: `Thank you for registering with ProSpace! We're excited to see you in our event!.`,
      },
    }),
  }).catch((error) => {
    console.error("Error sending email notification:", error)
  })

  return NextResponse.json({ message: "User created" })
}
