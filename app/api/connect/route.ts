import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      const data = await db.collection("connect").find({ user_id: id }).toArray();
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({
        success: false,
        error: "No search parameter given.",
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { user_id, user_connect, type } = body;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const connectCollection = db.collection("connect");

    if (!user_id || !user_connect || !type) {
        return new NextResponse(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
    }

    const existingOption = await connectCollection.findOne({ user_id, user_connect, type });
    if (existingOption) {
        return new NextResponse(
            JSON.stringify({ error: "Connection already exists for this user" }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }
          );
    }
    await connectCollection.insertOne({
      user_id,
      user_connect,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return new NextResponse(
      JSON.stringify({ message: "Connected successfully" }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating connection:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create connection" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

