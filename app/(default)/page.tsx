"use client"
import { motion } from "framer-motion"
import Grainient from "@/components/Grainient"
import LogoLoop from "@/components/logoloop"
import { Button } from "@/components/ui/button"
import { ArrowRight, Award, Badge, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getCollectionData } from "../admin/actions"
import CountdownTimer from "@/components/countdown"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import localFont from "next/font/local"
import Link from "next/link"
import { Show } from "@clerk/nextjs"
import { WebMode } from "../types"
import ColorBends from "@/components/ColorBends"
import DividerComponent from "@/components/divider"
import { div } from "three/src/nodes/math/OperatorNode.js"

type Logo = {
  node: React.ReactNode
  title: string
  href: string
}

const topHandVariants = {
  initial: { opacity: 0, y: -200 },
  slideIn: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.5, ease: "easeOut" as const },
  },
  hover: {
    opacity: 1,
    y: [0, -15, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
  },
}

const bottomHandVariants = {
  initial: { opacity: 0, y: 200 },
  slideIn: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.5, ease: "easeOut" as const },
  },
  hover: {
    opacity: 1,
    y: [0, 15, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
  },
}

const SDGLogos = [
  "/images/SDG4.png",
  "/images/SDG8.jpg",
  "/images/SDG9.jpg",
  "/images/SDG10.png",
  "/images/SDG17.png",
]

const CareerSessions = [
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "MAY 16",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "MAY 16",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "MAY 16",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
]

const IndustryPartners = [
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
  },
]

const moscaLaroke = localFont({
  src: "../mosca-laroke.regular.otf",
  display: "swap",
})

const sora = localFont({
  src: "../sora-regular.ttf",
  display: "swap",
})

export default function Page() {
  const [animateHover, setAnimateHover] = useState(false)
  const [logos, setLogos] = useState<Logo[]>([
    {
      node: (
        <Image
          src={"/images/Prospace Logo.png"}
          alt={"Prospace Logo"}
          height={60}
          width={100}
          className="h-10 object-contain"
        />
      ),
      title: "Prospace",
      href: "/",
    },
  ])

  useEffect(() => {
    getCollectionData("logoLoop").then((res) => {
      const data = res.data
      const fetchedLogos = data.map((item: any) => ({
        node: (
          <Image
            src={item.logoUrl}
            alt={item.companyName}
            height={60}
            width={100}
            className="h-10 object-contain"
          />
        ),
        title: item.companyName,
        href: item.companyUrl,
      }))

      setLogos(fetchedLogos)
    })
  }, [])

  return (
    <div className="overflow-hidden max-w-svw">
      {/* HERO */}
      <section className="relative flex min-h-lvh w-svw flex-col justify-center overflow-hidden">
        <div className="absolute z-5 min-h-lvh w-full bg-linear-to-t from-[#0e1231] to-[#0d0d1f]/0 to-60%" />
        <div
          style={{ height: "100px" }}
          className="absolute top-0 left-0 h-full min-h-lvh w-screen opacity-50"
        >
          <ColorBends
            rotation={115}
            speed={0.2}
            colors={["#5227FF", "#FF9FFC"]}
            transparent={false}
            autoRotate={0}
            scale={1.3}
            frequency={1.2}
            warpStrength={0}
            mouseInfluence={2.3}
            parallax={0.5}
            noise={0.1}
            iterations={1}
            intensity={1.5}
            bandWidth={6}
          />
        </div>
        <div className="absolute top-0 left-0 z-10 flex h-lvh w-screen grow flex-col">
          <div className="relative grow">
            <motion.div
              variants={topHandVariants}
              initial="initial"
              animate={animateHover ? "hover" : "slideIn"}
              onAnimationComplete={(definition) => {
                if (definition === "slideIn") {
                  setAnimateHover(true)
                }
              }}
              className="absolute -top-10 left-0 w-full lg:-top-40 lg:-left-20 2xl:-left-10 2xl:-top-70"
            >
              <Image
                src={"/images/HeroHandTop.png"}
                alt={"Hero Hand Top"}
                width={1028}
                height={1028}
                className="max-w-xs object-cover object-top-right lg:max-w-lg 2xl:max-w-2xl"
              />
            </motion.div>
            <motion.div
              variants={bottomHandVariants}
              initial="initial"
              animate={animateHover ? "hover" : "slideIn"}
              onAnimationComplete={(definition) => {
                if (definition === "slideIn") {
                  setAnimateHover(true)
                }
              }}
              className="absolute right-0 -bottom-5 w-full lg:-right-30 lg:-bottom-30 xl:right-0 xl:-bottom-20 2xl:-bottom-30"
            >
              <Image
                src={"/images/HeroHandBottom.png"}
                alt={"Hero Hand Bottom"}
                width={1028}
                height={1028}
                className="ml-auto max-w-76 lg:max-w-lg 2xl:max-w-xl"
              />
            </motion.div>

            <div className="relative h-lvh w-screen animate-pulse animate-infinite animate-duration-4000 animate-ease-in-out">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 1 }}
                className="absolute top-65 left-10 z-10"
              >
                <Image
                  src={"/images/HeroStarTopLeft.png"}
                  alt={"Hero Star Top Left"}
                  width={45}
                  height={45}
                  className="rotate-15 animate-spin animate-duration-8000 animate-infinite"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 1 }}
                className="absolute top-35 right-10"
              >
                <Image
                  src={"/images/HeroStarTopRight.png"}
                  alt={"Hero Star Top Right"}
                  width={40}
                  height={40}
                  className="rotate-30 animate-spin animate-duration-8000 animate-infinite"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 1 }}
                className="absolute bottom-25 left-15"
              >
                <Image
                  src={"/images/HeroStarBottom.png"}
                  alt={"Hero Star Bottom"}
                  width={60}
                  height={60}
                  className="animate-spin animate-duration-8000 animate-infinite"
                />
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          className="z-5 mx-auto flex max-w-md flex-col items-center justify-center px-10 text-center lg:max-w-lg 2xl:max-w-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <p
            className={
              sora.className +
              " text-xl font-light tracking-[0.5rem] text-white lg:text-4xl 2xl:text-6xl"
            }
          >
            WELCOME TO
          </p>
          <Image
            src={"/images/ProSpaceTitle.png"}
            alt={"ProSpace Title"}
            width={512}
            height={128}
            className="my-4 w-full object-contain 2xl:max-w-lg"
          />
        </motion.div>
      </section>

      {/* SCHEDULE */}
      <section className="mx-4">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-2 py-12 lg:grid-cols-2 lg:px-4 xl:gap-24">
          {/* Prospace Information */}
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <div className="flex flex-row gap-8 items-center w-fit">
              <Image
                src={"/images/DLSU-D Logo.png"}
                alt={"DLSUD Logo"}
                width={130}
                height={100}
                className="h-fit object-contain"
              />
              <Image
                src={"/images/cicssg-colored.png"}
                alt={"CICSSG Logo"}
                width={120}
                height={100}
                className="h-fit object-contain"
              />
            </div>
            <div>
              <Image
                src={"/images/Prospace-DLSU-D.png"}
                alt={"Prospace DLSU-D Logo"}
                width={512}
                height={128}
                className="w-full max-w-xs object-contain "
              />
            </div>
            <p className="mx-4 lg:mx-0 text-white/90">
              An event to respond to the growing need for structured career
              preparation and exposure to industry practices, emerging
              technologies, and real hiring environments.
            </p>
            <p className="mx-4 lg:mx-0 text-white/90">
              Empowering students to thrive in the digital workforce
            </p>
            <div className="mt-4 flex flex-row items-center gap-3">
              {SDGLogos.map((logo, index) => (
                <Image
                  key={index}
                  src={logo}
                  alt={`SDG Logo`}
                  width={50}
                  height={65}
                  className="rounded-lg opacity-80"
                />
              ))}
            </div>
          </div>

          <div className="lg:hidden"><DividerComponent /></div>

          <div className="flex flex-col items-center gap-4">
            <h2 className={`tracking-[0.3rem] uppercase ${sora.className}`}>
              Event Schedule
            </h2>

            <div className="grid w-full grid-cols-4 items-center gap-14 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#7B4DFF]/30 to-[#7B4DFF]/10 px-3 py-4">
              {/* Date */}
              <div className="relative">
                <p className={`${moscaLaroke.className} text-7xl`}>16</p>
                <p
                  className={`${moscaLaroke.className} absolute top-0 -left-1 text-7xl opacity-35 blur-xs`}
                >
                  16
                </p>
              </div>
              <div className="col-span-3 flex w-full flex-row items-center justify-between">
                {/* Details */}
                <div
                  className={`flex flex-col gap-0.5 ${sora.className} text-sm text-white/80`}
                >
                  <p className="text-[0.6rem]">MAY • SATURDAY</p>
                  <p className="leading-5 font-semibold tracking-widest text-white/95">
                    Online Career <br />
                    Sessions
                  </p>
                  <p className="text-[0.6rem]">Microsoft Teams and Live</p>
                </div>
                {/* Tag */}
                <div
                  className={`h-fit w-25 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#7B4DFF]/50 py-1 text-center text-[0.65rem] ${sora.className}`}
                >
                  open to all
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-4 items-center gap-14 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#5F92ED]/50 to-[#7B4DFF]/10 px-3 py-4">
              {/* Date */}
              <div className="relative">
                <p className={`${moscaLaroke.className} text-7xl`}>27</p>
                <p
                  className={`${moscaLaroke.className} absolute top-0 -left-1 text-7xl opacity-35 blur-xs`}
                >
                  27
                </p>
              </div>
              <div className="col-span-3 flex w-full flex-row items-center justify-between">
                {/* Details */}
                <div
                  className={`flex flex-col ${sora.className} text-sm text-white/80`}
                >
                  <p className="text-[0.6rem]">MAY • WEDNESDAY</p>
                  <p className="font-semibold tracking-widest text-white/95">
                    Job Fair
                  </p>
                  <p className="text-[0.6rem]">Salrial Hall • PBH Courtyard</p>
                </div>
                {/* Tag */}
                <div
                  className={`h-fit w-25 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#5F92ED]/50 py-1 text-center text-[0.65rem] ${sora.className}`}
                >
                  DLSU-D only
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-4 items-center gap-14 rounded-lg border-2 border-white/20 bg-linear-to-r from-[#FF5FA2]/50 to-[#7B4DFF]/10 px-3 py-4">
              {/* Date */}
              <div className="relative">
                <p className={`${moscaLaroke.className} text-7xl`}>28</p>
                <p
                  className={`${moscaLaroke.className} absolute top-0 -left-1 text-7xl opacity-35 blur-xs`}
                >
                  28
                </p>
              </div>
              <div className="col-span-3 flex w-full flex-row items-center justify-between">
                {/* Details */}
                <div
                  className={`flex flex-col ${sora.className} text-sm text-white/80`}
                >
                  <p className="text-[0.6rem]">MAY • THURSDAY</p>
                  <p className="font-semibold tracking-widest text-white/95">
                    Job Fair
                  </p>
                  <p className="text-[0.6rem]">Salrial Hall • PBH Courtyard</p>
                </div>
                {/* Tag */}
                <div
                  className={`h-fit w-25 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#FF5FA2]/50 py-1 text-center text-[0.65rem] ${sora.className}`}
                >
                  open to all
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-8">
        <DividerComponent />
      </div>
      {/* COUNTDOWN */}
      <section className="mx-auto w-fit max-w-[90vw] py-12">
        <div className="container flex flex-col items-center px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">
              Aligning success, launching careers
            </h2>
          </div>
          <div className="flex flex-row items-center gap-8">
            <CountdownTimer />
          </div>
        </div>
        <Show when="signed-out">
          <Link
            href={"/signup"}
            className="mx-auto mt-4 flex w-full max-w-sm cursor-pointer flex-row items-center justify-center gap-2 rounded-full border border-white/80 bg-linear-to-t from-white/10 to-white/0 to-30% px-4 py-1 text-lg text-white transition-all duration-300 hover:bg-linear-to-t hover:to-50%"
          >
            Register Now!
          </Link>
        </Show>
      </section>

      <div className="mx-8">
        <DividerComponent />
      </div>
      {/* PARTNERS */}
      <section className="mx-auto w-fit max-w-[90vw] py-12">
        <div className="container flex flex-col items-center px-4">
          <div className="mb-8 text-center">
            <h2
              className={`text-sm font-semibold tracking-[0.2rem] text-muted-foreground ${sora.className}`}
            >
              Powered by CICSSG and Partners
            </h2>
          </div>
          <div className="h-20 w-full overflow-x-hidden overflow-y-clip">
            <LogoLoop
              logos={logos}
              speed={50}
              direction="left"
              logoHeight={60}
              scaleOnHover
              gap={60}
              fadeOut
              fadeOutColor="#0E1333"
              ariaLabel="Technology partners"
            />
          </div>
        </div>
      </section>

      <div className="mx-8">
        <DividerComponent />
      </div>
      {/* CAREER SESSIONS */}
      <section className="mx-8 my-8 flex flex-col gap-3">
        <div className="flex w-full flex-row items-center justify-between">
          <h2
            className={`text-center tracking-[0.3rem] uppercase ${sora.className}`}
          >
            Career Sessions
          </h2>
          <Link
            href={"/career"}
            className="flex h-fit flex-row items-center gap-2 text-white/60 transition-all duration-300 hover:text-white"
          >
            <div className="flex flex-row items-center text-sm">
              View All <ChevronRight className="size-5" />
            </div>
          </Link>
        </div>
        <p
          className={`mr-5 text-sm leading-snug tracking-[0.15rem] text-white/80 ${sora.className}`}
        >
          Live discussions and workshops led by industry experts — May 16 via MS
          Teams and Facebook Live.
        </p>

        {CareerSessions.map((session, index) => (
          <div
            key={index}
            className="flex flex-row overflow-hidden rounded-lg border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/0 text-sm"
          >
            <Image
              src={`${session.imageUrl}`}
              alt="Career Session"
              width={100}
              height={300}
              className="border-r object-cover opacity-30"
            />
            <div className="col-span-2 flex flex-col gap-2 p-2 leading-[1.1em]">
              <h1 className="text-xs leading-[1.1em] tracking-widest">
                {session.title}
              </h1>
              <div className="mt-1 flex flex-col gap-1">
                <p className="text-[0.65rem] leading-0 font-thin tracking-widest">
                  {session.time}
                </p>
                <p className="text-[0.65rem] font-thin">{session.date}</p>
              </div>
              <div className="w-fit rounded-full border border-white/40 px-6 py-0.5 text-[0.65rem] font-thin">
                {session.tag}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="mx-8">
        <DividerComponent />
      </div>

      {/* INDUSTRY PARTNERS */}
      <div className="mx-8 my-8 flex flex-col gap-3">
        <div className="flex w-full flex-row items-center justify-between">
          <h2
            className={`text-center tracking-[0.3rem] uppercase ${sora.className}`}
          >
            Industry Partners
          </h2>
          <Link
            href={"/partners"}
            className="flex h-fit flex-row items-center gap-2 text-white/60 transition-all duration-300 hover:text-white"
          >
            <div className="flex flex-row items-center text-sm">
              View All <ChevronRight className="size-5" />
            </div>
          </Link>
        </div>
        <p
          className={`mr-5 text-sm leading-snug tracking-[0.15rem] text-white/80 ${sora.className}`}
        >
          Meet the organizations shaping the technology landscape.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {IndustryPartners.map((partner, index) => (
            <div
              key={index}
              className="flex flex-col rounded-2xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/0 p-3"
            >
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={200}
                height={100}
                className="aspect-square h-12 w-fit rounded-lg object-contain opacity-80"
              />
              <p className="mt-1 text-sm font-semibold tracking-widest text-white/80">
                {partner.name}
              </p>
              <p className="mt-1 text-xs font-light tracking-widest text-white/50">
                {partner.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-8">
        <DividerComponent />
      </div>

      {/* NAVIGATE */}
      <div className="mx-8 my-8 flex flex-col gap-3">
        <h1 className="text-center text-lg font-thin tracking-[0.2rem]">
          NAVIGATE
        </h1>
        <h1 className="text-center text-2xl font-semibold tracking-[0.25rem]">
          EVENT MAP
        </h1>
        <div className="aspect-square rounded-xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22"></div>
      </div>

      <div className="mx-8">
        <DividerComponent />
      </div>

      {/* EVENT MISSIONS */}
      <div className="mx-8 my-8 flex flex-col gap-3">
        <h1 className="text-center text-lg font-thin tracking-[0.2rem]">
          EVENT MISSIONS
        </h1>

        <div className="mx-6 flex flex-col gap-3">
          <div className="mt-4 flex flex-row items-center gap-4">
            <div className="size-6 shrink-0 rounded-full border border-white/40 bg-[#6598F3]/20" />
            <p className="tracking-[0.2rem]">Connect with 10 Companies</p>
          </div>
          <div className="mt-4 flex flex-row items-center gap-4">
            <div className="size-6 shrink-0 rounded-full border border-white/40 bg-[#6598F3]/20" />
            <p className="tracking-[0.2rem]">
              Sign Up to Filipino Web Development Peers
            </p>
          </div>
          <div className="mt-4 flex flex-row items-center gap-4">
            <div className="size-6 shrink-0 rounded-full border border-white/40 bg-[#6598F3]/20" />
            <p className="tracking-[0.2rem]">Sign Up to Gen AI Philippines</p>
          </div>
        </div>

        <Link
          href={"/missions"}
          className="mx-auto mt-4 flex cursor-pointer flex-row items-center justify-center gap-2 rounded-full border border-white/80 bg-linear-to-t from-white/10 to-white/0 to-30% px-14 py-1 text-lg text-white transition-all duration-300 hover:bg-linear-to-t hover:to-50%"
        >
          View Missions
        </Link>
      </div>
    </div>
  )
}
