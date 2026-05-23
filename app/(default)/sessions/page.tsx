"use client"
import { motion } from "framer-motion"
import { moscaLaroke } from "@/components/prospace/fonts"
import { ChevronLeft, ExternalLink } from "lucide-react"
import React from "react"
import Image from "next/image"

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
        <div className="flex flex-row flex-wrap gap-4 items-center justify-center bg-linear-to-l to-[#7B4DFF]/22 rounded-lg border border-white/40 px-4 py-6 w-full">
          <div className="relative">
            <h1 className={`text-6xl md:text-7xl font-bold ${moscaLaroke.className}`}>06</h1>
            <h1 className={`absolute top-0 left-0 blur-xs text-6xl md:text-7xl font-bold ${moscaLaroke.className}`}>06</h1>
          </div>
          <div>
            <p className="font-light">JUNE • SATURDAY</p>
            <p className="font-bold">Online Career Sessions</p>
            <p className="font-light">Microsoft Teams and Facebook Live</p>
          </div>
          <div className="bg-linear-to-b w-full text-center md:w-fit md:ml-10 to-[#7B4DFF]/22 text-white px-4 py-1 rounded-full border border-white/60">
            Open to All
          </div>
        </div>
      </div>

      <div className="z-10 mx-auto grid w-fit gap-4 p-4 md:grid-cols-2 lg:grid-cols-3"></div>
    </div>
  )
}

export default Sessions
