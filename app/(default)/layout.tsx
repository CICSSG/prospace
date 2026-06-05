"use client"
import { ThemeProvider } from "@/components/theme-provider"
import ScannerComponent from "@/components/scanner"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { Toaster } from "sonner"
import { usePathname } from "next/navigation"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  return (
    <>
      <ScannerComponent />
      <div className="flex min-h-screen w-full flex-col items-center">
        <Header />
        <div className="flex w-full max-w-svw grow flex-col items-center overflow-hidden">
          {children}
        </div>
        {pathname == "/signup" ? null : <Footer />}
        <div className="z-10 w-full overflow-visible"></div>
        <Toaster />
      </div>
    </>
  )
}
