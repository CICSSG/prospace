import type { Metadata } from "next"
import type { Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Prospace",
  description: "Prospace is an event held by the College of Information and Computer Studies Student Government (CICSSG) of De La Salle University Dasmariñas. We are dedicated to providing a platform for students to explore and develop their skills in the field of technology, fostering a community of innovation and collaboration.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ClerkProvider><ThemeProvider>{children}</ThemeProvider></ClerkProvider>
      </body>
    </html>
  )
}
