"use client"

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

const eventMap = [
  "Jellyfish Education",
  "Edata Services",
  "Placement Int'l",
  "Denso Corporation",
  "Advanced World Solutions",
  "Factset",
  "Sy & Partners",
  "Paref Southridge School",
  "Integrated OS",
  "Royal Cargo Inc",
  "Okada Manila",
  "First Aviation Academy",
  "Cambridge University Press & Assessment",
  "Everise",
  "O!Save",
  "TRND Marketing Inc",
  "PTC",
  "Wells Fargo",
  "DLSU-D",
  "Seemesol",
  "Federal Land",
  "Fiberblaze",
  "TESDA",
  "BIR",
  "PNP",
  "Philippine Army",
  "Philippine Navy",
  "BIMP",
  "Fujisash",
  "Super Shopping",
  "iQor RMS Collect",
  "Manulife",
  "Telford Svc",
  "MMA Competent",
  "Worksavers",
  "One Source",
  "BASIC Inc",
  "Acabar Marketing",
  "Megaworld"
]


export default function EventMapComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative cursor-pointer z-10"
        aria-label="Open event map"
      >
        <Image
          src={"/images/FloorPlan.png"}
          alt="Event Map"
          width={800}
          height={600}
          className="object-contain rounded-xl h-fit overflow-hidden aspect-square size-128 transition-opacity duration-200 group-hover:opacity-80"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="rounded-full bg-black/60 px-4 py-2 text-sm tracking-widest text-white">
            VIEW FULL MAP
          </span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-5xl flex-col gap-6 overflow-y-auto rounded-2xl border border-white/20 bg-[#05091d] p-6 lg:flex-row lg:overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>

            {/* Floor plan */}
            <div className="flex shrink-0 items-center justify-center lg:w-1/2">
              <Image
                src={"/images/FloorPlan.png"}
                alt="Event Map"
                width={1200}
                height={900}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            </div>

            {/* Company list */}
            <div className="flex flex-col gap-3 lg:w-1/2 lg:overflow-y-auto">
              <h2 className="sticky top-0 bg-[#05091d] pb-2 text-center text-sm font-semibold tracking-[0.3rem] text-white">
                EXHIBITORS
              </h2>
              <ol className="flex flex-col gap-1.5">
                {eventMap.map((company, index) => (
                  <li key={index} className="flex flex-row items-start gap-3 text-sm text-white/80">
                    <span className="w-7 shrink-0 text-right font-mono text-white/40">
                      {index + 1}.
                    </span>
                    <span className="tracking-wide">{company}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
