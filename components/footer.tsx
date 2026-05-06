import localFont from "next/font/local"
import Image from "next/image"

const sora = localFont({
  src: "./sora-regular.ttf",
  display: "swap",
})

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-linear-to-t from-[#6842d5] to-[#6842d5]/0 pt-15 pb-10">
      <div className="mx-15 flex flex-col items-center justify-center gap-8">
        <Image
          src={"/images/Prospace-DLSU-D.png"}
          width={512}
          height={128}
          alt="ProSpace"
        />

        <p
          className={`text-center tracking-widest text-white/80 ${sora.className}`}
        >
          Explore sessions, connect with partners, and start your professional
          journey.
        </p>
      </div>

      <div className="mx-10 mt-15 flex flex-col gap-4 items-center justify-center">
        <Image
          src={"/images/cicssg-colored.png"}
          width={150}
          height={64}
          alt="CICSSG Logo"
        />

        <p
          className={`font text-center tracking-[0.15em] text-white ${sora.className}`}
        >
          &copy; {new Date().getFullYear()} DLSU-D CICSSG. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
