"use client"
import { motion } from "framer-motion"
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import { ChevronLeft, ExternalLink } from "lucide-react"
import React from "react"
import Image from "next/image"
import Link from "next/link"

const Sessions = () => {
  return (
    <div
      className={`mt-30 mb-10 flex w-full flex-col items-center gap-4 px-4 lg:gap-10`}
    >
      <div className="absolute h-lvh w-[99vw] animate-pulse select-none animate-duration-4000 animate-ease-in-out animate-infinite">
        <motion.div className="absolute top-65 left-10 z-10 select-none lg:left-20 2xl:top-70 2xl:left-40">
          <Image
            src={"/images/HeroStarTopLeft.png"}
            alt={"Hero Star Top Left"}
            width={45}
            height={45}
            className="rotate-15 animate-spin animate-duration-8000 animate-infinite lg:size-20"
          />
        </motion.div>
        <motion.div className="absolute top-35 right-10 select-none lg:right-30 2xl:top-40 2xl:right-40">
          <Image
            src={"/images/HeroStarTopRight.png"}
            alt={"Hero Star Top Right"}
            width={40}
            height={40}
            className="rotate-30 animate-spin select-none animate-duration-25000 animate-infinite lg:size-40"
          />
        </motion.div>
        <motion.div className="absolute bottom-25 left-15 select-none lg:bottom-25 lg:left-20 2xl:bottom-30 2xl:left-80">
          <Image
            src={"/images/HeroStarBottom.png"}
            alt={"Hero Star Bottom"}
            width={60}
            height={60}
            className="animate-spin select-none animate-duration-100000 animate-infinite animate-reverse lg:size-60"
          />
        </motion.div>
      </div>
      <div className={`z-10 flex w-full max-w-4xl flex-col items-center gap-8`}>
        <div
          className={`text-3xl ${moscaLaroke.className} tracking-wider md:text-4xl lg:text-5xl`}
        >
          SessIOns
        </div>
        <p className="text-center leading-tight font-thin tracking-[0.2rem] lg:text-start">
          Explore specialized tracks designed to build your technical and
          professional identity.
        </p>
        <div className="flex w-full flex-row flex-wrap items-center justify-center gap-4 rounded-lg border border-white/40 bg-linear-to-l to-[#7B4DFF]/22 px-4 py-6">
          <div className="relative">
            <h1
              className={`text-6xl font-bold md:text-7xl ${moscaLaroke.className}`}
            >
              06
            </h1>
            <h1
              className={`absolute top-0 left-0 text-6xl font-bold blur-xs md:text-7xl ${moscaLaroke.className}`}
            >
              06
            </h1>
          </div>
          <div>
            <p className="font-light">JUNE • SATURDAY</p>
            <p className="font-bold">Online Career Sessions</p>
            <p className="font-light">Microsoft Teams and Facebook Live</p>
          </div>
          <div className="w-full rounded-full border border-white/60 bg-linear-to-b to-[#7B4DFF]/22 px-4 py-1 text-center text-white md:ml-10 md:w-fit">
            Open to All
          </div>
        </div>
      </div>

      <div className={`z-10 flex w-full max-w-4xl flex-col items-center gap-8`}>
        <h1
          className={`text-2xl md:text-3xl ${sora.className} font-light tracking-widest`}
        >
          SCHEDULE & LINKS
        </h1>
        <div className="grid w-full max-w-4xl grid-cols-2">
          <div>
            <p className="text-center text-xl font-light tracking-[0.3rem]">
              SET 1
            </p>
            <div className="flex flex-col gap-2">
              <p>
                Microsoft Teams:{" "}
                <Link
                  href="https://teams.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  ProSpaceSessionSet1
                </Link>
              </p>
              <p>
                Microsoft Teams:{" "}
                <Link
                  href="https://teams.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  ProSpaceSessionSet1
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="z-10 mx-auto grid w-fit gap-4 p-4 md:grid-cols-2 lg:grid-cols-3"></div>
    </div>
  )
}

export default Sessions
