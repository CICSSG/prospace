"use client"
import { ChevronLeft, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import GlassSurface from "./GlassSurface"
import Link from "next/link"
import Image from "next/image"
import { Show, SignInButton, SignOutButton, SignUpButton } from "@clerk/nextjs"
import { useState } from "react"
import { WebMode } from "@/app/types"
import localFont from "next/font/local"

const sora = localFont({
  src: "./sora-regular.ttf",
  display: "swap",
})

export default function Header() {
  const MODE: WebMode = process.env.NEXT_PUBLIC_MODE as WebMode
  console.log("Current Web Mode:", MODE)

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <div className="fixed top-5 z-20 flex w-full items-center justify-center px-5 text-lg">
        <button
          className="mr-auto lg:hidden"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={36} />
        </button>

        <div className="flex flex-row items-center gap-2">
          <GlassSurface
            displace={4}
            distortionScale={-20}
            redOffset={3}
            greenOffset={3}
            blueOffset={3}
            brightness={50}
            opacity={0.1}
            mixBlendMode="screen"
            width={120}
            height={40}
            borderRadius={50}
            blur={10}
          >
            Sign In
          </GlassSurface>
          <Image
            src={"/images/ProspaceMinimalLogo.png"}
            alt="ProSpace Logo"
            width={50}
            height={50}
          />
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop - Fade in/out */}
            <motion.div
              className="fixed top-0 left-0 flex z-11 h-full w-full bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Menu Content - Slide from left */}
              <motion.div
                className={`h-full w-full flex flex-col max-w-3xs bg-linear-to-b from-[#2A3999]/0 via-[#6C5499]/80 to-[#0E1333]/0 p-4 lg:hidden ${sora.className} tracking-widest`}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="mb-4 flex flex-row justify-between">
                  <Image
                    src={"/images/ProspaceMinimalLogo.png"}
                    alt="ProSpace Logo"
                    width={60}
                    height={60}
                  />
                  <button onClick={() => setIsMenuOpen(false)}>
                    <ChevronLeft size={35} />
                  </button>
                </div>

                <div className="flex flex-col grow gap-2">
                  <Link
                    href={"/"}
                    className="block py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href={"/about"}
                    className="block py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href={"/job-fair"}
                    className="block py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Job Fair
                  </Link>
                  <Link
                    href={"/sessions"}
                    className="block py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sessions
                  </Link>
                  <Link href={"/apply"} className="block py-2">
                    Apply
                  </Link>
                </div>

                <div className="flex w-full flex-col gap-4">
                  <Show when="signed-out">
                    <SignInButton
                      appearance={{
                        options: {
                          unsafe_disableDevelopmentModeWarnings: true,
                        },
                      }}
                    >
                      <button className="h-10 w-full cursor-pointer rounded-full border border-white text-white px-4 text-sm sm:h-12 sm:px-5 sm:text-base">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton
                      appearance={{
                        options: {
                          unsafe_disableDevelopmentModeWarnings: true,
                        },
                      }}
                    >
                      <button className="h-10 w-full cursor-pointer rounded-full border border-white text-white px-4 text-sm sm:h-12 sm:px-5 sm:text-base">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <SignOutButton>
                      <button
                        className="h-10 w-full cursor-pointer rounded-full bg-white px-4 text-sm font-medium text-primary sm:h-12 sm:px-5 sm:text-base"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Out
                      </button>
                    </SignOutButton>
                  </Show>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
