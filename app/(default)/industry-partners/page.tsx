"use client"
import { motion } from "framer-motion"
import { moscaLaroke } from "@/components/prospace/fonts"
import { ChevronLeft, ExternalLink } from "lucide-react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import { CompanyPartner } from "../page"
import { getCollectionData } from "@/app/admin/actions"

const IndustryPartners = () => {
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
      <div className={`flex flex-col items-center gap-8 z-10 w-full max-w-4xl`}>
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-white/80 hover:text-white cursor-pointer mr-auto">
          <ChevronLeft />
          Back
        </button>
        <div
          className={`text-3xl ${moscaLaroke.className} tracking-wider md:text-4xl lg:text-5xl`}
        >
          INDUSTRY PARTNERS
        </div>
        <p className="text-center leading-tight font-thin tracking-[0.2rem] lg:text-start">
          Collaborate, learn, and grow with our partner network.
        </p>
      </div>

      <div className="z-10 mx-auto grid w-fit gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((partner, index) => (
          <div
            key={index}
            className="flex max-w-lg flex-row justify-center gap-2 rounded-lg border border-white/40 bg-linear-to-r from-[#7B4DFF]/22 to-[#7B4DFF]/10 px-4 py-4"
          >
            <Image
              src={partner.logoUrl}
              alt={partner.name}
              width={100}
              height={100}
              className="h-16 w-16 rounded-md object-contain"
            />
            <div className="flex w-full flex-col gap-2">
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
      </div>
    </div>
  )
}

export default IndustryPartners
