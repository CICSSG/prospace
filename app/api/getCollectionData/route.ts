import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE);
    const url = new URL(req.url);
    const collection = url.searchParams.get("collection");
    if (collection) {
      if (collection === "missions") {
        // join missionCategories to attach categoryName at read time
        const data = await db
          .collection("missions")
          .aggregate([
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
          ])
          .toArray();

        return NextResponse.json({ success: true, data });
      }
      const data = await db.collection(collection).find({}).toArray();
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
