"use client"
import { ChevronLeft, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import GlassSurface from "./GlassSurface"
import Link from "next/link"
import Image from "next/image"
import {
  Show,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserProfile,
  UserAvatar,
  UserButton,
} from "@clerk/nextjs"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { WebMode } from "@/app/types"
import { sora } from "@/components/prospace/fonts"

export default function Header() {
  const mode = process.env.NEXT_PUBLIC_MODE as WebMode
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <div className="fixed top-5 z-20 grid w-full grid-cols-2 items-center justify-center px-5 text-lg lg:max-w-400 lg:grid-cols-5 lg:justify-around">
        <button
          className="mr-auto lg:hidden"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={36} />
        </button>
        <Link href={"/"} className="hidden lg:block">
          <Image
            src={"/images/ProspaceMinimalLogo.png"}
            alt="ProSpace Logo"
            width={80}
            height={80}
          />
        </Link>

        <div className="col-span-3 mx-auto hidden flex-row gap-2 lg:flex xl:gap-4">
          <Link
            href="/"
            className={`block h-fit rounded-full px-6 py-1 ${isActive("/") ? "bg-linear-to-b to-primary/50 outline outline-white/60" : "hover:outline hover:outline-white/60"}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <>
            <Link
              href="/about"
              className={`block h-fit rounded-full px-6 py-1 ${isActive("/about") ? "bg-linear-to-b to-primary/50 outline outline-white/60" : "hover:outline hover:outline-white/60"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/job-fair"
              className={`block h-fit rounded-full px-6 py-1 ${isActive("/job-fair") ? "bg-linear-to-b to-primary/50 outline outline-white/60" : "text-nowrap hover:outline hover:outline-white/60"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Job Fair
            </Link>
            <Link
              href="/sessions"
              className={`block h-fit rounded-full px-6 py-1 ${isActive("/sessions") ? "bg-linear-to-b to-primary/50 outline outline-white/60" : "hover:outline hover:outline-white/60"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Sessions
            </Link>
            {/* <Link
              href="/apply"
              className={`block h-fit rounded-full px-6 py-1 ${isActive("/apply") ? "bg-linear-to-b to-primary/50 outline outline-white/60" : "hover:outline hover:outline-white/60"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Apply
            </Link> */}
          </>
          <Show when="signed-in">
            <Link
              href="/profile"
              className={`block py-2 ${isActive("/profile") ? "font-semibold text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/connect"
              className={`block py-2 ${isActive("/connect") ? "font-semibold text-primary" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Connect
            </Link>
            {/* <Link
                      href={"/missions"}                      
                      className="block py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Missions
                    </Link> */}
          </Show>
        </div>

        <div className="ml-auto flex flex-row items-center gap-4">
          <Show when="signed-out">
            {mode === "production" ? (
              <>
                <SignInButton>
                  <span className="flex h-full border border-white/60 rounded-full px-6 py-1 flex-row items-center justify-center text-center transition-colors hover:bg-[#FF5FA2]/20 cursor-pointer">
                    Sign In
                  </span>
                </SignInButton>
                {/* <Link href={"/signin"}>
                  
                </Link> */}
                <Link href={"/signup"} className="hidden xl:block">
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
                    className="cursor-pointer p-0 *:p-0"
                  >
                    <span className="flex h-full w-[calc(400%)] flex-row items-center justify-center bg-[#FF5FA2]/20 text-center transition-colors hover:bg-[#FF5FA2]/40">
                      Sign Up
                    </span>
                  </GlassSurface>
                </Link>
              </>
            ) : (
              <Link href={"/signup"}>
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
                  Register
                </GlassSurface>
              </Link>
            )}
          </Show>

          <Show when="signed-in">
            <Link href={"/profile"}>
              <UserAvatar
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10",
                    userButtonAvatarImage: "w-10 h-10",
                  },
                }}
              />
            </Link>
          </Show>
          <Image
            src={"/images/ProspaceMinimalLogo.png"}
            alt="ProSpace Logo"
            width={50}
            height={50}
            className="lg:hidden"
          />
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop - Fade in/out */}
            <motion.div
              className="fixed top-0 left-0 z-21 flex h-full w-full bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMenuOpen(false)}
            >
              {/* Menu Content - Slide from left */}
              <motion.div
                className={`flex h-full w-full max-w-3xs flex-col bg-linear-to-b from-[#2A3999]/0 via-[#6C5499]/80 to-[#0E1333]/0 p-4 ${sora.className} tracking-widest`}
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

                <div className="flex grow flex-col gap-2">
                  <Link
                    href="/"
                    className={`block py-2 ${isActive("/") ? "font-semibold text-primary" : ""}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <>
                    <Link
                      href="/about"
                      className={`block py-2 ${isActive("/about") ? "font-semibold text-primary" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link
                      href="/job-fair"
                      className={`block py-2 ${isActive("/job-fair") ? "font-semibold text-primary" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Job Fair
                    </Link>
                    <Link
                      href="/sessions"
                      className={`block py-2 ${isActive("/sessions") ? "font-semibold text-primary" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sessions
                    </Link>
                    {/* <Link
                      href="/apply"
                      className={`block py-2 ${isActive("/apply") ? "font-semibold text-primary" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Apply
                    </Link> */}
                  </>
                  <Show when="signed-in">
                    <Link
                      href="/profile"
                      className={`block py-2 ${isActive("/profile") ? "font-semibold text-primary" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/connect"
                      className={`block py-2 ${isActive("/connect") ? "font-semibold text-primary" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Connect
                    </Link>
                    {/* <Link
                      href={"/missions"}                      
                      className="block py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Missions
                    </Link> */}
                  </Show>
                </div>

                <div className="flex w-full flex-col gap-4">
                  <Show when="signed-out">
                    {mode === "production" && (
                      <SignInButton
                        appearance={{
                          options: {
                            unsafe_disableDevelopmentModeWarnings: true,
                          },
                        }}
                      >
                        <button className="h-10 w-full cursor-pointer rounded-full border border-white px-4 text-sm text-white sm:h-12 sm:px-5 sm:text-base">
                          Sign In
                        </button>
                      </SignInButton>
                    )}
                    <Link href={"/signup"} onClick={() => setIsMenuOpen(false)}>
                      <button className="h-10 w-full cursor-pointer rounded-full border border-white px-4 text-sm text-white sm:h-12 sm:px-5 sm:text-base">
                        {mode === "production" ? "Sign Up" : "Register Now!"}
                      </button>
                    </Link>
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
