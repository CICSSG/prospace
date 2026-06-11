import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(req: Request) {
  try {
    const {
      missionTitle,
      title,
      description,
      completionMethod,
      requiredSignups,
      isRequired,
      links,
      missionLinks,
      missionLink,
      categoryId,
    } = await req.json()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID is required" }),
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)
    const missionsCollection = db.collection("missions")

    const normalizedLinks = Array.isArray(links)
      ? links
          .map((item: unknown) => {
            if (!item || typeof item !== "object") return null
            const rawTitle = (item as { title?: unknown }).title
            const rawLink = (item as { link?: unknown }).link
            const normalizedTitle = typeof rawTitle === "string" ? rawTitle.trim() : ""
            const normalizedLink = typeof rawLink === "string" ? rawLink.trim() : ""
            if (!normalizedLink) return null
            return {
              title: normalizedTitle || "Visit Link",
              link: normalizedLink,
            }
          })
          .filter(Boolean)
      : Array.isArray(missionLinks)
        ? missionLinks
            .map((link: unknown) => (typeof link === "string" ? link.trim() : ""))
            .filter(Boolean)
            .map((link: string, index: number) => ({
              title: `Link ${index + 1}`,
              link,
            }))
        : typeof missionLink === "string" && missionLink.trim()
          ? [{ title: "Visit Link", link: missionLink.trim() }]
          : []

    const parsedRequiredSignups = Number.parseInt(
      typeof requiredSignups === "number"
        ? String(requiredSignups)
        : typeof requiredSignups === "string"
          ? requiredSignups
          : "",
      10
    )
    const missionRequiredSignups = Number.isFinite(parsedRequiredSignups) && parsedRequiredSignups > 0
      ? Math.floor(parsedRequiredSignups)
      : 1

    const normalizedTitle = typeof missionTitle === "string" && missionTitle.trim()
      ? missionTitle.trim()
      : typeof title === "string"
        ? title.trim()
        : ""

    const setPayload: any = {
      missionTitle: normalizedTitle,
      title: normalizedTitle,
      description: typeof description === "string" ? description.trim() : "",
      completionMethod: completionMethod === "help-desk" || completionMethod === "sign-up" ? completionMethod : "qr-scanning",
      requiredSignups: completionMethod === "sign-up" ? missionRequiredSignups : null,
      links: normalizedLinks,
      missionLinks: (normalizedLinks as { title: string; link: string }[]).map((item) => item.link),
      // legacy fallback for code paths still reading a single link
      missionLink: normalizedLinks[0]?.link || "",
      isRequired: Boolean(isRequired),
      updatedAt: new Date().toISOString(),
    }

    if (categoryId !== undefined) {
      // store only the category id (string) to keep a normalized reference
      setPayload.categoryId = categoryId || null
    }

    await missionsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: setPayload,
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mission updated successfully",
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating mission:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update mission" }),
      { status: 500 }
    )
  }
}
