import Image from "next/image"
import { sora } from "@/components/prospace/fonts"

export default function Footer() {
  return (
    <footer className="relative w-full overflow-x-clip bg-linear-to-t pt-15 pb-10 bg-[#05091D]">
      <Image 
        src={"/images/HalfCircle.png"}
        width={2520}
        height={1000}
        alt="Half Circle Background"
        className="absolute -top-4/6 lg:-top-full left-1/2 w-[calc(150vw)] -translate-x-1/2 opacity-80 select-none"
      />
      <div className="absolute -top-1/2 left-1/2 h-[calc(110%)] w-[calc(100vw+30%)] -translate-x-1/2 rounded-[50%] bg-[#BCA4FF]/20 blur-[100px]" />
      <div className="absolute bottom-10 w-full h-full overflow-clip z-1">
        <Image
            src={"/images/FooterBuildingsBG.png"}
            width={1920}
            height={400}
            alt="Footer Background"
            className="z-1 h-[calc(110%)] w-full object-cover object-top opacity-30 select-none"
          />
        <div className="absolute -bottom-1/2 left-1/2 h-[calc(110%)] w-[calc(100vw+50%)] -translate-x-1/2 rounded-[50%] bg-[#05091D] blur-[50px] z-5" />
      </div>

      <div className="relative z-10 mx-15 flex flex-col items-center justify-center gap-8">
        <Image
          src={"/images/Prospace-DLSU-D.png"}
          width={420}
          height={128}
          alt="ProSpace"
        />

        <p
          className={`text-light max-w-2xl text-center text-lg tracking-[0.3rem] text-white/80`}
        >
          Explore sessions, connect with partners, and start your professional
          journey.
        </p>
      </div>

      <div className="relative z-10 mx-10 mt-15 flex flex-col items-center justify-center gap-4 space-y-5">
        <div className="flex flex-row flex-wrap gap-4 lg:gap-8 items-center justify-center">
          <Image
          src={"/images/Footer DLSUD.png"}
          width={150}
          height={50}
          alt="DLSUD Logo"
          className="w-fit object-contain"
        />
        <Image
          src={"/images/Footer AARO.png"}
          width={150}
          height={50}
          alt="AARO Logo"
          className="w-fit object-contain"
        />
        <Image
          src={"/images/Footer CICSSG.png"}
          width={150}
          height={50}
          alt="CICSSG Logo"
          className="w-fit object-contain"
        />
        <Image
          src={"/images/Footer Impact.png"}
          width={150}
          height={50}
          alt="Impact Logo"
          className="w-fit object-contain"
        />
        <Image
          src={"/images/Footer Prospace.png"}
          width={150}
          height={50}
          alt="Prospace Logo"
          className="w-fit object-contain"
        />
        </div>

        <p
          className={`font text-center tracking-[0.15em] text-white `}
        >
          &copy; {new Date().getFullYear()} DLSU-D CICSSG. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
