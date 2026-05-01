"use client"
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
    <div>
      {/* HERO */}
      <section className="relative">
        <div
          style={{ height: "100px" }}
          className="h-full min-h-screen w-full opacity-50"
        >
          <Grainient
            color1="#1b0f2e"
            color2="#ff5fa2"
            color3="#7b4dff"
            timeSpeed={0.5}
            colorBalance={0.2}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={180}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-1/2">
          <h1
            className={`mt-10 text-center text-5xl font-bold text-white lg:text-7xl ${moscaLaroke.className}`}
          >
            Welcome to ProSPACE
          </h1>
          <p className="mt-4 text-center text-lg text-primary-foreground/80 lg:text-3xl">
            Your gateway to the future.
          </p>
          <Show when="signed-out">
            <Link href={"/signup"} className="mt-6 flex justify-center hover:cursor-pointer">
              <Button variant="outline" size="lg" className="text-xl cursor-pointer">
                Register Now
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="bg-linear border-b from-primary/50 to-primary/20">
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
              fadeOutColor="#0c090c"
              ariaLabel="Technology partners"
            />
          </div>
        </div>
      </section>

      {/* CAREER SESSIONS */}
      <section>
        
      </section>
    </div>
  )
}
