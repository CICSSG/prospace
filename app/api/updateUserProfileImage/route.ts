import { auth, clerkClient } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ success: false, message: "A profile image file is required" }), { status: 400 })
    }

    const clerk = await clerkClient()
    const updatedUser = await clerk.users.updateUserProfileImage(userId, { file })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile image updated successfully",
        data: updatedUser,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating profile image:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Failed to update profile image" }),
      { status: 500 }
    )
  }
}