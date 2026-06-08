"use client"
import EventMapComponent from "@/components/prospace/event-map";
import EventScheduleComponent from "@/components/prospace/event-schedule"
import { moscaLaroke } from "@/components/prospace/fonts"
import { motion } from "framer-motion"
import Image from "next/image"

const AboutInfos = [
  { text: "03", subtext: "Event Days" },
  { text: "50+", subtext: "Industry Partners" },
  { text: "2K+", subtext: "Expected Attendees" },
  { text: "DLSU-D", subtext: "Venue" },
]

const Objectives = [
  "Provide accessible internship, OJT, and job opportunities through an accredited tech and career fair.",
  "Prepare students with career workshops on portfolio building, job search, and workplace skills.",
  "Help lower classmen explore tech career paths and plan their academic goals early.",
  "Strengthen ties between the college and industry through direct engagement and dialogue.",
  "Build student confidence, technical proficiency, and readiness for the tech landscape.",
]

const SDGLogos = [
  "/images/SDG4.png",
  "/images/SDG8.jpg",
  "/images/SDG9.jpg",
  "/images/SDG10.png",
  "/images/SDG17.png",
]

const AboutPage = () => {
  return (
    <div
      className={`mt-30 mb-10 flex w-full flex-col items-center gap-4 px-4 lg:gap-10`}
    >
      <div className="absolute h-lvh w-[99vw] animate-pulse select-none animate-duration-4000 animate-ease-in-out animate-infinite">
        <motion.div
          className="select-none top-65 absolute left-10 z-10 lg:left-20 2xl:top-70 2xl:left-40"
        >
          <Image
            src={"/images/HeroStarTopLeft.png"}
            alt={"Hero Star Top Left"}
            width={45}
            height={45}
            className="rotate-15 animate-spin animate-duration-8000 animate-infinite lg:size-20"
          />
        </motion.div>
        <motion.div
          className="absolute top-35 right-10 select-none lg:right-30 2xl:top-40 2xl:right-40"
        >
          <Image
            src={"/images/HeroStarTopRight.png"}
            alt={"Hero Star Top Right"}
            width={40}
            height={40}
            className="rotate-30 select-none animate-spin animate-duration-25000 animate-infinite lg:size-40"
          />
        </motion.div>
        <motion.div
          className="absolute bottom-25 left-15 select-none lg:bottom-25 lg:left-20 2xl:bottom-30 2xl:left-80"
        >
          <Image
            src={"/images/HeroStarBottom.png"}
            alt={"Hero Star Bottom"}
            width={60}
            height={60}
            className="animate-spin select-none animate-duration-100000 animate-infinite animate-reverse lg:size-60"
          />
        </motion.div>
      </div>
      <div className="z-10 my-10 grid max-w-4xl gap-10 lg:grid-cols-2">
        <div className={`flex flex-col items-center gap-4 lg:items-start`}>
          <div className={`text-4xl ${moscaLaroke.className} lg:text-6xl`}>
            about
          </div>
          <p className="text-center leading-tight font-thin tracking-[0.2rem] lg:text-start">
            Bringing together students, industry professionals, and academic
            stakeholders
          </p>
          <p className="text-justify">
            A tech and career expo that bridges classroom learning with real
            workplace experience through an onsite job fair, online workshops,
            and direct industry engagement. Designed to prepare students at
            every stage of their academic journey.
          </p>
        </div>

        <div
          className={`my-10 grid max-w-2xl items-center gap-2 md:grid-cols-2 lg:my-0`}
        >
          {AboutInfos.map((info, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#7B4DFF]/20 to-[#7B4DFF]/5 px-2 py-4 md:flex-col md:items-start"
            >
              <div className="relative">
                <p className={`${moscaLaroke.className} text-4xl font-bold`}>
                  {info.text}
                </p>
                <p
                  className={`${moscaLaroke.className} absolute top-0 -left-1 text-4xl font-bold opacity-35 blur-xs select-none`}
                >
                  {info.text}
                </p>
              </div>
              <div className="ml-auto text-lg font-thin uppercase md:ml-0">
                {info.subtext}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-1/2 left-1/2 h-50 w-[calc(100vw+30%)] -translate-1/2 bg-[#BCA4FF]/30 blur-[100px] select-none" />
        <div className="relative z-10">
          <EventScheduleComponent />
        </div>
      </div>

      <div className="relative mx-8 my-8 flex w-full flex-col items-center gap-3">
        <div className="absolute top-1/2 left-1/2 z-1 h-120 w-[calc(80vw)] -translate-1/2 rounded-[50%] bg-linear-to-b from-[#FFC5DD] to-[#680F34] opacity-40 blur-[120px] select-none" />
        <div className="absolute top-1/2 left-1/2 h-220 w-[calc(100vw)] -translate-1/2 rounded-[50%] bg-linear-to-b from-[#BCA4FF] to-[#05091D] opacity-30 blur-[100px] select-none" />

        <Image
          src={"/images/starPink.png"}
          alt="Hero Star Bottom"
          width={400}
          height={400}
          className="absolute -right-50 -bottom-50 z-1 animate-spin blur-2xl select-none animate-duration-150000 animate-infinite"
        />
        {/* <h1 className="z-10 text-center text-lg font-thin tracking-[0.2rem] lg:text-2xl">
          NAVIGATE
        </h1> */}
        <h1 className="z-10 text-center text-2xl font-thin tracking-[0.25rem]">
          EVENT MAP
        </h1>
        <EventMapComponent />
        {/* <p className="z-10 text-center text-white/80 font-light text-lg">Coming Soon</p> */}
        {/* <div className="z-10 mx-auto aspect-video w-full max-w-200 rounded-xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22"></div> */}
      </div>

      <h1 className="z-10 text-center text-xl font-thin tracking-[0.25rem]">
        OBJECTIVES
      </h1>
      <div className={`z-10 grid md:grid-cols-2 flex-col items-center gap-2 md:gap-4 lg:gap-6 xl:gap-8`}>
        {Objectives.map((objective, index) => (
          <div className={`flex flex-row w-fit items-center gap-4 border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 px-4 py-8 rounded-2xl ${index == Objectives.length - 1 ? 'w-full md:col-span-2' : 'max-w-lg'}`} key={index}>
            <p
              className={`${moscaLaroke.className} text-2xl md:text-5xl`}
            >
              0{index + 1}
            </p>
            <p key={index} className="w-full text-justify font-thin">
              {objective}
            </p>
          </div>
        ))}
      </div>

      <h1 className="z-10 mt-10 text-center text-xl font-thin tracking-[0.25rem]">
        SDG ALIGNMENT
      </h1>
      <div className="z-10 mb-40 flex w-70 flex-wrap justify-center gap-4 md:w-full">
        {SDGLogos.map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt={`SDG ${index + 1}`}
            className="h-32 w-32 object-contain"
          />
        ))}
      </div>
    </div>
  )
}

export default AboutPage
