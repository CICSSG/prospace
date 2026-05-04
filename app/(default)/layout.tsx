import { ThemeProvider } from "@/components/theme-provider"
import ScannerComponent from "@/components/scanner"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <ScannerComponent />
      <div className="flex w-full min-h-screen flex-col items-center">
        <Header />
        <div className="grow flex flex-col w-full max-w-svw overflow-hidden items-center">{children}</div>
        <Footer />
        <Toaster />
      </div>
    </>
  )
}
