import { auth } from "@clerk/nextjs"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { canAccessManagementPath, getDefaultManagementRoute, type PageAccess } from "@/lib/management-access"

const isTestingRoutes = createRouteMatcher(["/testing(.*)"])
const isAdminRoutes = createRouteMatcher(["/admin(.*)"])
const isManagementRoutes = createRouteMatcher(["/admin(.*)", "/data(.*)"])
const isLogoLoopUploadRoute = createRouteMatcher(["/api/logo-loop/upload(.*)"])
const isLoggedInRoute = createRouteMatcher(["/connect(.*)", "/profile(.*)"])
const isSignupRoute = createRouteMatcher(["/signup(.*)"])
const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isDataRoute = createRouteMatcher(["/data(.*)"])
const isCompanyRoute = createRouteMatcher(["/company(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims, userId, isAuthenticated } = await auth()
  var metadata = sessionClaims?.publicMetadata as
    | {
        isAdmin?: boolean
        adminRole?: string
        role: "user" | "admin"
        pageAccess?: PageAccess | null
      }
    | undefined

  const normalizedAdminRole = metadata?.adminRole === "superadmin" || metadata?.adminRole === "admin"
    ? metadata.adminRole
    : null
  const pageAccess = metadata?.pageAccess ?? undefined

  // console.log("Session claims:", metadata)

  // if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
  //   return NextResponse.next()
  // }

  if (isTestingRoutes(req)) {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/", req.url))
  }
  // If the app is in registration mode, restrict public access to only root and signup paths.
  if (isLogoLoopUploadRoute(req)) {
    return NextResponse.next()
  }
  if (!req.nextUrl.pathname.startsWith("/api") && !isManagementRoutes(req) && metadata?.isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url))
  }

  if (isManagementRoutes(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    const canAccessCurrentPage = canAccessManagementPath(
      req.nextUrl.pathname,
      pageAccess,
      normalizedAdminRole,
    )

    if (!canAccessCurrentPage) {
      return NextResponse.redirect(
        new URL(getDefaultManagementRoute(pageAccess, normalizedAdminRole), req.url),
      )
    }
  }

  if (isLoggedInRoute(req)) {
    if (!isAuthenticated) {
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
