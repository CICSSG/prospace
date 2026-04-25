import type { Metadata } from "next"

import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  UserProfile,
} from "@clerk/nextjs"
import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import ScannerComponent from "@/components/scanner"
import { ArrowRightToLineIcon, Menu, TargetIcon } from "lucide-react"
import UserButtonClerk from "@/components/user-button"
import GlassSurface from "@/components/GlassSurface"
import Grainient from "@/components/Grainient"
import Image from "next/image"
import Link from "next/link"
import Footer from "@/components/footer"
import Header from "@/components/header"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
        <ClerkProvider>
          

          <ScannerComponent />
          <ThemeProvider>
            <div className="flex w-full flex-col items-center">
              <Header />
              {children}
              <Footer />
            </div>

            
          </ThemeProvider>


        </ClerkProvider>
      </body>
    </html>
  )
}
