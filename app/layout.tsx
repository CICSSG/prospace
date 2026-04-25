import type { Metadata } from "next"

import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import ScannerComponent from "@/components/scanner"

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
          <header className="flex h-16 items-center justify-end gap-4 p-4">
            <Show when="signed-out">
              <SignInButton
                mode="modal"
                appearance={{
                  options: {
                    unsafe_disableDevelopmentModeWarnings: true,
                  },
                }}
              />
              <SignUpButton
                mode="modal"
                appearance={{
                  options: {
                    unsafe_disableDevelopmentModeWarnings: true,
                  },
                }}
              >
                <button className="h-10 cursor-pointer rounded-full bg-primary px-4 text-sm font-medium text-white sm:h-12 sm:px-5 sm:text-base">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          <ScannerComponent />
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
