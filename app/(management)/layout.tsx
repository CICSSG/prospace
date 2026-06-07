"use client"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { canAccessManagementPath, getDefaultManagementRoute, type PageAccess } from "@/lib/management-access"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Toaster } from "sonner"
import { useUser } from "@clerk/nextjs"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  const metadata = user?.publicMetadata as
    | {
        role?: "user" | "admin" | null
        adminRole?: "superadmin" | "admin" | null
        pageAccess?: PageAccess | null
        assignedCompany?: string | null
      }
    | undefined

  const adminRole = metadata?.adminRole ?? null
  const pageAccess = metadata?.pageAccess ?? undefined

  useEffect(() => {
    if (!user || !pathname) {
      return
    }

    const canAccessCurrentPage = canAccessManagementPath(pathname, pageAccess, adminRole, metadata?.assignedCompany)
    if (!canAccessCurrentPage) {
      router.replace(getDefaultManagementRoute(pageAccess, adminRole, metadata?.assignedCompany))
    }
  }, [adminRole, pageAccess, pathname, router, user])

  if (!user) {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="sidebar" userData={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex w-full flex-col p-4">
          {children}
          <Toaster />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
