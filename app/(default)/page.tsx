"use client"
import { motion } from "framer-motion"
import Grainient from "@/components/Grainient"
import LogoLoop from "@/components/logoloop"
import { Button } from "@/components/ui/button"
import { ArrowRight, Award, Badge } from "lucide-react"
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

type Logo = {
  node: React.ReactNode
  title: string
  href: string
}

const SDGLogos = [
  "/images/SDG4.png",
  "/images/SDG8.jpg",
  "/images/SDG9.jpg",
  "/images/SDG10.png",
  "/images/SDG17.png",
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
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative flex min-h-lvh max-w-screen flex-col justify-center overflow-hidden">
        <div className="z-5 absolute min-h-lvh w-full bg-linear-to-t from-[#0e1231] to-60% to-[#0d0d1f]/0"/>
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
        <div className="absolute top-0 left-0 h-lvh w-screen grow flex flex-col z-10">
          <div className="relative grow">
            <motion.div
              initial={{ opacity: 0, y: -200 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute -top-10 left-0 w-full"
            >
              <Image
                src={"/images/HeroHandTop.png"}
                alt={"Hero Hand Top"}
                width={1028}
                height={1028}
                className=" object-cover object-top-right max-w-xs"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 200 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute -bottom-5 right-0 w-full"
            >
              <Image
                src={"/images/HeroHandBottom.png"}
                alt={"Hero Hand Bottom"}
                width={1028}
                height={1028}
                className="ml-auto max-w-76"
              />
            </motion.div>

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

        <motion.div
          className="z-5 mx-auto flex max-w-md flex-col items-center justify-center px-10 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <p
            className={
              sora.className +
              " text-xl font-light tracking-[0.5rem] text-white lg:text-4xl"
            }
          >
            WELCOME TO
          </p>
          <Image
            src={"/images/ProSpaceTitle.png"}
            alt={"ProSpace Title"}
            width={512}
            height={128}
            className="my-4 w-full object-contain lg:max-w-lg"
          />
        </motion.div>
      </section>

      {/* SCHEDULE */}
      <section className="border-b ">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-2 py-12 lg:grid-cols-2 lg:px-4">
          {/* Prospace Information */}
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex flex-row gap-2">
              <Image
                src={"/images/DLSUD.png"}
                alt={"DLSUD Logo"}
                width={30}
                height={30}
                className=""
              />
              <Image
                src={"/images/CICSSG.png"}
                alt={"CICSSG Logo"}
                width={30}
                height={30}
                className=""
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">ProSpace 2026</h1>
              <h1 className="text-xl font-normal">
                The DLSU-D Tech and Career Expo
              </h1>
            </div>
            <p className="text-muted-foreground">
              An event to respond to the growing need for structured career
              preparation and exposure to industry practices, emerging
              technologies, and real hiring environments.
            </p>
            <p className="text-muted-foreground">
              Empowering students to thrive in the digital workforce
            </p>
            <div className="mt-4 flex flex-row items-center gap-2">
              {SDGLogos.map((logo, index) => (
                <Image
                  key={index}
                  src={logo}
                  alt={`SDG Logo`}
                  width={65}
                  height={65}
                  className="rounded-lg"
                />
              ))}
            </div>
          </div>

          <div>
            <Table className="border-border">
              <TableHeader>
                <TableRow className="*:border-border *:font-semibold [&>:not(:last-child)]:border-r">
                  <TableHead className="w-45 text-center">
                    Online Career Sessions
                  </TableHead>
                  <TableHead colSpan={2} className="text-center">
                    Job Fair
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="*:border-border *:bg-primary/10 *:text-center *:text-lg [&>:not(:last-child)]:border-r">
                  <TableCell>May 16</TableCell>
                  <TableCell>May 27</TableCell>
                  <TableCell>May 28</TableCell>
                </TableRow>
                <TableRow className="*:border-border *:text-center [&>:not(:last-child)]:border-r">
                  <TableCell>Saturday</TableCell>
                  <TableCell>Monday</TableCell>
                  <TableCell>Tuesday</TableCell>
                </TableRow>
                <TableRow className="*:border-border *:text-center [&>:not(:last-child)]:border-r">
                  <TableCell>OPEN TO ALL</TableCell>
                  <TableCell>DLSU-D ONLY</TableCell>
                  <TableCell>OPEN TO ALL</TableCell>
                </TableRow>
                <TableRow className="*:border-border *:text-center [&>:not(:last-child)]:border-r">
                  <TableCell rowSpan={2} className="text-xs xl:text-base">
                    Microsoft Teams and Live
                  </TableCell>
                  <TableCell
                    rowSpan={2}
                    colSpan={2}
                    className="max-w-20 text-xs text-wrap xl:text-base"
                  >
                    Salrial Hall and PBH Courtyard <br />
                    De La Salle University Dasmariñas
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="mx-auto w-fit max-w-[90vw] py-12">
        <div className="container flex flex-col items-center px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">
              Aligning success, igniting careers
            </h2>
          </div>
          <div className="flex flex-row items-center gap-8">
            <CountdownTimer />
          </div>
        </div>
        <Show when="signed-out">
          <Link
            href={"/signup"}
            className="mx-auto mt-4 flex w-full max-w-sm cursor-pointer flex-row items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-lg text-white hover:bg-primary/80"
          >
            Sign Up <ArrowRight />
          </Link>
        </Show>
      </section>

      {/* PARTNERS */}
      <section className="mx-auto w-fit max-w-[90vw] border-t py-12">
        <div className="container flex flex-col items-center px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">
              Powered by CICSSG and Partners
            </h2>
          </div>
          <div className="h-30 w-full overflow-x-hidden overflow-y-clip">
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

      {/* CAREER SESSIONS */}
      <section></section>
    </div>
  )
}
