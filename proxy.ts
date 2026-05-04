import { auth } from "@clerk/nextjs"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isTestingRoutes = createRouteMatcher(["/testing(.*)"])
const isAdminRoutes = createRouteMatcher(["/admin(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims, userId } = await auth()
  var metadata = sessionClaims?.publicMetadata as
    | {
        isAdmin?: boolean
        adminRole?: string
        role: string
      }
    | undefined

  const normalizedRole = metadata?.role === "company" ? "data" : metadata?.role

  // console.log("Session claims:", metadata)

  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
    return NextResponse.next()
  }

  if (isTestingRoutes(req)) {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/", req.url))
  }
  if (!isAdminRoutes(req) && metadata?.isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url))
  }

  if (isAdminRoutes(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    if (!metadata?.isAdmin || metadata.isAdmin === undefined) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
