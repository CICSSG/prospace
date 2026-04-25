'use client'
import Grainient from "@/components/Grainient"
import LogoLoop from "@/components/logoloop"
import { Button } from "@/components/ui/button"
import { Award, Badge } from "lucide-react"
import Image from "next/image"

const techLogos = [
  {
    node: (
      <Image
        src={"/images/Prospace Logo.png"}
        width={80}
        height={80}
        alt="logo"
      />
    ),
    title: "AnimoAprendo",
    href: "https://animoaprendo.com",
  },
  {
    node: (
      <Image src={"/images/Prospace Logo Colored.png"} width={80} height={80} alt="logo" />
    ),
    title: "DLSUD",
    href: "https://dlsud.edu.ph",
  },
]

export default function Page() {
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
          <h1 className="mt-10 text-center text-5xl font-bold">
            Welcome to Prospace
          </h1>
          <p className="mt-4 text-center text-lg text-gray-300">
            Your gateway to the future of workspaces.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="outline" size="lg">
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="w-fit py-12 mx-auto">
        <div className="container px-4 flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-muted-foreground">
              Powered by CICSSG and Partners
            </h2>
          </div>
          <div className="w-full h-[120px] overflow-x-hidden overflow-y-clip">
            <LogoLoop
              logos={techLogos}
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
    </div>
  )
}
