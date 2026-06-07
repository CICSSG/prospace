"use client"
import { motion } from "framer-motion"
import { moscaLaroke } from "@/components/prospace/fonts"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { CompanyPartner } from "../page"
import { getCollectionData } from "@/app/(management)/admin/actions"

const IndustryPartners = [
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    link: "https://www.bossjob.com",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    link: "https://www.bossjob.com",
  },
  {
    name: "Bossjob",
    logoUrl: "https://placehold.co/400/png",
    description: "Job matching platform",
    link: "https://www.bossjob.com",
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

const JobFair = () => {
  const [companies, setCompanies] = useState<CompanyPartner[]>([])

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
        platform: item.socialLinks?.[0]?.platform,
        link: item.socialLinks?.[0]?.url,
        companyEmail: item.companyEmail,
      }))

      setCompanies(fetchedCompanies)
    })
  }, [])

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
      <div className={`flex flex-col items-center gap-8`}>
        <div
          className={`text-4xl ${moscaLaroke.className} md:text-5xl lg:text-6xl`}
        >
          job faIR
        </div>
        <p className="text-center leading-tight font-thin tracking-[0.2rem] lg:text-start">
          Discover internship and job openings from leading companies.
        </p>
        <div className="z-10 mx-auto flex aspect-video w-full max-w-200 flex-col items-center justify-center gap-2 rounded-xl border border-white/40 bg-linear-to-r from-[#7B4DFF]/22">
          <h1 className="font-thin tracking-wider md:text-2xl">
            JUNE • TUESDAY & WEDNESDAY
          </h1>
          <div className="relative">
            <p
              className={`z-1 text-center text-5xl font-bold md:text-8xl ${moscaLaroke.className}`}
            >
              09 • 10
            </p>
            <p
              className={`absolute top-0 left-0 text-center text-5xl font-bold blur-xs md:text-8xl ${moscaLaroke.className}`}
            >
              09 • 10
            </p>
          </div>
          <p className="text-xl font-light md:text-3xl">
            Salrial Hall and PBH Courtyard
          </p>
          <div className="flex w-full flex-row items-center justify-center gap-4 font-light tracking-wide text-white/80 md:gap-12">
            <p>De La Salle University Dasmariñas</p>
            <p>8AM to 5PM</p>
          </div>
          <div
            className={`h-fit rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#7B4DFF]/50 px-8 py-1 text-center text-sm`}
          >
            Open to All La Salle Branches
          </div>
        </div>
      </div>

      <h1 className="z-10 text-2xl">
        Registration until <span className="font-bold">June 01</span>
      </h1>
      <Link
        href={"/signup"}
        className="z-10 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#7B4DFF]/50 px-12 py-1 text-center text-lg"
      >
        Register Now !
      </Link>

      <div className="relative mx-8 my-8 flex w-full flex-col gap-3">
        <h1 className="z-10 text-center text-lg font-thin tracking-[0.4rem] lg:text-2xl">
          INDUSTRY PARTNERS
        </h1>
        <p className="z-10 text-center leading-tight font-thin tracking-[0.2rem]">
          Collaborate, learn, and grow with our partner network.
        </p>
        <div className="z-10 mx-auto grid w-fit gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.slice(0, 6).map((partner, index) => (
            <div
              key={index}
              className="flex max-w-xs flex-row justify-center gap-2 rounded-lg border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/10 px-4 py-4"
            >
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={100}
                height={100}
                className="h-16 w-16 rounded-md object-contain outline"
              />
              <div className="flex w-full flex-col justify-center gap-2">
                <p className="text-sm font-medium">{partner.name}</p>
                <p className="text-xs text-white/80">{partner.description}</p>
                {partner.link && (
                  <Link
                    href={partner.link || "#"}
                    target="_blank"
                    className="mt-auto flex w-fit flex-row items-center gap-1 rounded-full border border-white/60 bg-linear-to-b from-black/10 to-[#7B4DFF]/50 px-2 py-1 text-xs text-white outline"
                  >
                    {partner.platform}
                    <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {companies.length > 6 && (
            <Link
              href="industry-partners"
              className="ml-auto flex flex-row gap-0.5 font-thin tracking-widest md:col-span-2 lg:col-span-3"
            >
              View All <ChevronRight strokeWidth={0.8} />
            </Link>
          )}

          {companies.length === 0 && (
            <p className="col-span-full text-center text-lg font-light text-white/80">
              No industry partners available at the moment.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobFair
