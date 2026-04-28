"use client"
import { Menu, X } from "lucide-react"
import GlassSurface from "./GlassSurface"
import Link from "next/link"
import Image from "next/image"
import { Show, SignInButton, SignOutButton, SignUpButton } from "@clerk/nextjs"
import UserButtonClerk from "./user-button"
import { useState } from "react"
import { WebMode } from "@/app/types"

export default function Header() {
  const MODE: WebMode = process.env.NEXT_PUBLIC_MODE as WebMode
  console.log("Current Web Mode:", MODE)

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <div className="fixed top-0 z-10 mx-auto flex w-full items-center justify-center p-2 lg:p-4">
        <GlassSurface
          displace={0.2}
          distortionScale={-180}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          brightness={50}
          opacity={0.43}
          mixBlendMode="screen"
          width={1200}
          borderRadius={50}
        >
          {MODE === "registration" ? (
            <div className="mx-2 grid w-full grid-cols-3 lg:mx-4">
              <Link
                href="/"
                className="col-span-3 mx-auto flex translate-y-0.5 items-center gap-2"
              >
                <Image
                  src={"/images/Prospace Logo Colored.png"}
                  alt="Prospace Logo"
                  width={200}
                  height={100}
                />
              </Link>
            </div>
          ) : (
            <div className="mx-2 grid w-full grid-cols-3 lg:mx-4">
              <button
                className="lg:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu size={20} />
              </button>
              <Link
                href="/"
                className="mx-auto flex translate-y-0.5 items-center gap-2 lg:mx-0 lg:mr-auto"
              >
                <Image
                  src={"/images/Prospace Logo Colored.png"}
                  alt="Prospace Logo"
                  width={200}
                  height={100}
                />
              </Link>
              <div className="hidden w-full flex-row items-center justify-between lg:flex">
                <Link href={"/"}>Home</Link>
                <Link href={"/about"}>About</Link>
                <Link href={"/job-fair"}>Job Fair</Link>
                <Link href={"/sessions"}>Sessions</Link>
                <Link href={"/apply"}>Apply</Link>
              </div>
              <div className="ml-auto flex flex-row items-center gap-2">
                <Show when="signed-out">
                  <SignInButton
                    appearance={{
                      options: {
                        unsafe_disableDevelopmentModeWarnings: true,
                      },
                    }}
                  >
                    <button className="hidden h-10 cursor-pointer rounded-full bg-primary px-4 text-sm font-medium text-white sm:h-12 sm:px-5 sm:text-base lg:block">
                      Sign In
                    </button>
                  </SignInButton>
                  {/* <SignUpButton
                    appearance={{
                      options: {
                        unsafe_disableDevelopmentModeWarnings: true,
                      },
                    }}
                  >
                    <button className="h-10 cursor-pointer rounded-full bg-primary px-4 text-sm font-medium text-white sm:h-12 sm:px-5 sm:text-base">
                      Sign Up
                    </button>
                  </SignUpButton> */}
                </Show>
                <Show when="signed-in">
                  <UserButtonClerk />
                </Show>
              </div>
            </div>
          )}
        </GlassSurface>
      </div>

      {isMenuOpen && (
        <div className="fixed top-0 left-0 z-11 h-full w-full max-w-lg bg-primary p-4 lg:hidden">
          <button onClick={() => setIsMenuOpen(false)}>
            <X size={30} />
          </button>
          <hr />
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
          <hr />
          <div className="mt-4 flex w-full flex-row gap-2">
            <Show when="signed-out">
              <SignInButton
                appearance={{
                  options: {
                    unsafe_disableDevelopmentModeWarnings: true,
                  },
                }}
              >
                <button className="h-10 w-full cursor-pointer rounded-full bg-white px-4 text-sm font-medium text-primary sm:h-12 sm:px-5 sm:text-base">
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
                <button className="h-10 w-full cursor-pointer rounded-full bg-white px-4 text-sm font-medium text-primary sm:h-12 sm:px-5 sm:text-base">
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
        </div>
      )}
    </>
  )
}
