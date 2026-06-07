import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("Received logo upload request")
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
        maximumSizeInBytes: Math.floor(4.5 * 1024 * 1024),
      }),
      onUploadCompleted: async () => {
        return
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error handling logo upload token request:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}