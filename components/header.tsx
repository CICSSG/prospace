import { Menu } from "lucide-react";
import GlassSurface from "./GlassSurface";
import Link from "next/link";
import Image from "next/image";
import { Show, SignUpButton } from "@clerk/nextjs";
import UserButtonClerk from "./user-button";

export default function Header() {
    return (
        <div className="fixed top-0 z-10 mx-auto flex w-full items-center justify-center p-4">
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
              <div className="mx-4 grid w-full grid-cols-3">
                <button className="lg:hidden">
                  <Menu size={20} />
                </button>
                <Link
                  href="/"
                  className="mr-auto flex translate-y-0.5 items-center gap-2"
                >
                  <Image
                    src={"/images/Prospace Logo Colored.png"}
                    alt="Prospace Logo"
                    width={200}
                    height={100}
                  />
                </Link>
                <div className="hidden lg:flex flex-row items-center justify-between w-full">
                  <Link href={"/"}>Home</Link>
                  <Link href={"/about"}>About</Link>
                  <Link href={"/job-fair"}>Job Fair</Link>
                  <Link href={"/sessions"}>Sessions</Link>
                  <Link href={"/apply"}>Apply</Link>
                </div>
                <div className="ml-auto flex flex-row items-center">
                  <Show when="signed-out">
                    <SignUpButton
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
                    <UserButtonClerk />
                  </Show>
                </div>
              </div>
            </GlassSurface>
          </div>
    )
}