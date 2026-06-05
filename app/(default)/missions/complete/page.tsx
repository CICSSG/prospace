import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

type MissionCompletePageProps = {
  searchParams?:
    | {
        id?: string | string[]
      }
    | Promise<{
        id?: string | string[]
      }>
}

export default async function MissionCompletePage({ searchParams }: MissionCompletePageProps) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<unknown>).then === "function"
      ? await (searchParams as Promise<{ id?: string | string[] }>)
      : (searchParams as { id?: string | string[] } | undefined)

  const idValue = resolvedSearchParams?.id
  const missionId = (Array.isArray(idValue) ? idValue[0] : idValue)?.trim()

  if (!missionId) {
    return (
      <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-3xl font-semibold">Invalid mission completion link</h1>
        <p className="mt-3 text-white/70">No mission id was provided.</p>
        <Link href="/missions" className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10">
          Back to missions
        </Link>
      </main>
    )
  }

  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return (
      <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-3xl font-semibold">Sign in required</h1>
        <p className="mt-3 text-white/70">Please sign in first to record your mission completion.</p>
        <Link
          href={`/signin?redirect_url=${encodeURIComponent(`/missions/complete?id=${missionId}`)}`}
          className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          Sign in
        </Link>
      </main>
    )
  }

  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DATABASE)

    const usersCollection = db.collection("users")
    const missionsCollection = db.collection("missions")
    const completionsCollection = db.collection("missionCompletions")

    const missionObjectId = ObjectId.isValid(missionId) ? new ObjectId(missionId) : null

    if (!missionObjectId) {
      return (
        <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-3xl font-semibold">Mission not found</h1>
          <p className="mt-3 text-white/70">This mission link is invalid or no longer available.</p>
          <Link href="/missions" className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10">
            Back to missions
          </Link>
        </main>
      )
    }

    const mission = await missionsCollection.findOne({ _id: missionObjectId })

    if (!mission) {
      return (
        <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-3xl font-semibold">Mission not found</h1>
          <p className="mt-3 text-white/70">This mission link is invalid or no longer available.</p>
          <Link href="/missions" className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10">
            Back to missions
          </Link>
        </main>
      )
    }

    const mongoUser = await usersCollection.findOne(
      { clerkId: clerkUserId },
      { projection: { userId: 1 } }
    )

    const resolvedUserId = mongoUser?.userId ?? clerkUserId
    const existingCompletion = await completionsCollection.findOne({
      userId: resolvedUserId,
      missionId,
    })

    if (existingCompletion) {
      return (
        <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-3xl font-semibold">Mission already accomplished</h1>
          <p className="mt-3 text-white/70">You already completed this mission.</p>
          <Link href="/missions" className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10">
            Back to missions
          </Link>
        </main>
      )
    }

    const now = new Date().toISOString()

    await completionsCollection.insertOne({
      userId: resolvedUserId,
      missionId,
      createdAt: now,
      updatedAt: now,
    })

    return (
      <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-3xl font-semibold">Mission completion recorded</h1>
        <p className="mt-3 text-white/70">Your completion was saved successfully.</p>
        <Link href="/missions" className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10">
          Back to missions
        </Link>
      </main>
    )
  } catch (error) {
    console.error("Failed to complete mission:", error)

    return (
      <main className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-3xl font-semibold">Could not complete mission</h1>
        <p className="mt-3 text-white/70">Please try again in a moment.</p>
        <Link href="/missions" className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm text-white/85 hover:bg-white/10">
          Back to missions
        </Link>
      </main>
    )
  }
}
