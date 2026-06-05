"use client"
import { ThemeProvider } from "@/components/theme-provider"
import ScannerComponent from "@/components/scanner"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { Toaster } from "sonner"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

type MongoUserProfile = {
  portfolioLink?: string | null
  resumeUpdate?: boolean
}

type Mission = {
  _id: string
  title?: string
  missionTitle?: string
  categoryName?: string
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const { user } = useUser()
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [uncompletedMissions, setUncompletedMissions] = useState<Mission[]>([])
  const [missionsLoading, setMissionsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadUserProfile = async () => {
      if (!user?.id) {
        if (isMounted) setShowResumeBanner(false)
        return
      }

      try {
        const response = await fetch(
          `/api/getUserInCollection?user_id=${encodeURIComponent(user.id)}`
        )
        const payload = await response.json()
        const mongoUser = (
          payload?.success ? payload.data : null
        ) as MongoUserProfile | null

        if (!isMounted) return

        const hasPortfolioLink = Boolean(
          mongoUser?.portfolioLink && String(mongoUser.portfolioLink).trim()
        )
        const shouldPromptResumeUpdate = mongoUser?.resumeUpdate !== true

        const shouldShow = hasPortfolioLink && shouldPromptResumeUpdate
        setShowResumeBanner(shouldShow)

      } catch (error) {
        console.error("Failed to load user profile for resume reminder:", error)
        if (isMounted) setShowResumeBanner(false)
      }
    }

    loadUserProfile()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return (
    <>
      <ScannerComponent />
      <div className="flex min-h-screen w-full flex-col items-center">
        <div className="fixed top-0 z-30 w-full flex flex-col items-center">
          {showResumeBanner ? (
            <div className="z-30 flex w-full flex-wrap items-center justify-center gap-3 bg-[#2c1a57] px-4 py-2 text-center font-medium tracking-[0.08em] text-white/95">
              <div className="flex flex-row flex-wrap justify-center items-center gap-2">
                <span>Attention: Please update your resume.</span>
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <Link
                    href="/profile#/account"
                    className="rounded-full border border-white/35 px-3 py-1 tracking-[0.06em] text-white/95 transition-colors hover:bg-white/15"
                  >
                    Go to Profile
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
          <Header />
        </div>
        <div className="flex w-full max-w-svw grow flex-col items-center overflow-hidden">
          {children}
        </div>
        {pathname == "/signup" || pathname == "/signin" ? null : <Footer />}
        <div className="z-10 w-full overflow-visible"></div>
        <Toaster />
      </div>
    </>
  )
}
