import clientPromise from "@/lib/mongodb";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const client = await clerkClient();
    const url = new URL(req.url);
    const id = url.searchParams.get("user_id");
    if (id) {
      const data = await client.users.getUser(id);

      // console.log("User data fetched successfully:", data);
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