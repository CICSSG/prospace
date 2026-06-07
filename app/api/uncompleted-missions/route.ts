import clientPromise from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);

    const usersCollection = db.collection("users");
    const completionsCollection = db.collection("missionCompletions");
    const missionsCollection = db.collection("missions");

    const userDoc = await usersCollection.findOne({ clerkId: clerkUserId }, { projection: { userId: 1 } });
    const resolvedUserId = (userDoc as any)?.userId ?? clerkUserId;

    const completions = await completionsCollection.find({ userId: resolvedUserId }).toArray();
    const completedIds = completions.map((c: any) => String(c.missionId));

    const pipeline: any[] = [
      { $addFields: { idStr: { $toString: "$_id" } } },
    ];

    if (completedIds.length) {
      pipeline.push({ $match: { idStr: { $nin: completedIds } } });
    }

    pipeline.push(
      {
        $lookup: {
          from: "missionCategories",
          let: { catId: "$categoryId" },
          pipeline: [
            { $addFields: { idStr: { $toString: "$_id" } } },
            { $match: { $expr: { $eq: ["$idStr", "$$catId"] } } },
            { $project: { _id: 1, categoryName: 1 } },
          ],
          as: "category",
        },
      },
      { $addFields: { categoryName: { $arrayElemAt: ["$category.categoryName", 0] } } },
      { $project: { category: 0 } },
      { $limit: 3 }
    );

    const data = await missionsCollection.aggregate(pipeline).toArray();

    // console.log("Uncompleted missions data:", data);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
