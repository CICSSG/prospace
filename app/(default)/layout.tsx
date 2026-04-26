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
      <div className="flex w-full flex-col items-center">
        <Header />
        {children}
        <Footer />
        <Toaster />
      </div>
    </>
  )
}
