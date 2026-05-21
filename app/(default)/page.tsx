"use client"
import { motion } from "framer-motion"
import Grainient from "@/components/Grainient"
import LogoLoop from "@/components/logoloop"
import { Button } from "@/components/ui/button"
import { ArrowRight, Award, Badge, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useEffect, useState, useRef } from "react"
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
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import Link from "next/link"
import { Show } from "@clerk/nextjs"
import { WebMode } from "../types"
import ColorBends from "@/components/ColorBends"
import DividerComponent from "@/components/divider"
import { div } from "three/src/nodes/math/OperatorNode.js"
import EventScheduleComponent from "@/components/prospace/event-schedule"
import EventMapComponent from "@/components/prospace/event-map"

type Logo = {
  node: React.ReactNode
  title: string
  href: string
}

type CompanyPartner = {
  _id?: string
  imageUrl?: string
  logoUrl?: string
  name?: string
  description?: string
  socialLinks?: Array<{
    platform?: string
    url?: string
  }>
  companyEmail?: string
}

const topHandVariants = {
  initial: { opacity: 0, x: -200 },
  slideIn: {
    opacity: 1,
    x: 0,
    transition: { duration: 1.5, ease: "easeOut" as const },
  },
  hover: {
    opacity: 1,
    x: 0,
    y: [0, -15, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
  },
}

const bottomHandVariants = {
  initial: { opacity: 0, x: 200 },
  slideIn: {
    opacity: 1,
    x: 0,
    transition: { duration: 1.5, ease: "easeOut" as const },
  },
  hover: {
    opacity: 1,
    x: 0,
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
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  ,
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
  {
    title:
      "Engineering the Experience: Building Secure, Scalable Web and Mobile Platforms",
    time: "8:30 AM - 10:30 AM",
    date: "JUNE 6",
    tag: "Filipino Web Development Peers",
    imageUrl: "https://placehold.co/400/png",
  },
]

// const IndustryPartners = [
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   }
//   ,
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   }
//   ,
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   }
//   ,
//   {
//     name: "Bossjob",
//     logoUrl: "https://placehold.co/400/png",
//     description: "Job matching platform",
//   },
// ]

export default function Page() {
  const mode = process.env.NEXT_PUBLIC_MODE as WebMode
  const [animateHover, setAnimateHover] = useState(false)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const [companies, setCompanies] = useState<CompanyPartner[]>([])
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

  useEffect(() => {
    getCollectionData("companies").then((res) => {
      const data = Array.isArray(res?.data) ? res.data : []
      const fetchedCompanies = data.map((item: CompanyPartner) => ({
        _id: item._id,
        imageUrl: item.imageUrl,
        logoUrl: item.logoUrl,
        name: item.name,
        description: item.description,
        socialLinks: Array.isArray(item.socialLinks) ? item.socialLinks : [],
        companyEmail: item.companyEmail,
      }))

      setCompanies(fetchedCompanies)
    })
  }, [])

  // keep the carousel edge-to-edge without extra start/end spacing
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const initialScrolledRef = { current: false } as { current: boolean }
    const lastIsLgRef = { current: null as boolean | null }

    const compute = () => {
      // detect breakpoint change
      const isLg = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width:1028px)").matches
      if (lastIsLgRef.current === null) lastIsLgRef.current = isLg
      if (lastIsLgRef.current !== isLg) {
        lastIsLgRef.current = isLg
        initialScrolledRef.current = false
      }

      // perform initial scroll: 2nd item on lg, 1st on smaller
      if (!initialScrolledRef.current) {
        const items = Array.from(el.querySelectorAll<HTMLElement>(".snap-center"))
        if (items.length) {
          const desiredIndex = isLg ? 1 : 0
          const index = Math.min(desiredIndex, items.length - 1)
          const targetItem = items[index]
          const target = targetItem.offsetLeft - (el.clientWidth - targetItem.offsetWidth) / 2
          el.scrollTo({ left: Math.max(0, Math.round(target)), behavior: "smooth" })
        }
        initialScrolledRef.current = true
      }
    }
    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [carouselRef.current])

  // programmatic snap on scroll end to avoid browser creating multiple snap points
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    let timer: number | null = null
    const onScroll = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const children = Array.from(el.children) as HTMLElement[]
        if (!children.length) return
        const containerCenter = el.scrollLeft + el.clientWidth / 2
        let closest: HTMLElement | null = null
        let closestDiff = Infinity
        for (const child of children) {
          const rect = child.getBoundingClientRect()
          const childCenter = child.offsetLeft + rect.width / 2
          const diff = Math.abs(childCenter - containerCenter)
          if (diff < closestDiff) {
            closestDiff = diff
            closest = child
          }
        }
        if (closest) {
          const target = closest.offsetLeft - (el.clientWidth - closest.offsetWidth) / 2
          el.scrollTo({ left: Math.max(0, Math.round(target)), behavior: "smooth" })
        }
      }, 120)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (timer) window.clearTimeout(timer)
    }
  }, [carouselRef.current])

  return (
    <div className="max-w-svw overflow-hidden">
      <style jsx>{`
        .career-carousel {
          scrollbar-color: rgba(255,255,255,0.12) transparent;
          scrollbar-width: thin;
          scroll-behavior: smooth;
        }
        .career-carousel::-webkit-scrollbar { height: 10px; }
        .career-carousel::-webkit-scrollbar-track { background: transparent; }
        .career-carousel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 9999px;
          border: 2px solid rgba(0,0,0,0.12);
        }
        .career-carousel::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.22);
        }
      `}</style>
      {/* HERO */}
      <section className="relative flex min-h-lvh w-svw flex-col justify-center overflow-hidden">
        <div className="absolute z-10 min-h-lvh w-full bg-linear-to-t from-[#05091d] to-[#05091d]/0 to-50%" />
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
              className="absolute top-10 left-0 w-full lg:-top-40 lg:-left-20 2xl:-top-70 2xl:-left-10"
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

            <div className="relative h-lvh w-screen animate-pulse animate-duration-4000 animate-ease-in-out animate-infinite">
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
              "text-xl font-light tracking-[0.5rem] text-white lg:text-xl"
            }
          >
            WELCOME TO
          </p>
          <Image
            src={"/images/ProSpaceTitle.png"}
            alt={"ProSpace Title"}
            width={612}
            height={228}
            className="my-4 w-full object-contain 2xl:max-w-2xl"
          />
        </motion.div>
      </section>
      <div className="relative w-full">
        <div className="absolute top-1/2 left-1/2 z-10 h-50 w-[calc(100vw+30%)] -translate-1/2 rounded-[50%] bg-[#BCA4FF]/30 blur-[100px]" />
      </div>
      {/* SCHEDULE */}
      <section className="relative z-10 mx-4">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-2 py-12 lg:grid-cols-2 lg:px-4 xl:gap-24">
          {/* Prospace Information */}
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <div className="mx-auto flex w-fit flex-row items-center gap-8">
              <Image
                src={"/images/DLSU-D Logo.png"}
                alt={"DLSUD Logo"}
                width={130}
                height={100}
                className="h-fit object-contain"
              />
              <Image
                src={"/images/AARO Logo.png"}
                alt={"AARO Logo"}
                width={50}
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
                className="w-full max-w-md object-contain"
              />
            </div>
            <p className="mx-4 text-white/90 lg:mx-0">
              An event to respond to the growing need for structured career
              preparation and exposure to industry practices, emerging
              technologies, and real hiring environments.
            </p>
            <p className="mx-4 text-white/90 lg:mx-0">
              Empowering students to thrive in the digital workforce
            </p>
            <div className="mt-4 flex flex-row items-center gap-3">
              {SDGLogos.map((logo, index) => (
                <Image
                  key={index}
                  src={logo}
                  alt={`SDG Logo`}
                  width={55}
                  height={65}
                  className="h-fit rounded-xs opacity-80"
                />
              ))}
            </div>
          </div>

          <div className="lg:hidden">
            <DividerComponent />
          </div>

          <EventScheduleComponent />
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="relative flex flex-col items-center justify-center py-42 text-center">
        <div className="absolute top-1/2 left-1/2 z-1 h-80 w-[calc(50vw)] -translate-1/2 rounded-[50%] bg-linear-to-b from-[#FFC5DD] to-[#680F34] opacity-40 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-220 w-[calc(100vw)] -translate-1/2 rounded-[50%] bg-linear-to-b from-[#BCA4FF] to-[#05091D] opacity-30 blur-[100px]" />
        <Image
          src={"/images/starPink.png"}
          alt="Hero Star Bottom"
          width={400}
          height={400}
          className="absolute -top-50 -left-40 z-1 animate-spin blur-2xl animate-duration-150000 animate-infinite"
        />
        <Image
          src={"/images/starPink.png"}
          alt="Hero Star Bottom"
          width={400}
          height={400}
          className="absolute -right-50 -bottom-50 z-1 animate-spin blur-2xl animate-duration-150000 animate-infinite"
        />
        <div className="relative z-10 container flex flex-col items-center px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-light tracking-[0.2rem] text-white">
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
            className="relative z-10 mx-auto mt-4 flex w-full max-w-sm cursor-pointer flex-row items-center justify-center gap-2 rounded-full border border-white/80 bg-linear-to-t from-white/10 to-white/0 to-30% px-4 py-1 text-lg text-white transition-all duration-300 hover:bg-linear-to-t hover:to-50%"
          >
            Register Now!
          </Link>
        </Show>
      </section>

      {/* PARTNERS */}
      <section className="relative z-10 mx-auto w-fit max-w-[90vw] py-12">
        <div className="container flex flex-col items-center px-4">
          <div className="mb-8 text-center">
            <h2
              className={`text-sm font-light tracking-[0.2rem] text-muted-foreground lg:text-2xl ${sora.className}`}
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
              ariaLabel="Technology partners"
            />
          </div>
        </div>
      </section>

      {/* CAREER SESSIONS */}
      <section className="relative z-10 max-w-7xl mx-auto overflow-visible  my-8 flex flex-col gap-3">
        <div
          className={`flex w-full items-center justify-between flex-col`}
        >
          <h2
            className={`text-center tracking-[0.3rem] uppercase ${sora.className} lg:text-2xl`}
          >
            Career Sessions
          </h2>
          
        </div>
        <p
          className={`mr-5 text-center text-sm leading-snug tracking-[0.15rem] text-white/80 ${sora.className}`}
        >
          Live discussions and workshops led by industry experts — June 6 via MS
          Teams and Facebook Live.
        </p>
        <div
          ref={carouselRef}
          className="career-carousel mt-8 flex w-full flex-row items-center gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 overflow-y-hidden"
          style={{ touchAction: "pan-x" }}
          role="region"
          aria-label="Career sessions carousel"
        >
          {mode === "registration" ? (
            <p className="mt-8 text-center tracking-[0.3rem]">COMING SOON</p>
          ) : (
            CareerSessions.map((session, index) => (
              <div
                key={index}
                className="snap-center snap-always shrink-0 w-sm flex flex-row overflow-hidden rounded-lg border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/0 text-sm"
              >
                <Image
                  src={`${session?.imageUrl}`}
                  alt="Career Session"
                  width={100}
                  height={300}
                  className="border-r object-cover opacity-30"
                />
                <div className="col-span-2 flex flex-col gap-2 p-2 leading-[1.1em]">
                  <h1 className="text-xs leading-[1.1em] tracking-widest">
                    {session?.title}
                  </h1>
                  <div className="mt-1 flex flex-col gap-1">
                    <p className="text-[0.65rem] leading-0 font-thin tracking-widest">
                      {session?.time}
                    </p>
                    <p className="text-[0.65rem] font-thin">{session?.date}</p>
                  </div>
                  <div className="w-fit rounded-full border border-white/40 px-6 py-0.5 text-[0.65rem] font-thin">
                    {session?.tag}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {mode === "production" && (
            <Link
              href={"/career"}
              className="flex h-fit flex-row items-center gap-2 ml-auto mr-4 text-white/60 transition-all duration-300 hover:text-white"
            >
              <div className="flex flex-row items-center text-sm">
                View All <ChevronRight className="size-5" />
              </div>
            </Link>
          )}
      </section>

      <div className="relative w-full h-1">
        <div className="absolute top-1/2 left-1/2 h-150 w-[calc(100vw+30%)] -translate-1/2 rounded-[50%] bg-[#BCA4FF]/30 blur-[200px]" />
        <Image 
          src={"/images/starPurple.png"}
          alt="Hero Star Bottom"
          width={400}
          height={400}
          className="absolute -top-50 -left-40 z-1 animate-spin blur-2xl animate-duration-150000 animate-infinite opacity-50"
        />
        <Image 
          src={"/images/starPurple.png"}
          alt="Hero Star Bottom"
          width={400}
          height={400}
          className="absolute -top-50 -right-40 z-1 animate-spin blur-2xl animate-duration-150000 animate-infinite opacity-50"
        />
      </div>

      {/* INDUSTRY PARTNERS */}
      <div className="relative my-8 flex flex-col items-center gap-3 z-10 max-w-7xl mx-auto">
        <div
          className={`flex w-full items-center justify-between flex-col`}
        >
          <h2
            className={`text-center tracking-[0.3rem] uppercase ${sora.className} lg:text-2xl`}
          >
            Industry Partners
          </h2>
          
        </div>
        <p
          className={`mr-5 text-sm leading-snug tracking-[0.15rem] text-white/80 ${sora.className} text-center`}
        >
          Meet the organizations shaping the technology landscape.
        </p>
        {mode === "registration" ? (
          <p className="mt-8 text-left tracking-[0.3rem]">COMING SOON</p>
        ) : (
          <div className="w-full snap-x snap-mandatory overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid auto-cols-[minmax(14rem,14rem)] grid-flow-col grid-rows-2 gap-2 px-2">
              {companies.length ? (
                companies.map((partner, index) => (
                  <div
                    key={partner._id || `${partner.name}-${index}`}
                    className="flex h-full snap-center flex-col rounded-2xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/0 p-3"
                  >
                    <Image
                      src={
                        partner.logoUrl ||
                        partner.imageUrl ||
                        "/images/ProspaceMinimalLogo-2.png"
                      }
                      alt={partner.name || "Company logo"}
                      width={200}
                      height={100}
                      className="aspect-square h-12 w-fit rounded-lg object-contain opacity-80"
                    />
                    <p className="mt-1 text-sm font-semibold tracking-widest text-white/80">
                      {partner.name || "Unnamed Company"}
                    </p>
                    <p className="mt-1 text-xs font-light tracking-widest text-white/50">
                      {partner.description || "No description available"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full row-span-3 flex min-h-40 snap-center items-center justify-center rounded-2xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/0 px-6 text-center tracking-[0.3rem] text-white/70">
                  LOADING COMPANIES
                </div>
              )}
            </div>
          </div>
        )}
        {mode === "production" && (
            <Link
              href={"/partners"}
              className="flex h-fit ml-auto mr-4 flex-row items-center gap-2 text-white/60 transition-all duration-300 hover:text-white"
            >
              <div className="flex flex-row items-center text-sm">
                View All <ChevronRight className="size-5" />
              </div>
            </Link>
          )}
      </div>

      <div className="mx-8">
        <DividerComponent />
      </div>

      {/* NAVIGATE */}
      <div className="mx-8 my-8 flex flex-col gap-3">
        <h1 className="text-center text-lg font-thin tracking-[0.2rem]">
          NAVIGATE
        </h1>
        <EventMapComponent />
        {/* <div className="aspect-square rounded-xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22"></div> */}
      </div>

      <div className="mx-8">
        <DividerComponent />
      </div>

      {/* EVENT MISSIONS */}
      <div className="mx-8 my-8 flex flex-col gap-3">
        <h1 className="text-center text-lg font-thin tracking-[0.2rem]">
          EVENT MISSIONS
        </h1>
        {mode === "registration" ? (
          <p className="mt-8 text-center tracking-[0.3rem]">COMING SOON</p>
        ) : (
          <>
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
                <p className="tracking-[0.2rem]">
                  Sign Up to Gen AI Philippines
                </p>
              </div>
            </div>

            <Link
              href={"/missions"}
              className="mx-auto mt-4 flex cursor-pointer flex-row items-center justify-center gap-2 rounded-full border border-white/80 bg-linear-to-t from-white/10 to-white/0 to-30% px-14 py-1 text-lg text-white transition-all duration-300 hover:bg-linear-to-t hover:to-50%"
            >
              View Missions
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
