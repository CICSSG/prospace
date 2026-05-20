import clientPromise from "@/lib/mongodb"
import { clerkClient } from "@clerk/nextjs/server"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const clerkclient = await clerkClient()
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (id) {
      const data = await db
        .collection("connect")
        .find({ user_id: id })
        .toArray()

      const connectionsWithUserData = []
      for (const connection of data) {
        if (connection.type === "user") {
          try {
            const usersCollection = db.collection("users")
            const userData = await usersCollection.findOne({
              clerkId: connection.user_connect,
            })

            if (!userData) {
              connectionsWithUserData.push({ ...connection })
              continue
            }

            const fullName =
              userData.fullName ||
              `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
              "Unknown User"
            const clerkUser = await clerkclient.users.getUser(userData.clerkId)
            const profileImageUrl = clerkUser.imageUrl || userData.profileImageUrl || userData.imageUrl || null
            const email = userData.email || "No email"
            connectionsWithUserData.push({
              ...connection,
              ...userData,
              fullName,
              profileImageUrl,
              email,
            })
          } catch (e) {
            connectionsWithUserData.push({ ...connection })
          }
        } else if (connection.type === "company") {
          try {
            const companiesColl = db.collection("companies")
            let company = null
            try {
              company = await companiesColl.findOne({ _id: new ObjectId(connection.user_connect) })
            } catch (err) {
              company = await companiesColl.findOne({ companyId: Number(connection.user_connect) })
            }

            if (company) {
              connectionsWithUserData.push({
                ...connection,
                ...company,
                _id: connection._id,
                user_connect: connection.user_connect,
                type: connection.type,
              })
            } else {
              connectionsWithUserData.push({ ...connection })
            }
          } catch (e) {
            connectionsWithUserData.push({ ...connection })
          }
        } else {
          connectionsWithUserData.push({ ...connection })
        }
      }

      //   console.log("Connections with user data fetched successfully:", connectionsWithUserData);

      return NextResponse.json({ success: true, data: connectionsWithUserData })
    } else {
      return NextResponse.json({
        success: false,
        error: "No search parameter given.",
      })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { user_id, user_connect_short, user_connect, type } = body

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const connectCollection = db.collection("connect")

    let final_user_connect: string | undefined

    if (type === "company") {
      if (!user_connect) {
        return new NextResponse(JSON.stringify({ error: "Missing company identifier" }), { status: 400, headers: { "Content-Type": "application/json" } })
      }

      const companiesCollection = db.collection("companies")
      let companyDoc = null
      try {
        companyDoc = await companiesCollection.findOne({ _id: new ObjectId(user_connect) })
      } catch (err) {
        companyDoc = await companiesCollection.findOne({ companyId: Number(user_connect) })
      }

      if (!companyDoc) {
        return new NextResponse(JSON.stringify({ error: "Company not found" }), { status: 404, headers: { "Content-Type": "application/json" } })
      }

      final_user_connect = companyDoc._id.toString()
    } else {
      const usersCollection = db.collection("users")
      const numericUserConnectShort = Number(user_connect_short)
      const userConnectQuery = Number.isNaN(numericUserConnectShort)
        ? { userId: user_connect_short }
        : {
            $or: [
              { userId: numericUserConnectShort },
              { userId: user_connect_short },
            ],
          }
      const user_connect_doc = await usersCollection.findOne(
        userConnectQuery,
        { projection: { clerkId: 1 } }
      )
      final_user_connect = user_connect_doc?.clerkId?.toString()

      if (user_id === final_user_connect) {
        return new NextResponse(
          JSON.stringify({ error: "Cannot connect to yourself" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      }
    }

    if (!user_id || !final_user_connect || !type) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const existingOption = await connectCollection.findOne({
      user_id,
      user_connect: final_user_connect,
      type,
    })
    if (existingOption) {
      return new NextResponse(
        JSON.stringify({ error: "Connection already exists for this user" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
    await connectCollection.insertOne({
      user_id,
      user_connect: final_user_connect,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return new NextResponse(
      JSON.stringify({ message: "Connected successfully" }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error creating connection:", error)
    return new NextResponse(
      JSON.stringify({ error: "Failed to create connection" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
