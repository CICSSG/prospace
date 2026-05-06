"use client"

import Image from "next/image"
import { Link as LinkIcon, Mail, Minimize2, X } from "lucide-react"

type CompanyOverlayData = {
  name?: string
  imageUrl?: string
  logoUrl?: string
  socialLinks?: Array<{
    platform?: string
    url?: string
  }>
  companyEmail?: string
  description?: string
}

type ConnectCompanyOverlayProps = {
  open: boolean
  company: CompanyOverlayData | null
  onClose: () => void
}

export default function ConnectCompanyOverlay({
  open,
  company,
  onClose,
}: ConnectCompanyOverlayProps) {
  if (!open || !company) return null

  const displayName = company.name || "Unnamed Company"
  const primaryImage = company.logoUrl || company.imageUrl || "/images/ProspaceMinimalLogo-2.png"

  return (
    <div
      className="fixed inset-0 z-199 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-160 overflow-hidden rounded-2xl border border-white/60 bg-linear-to-r from-primary/22 to-transparent p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#d3b8ff] transition hover:bg-white/10"
          aria-label="Close company details"
        >
          <Minimize2 size={28} />
        </button>

        <div className="flex flex-row gap-6 sm:flex-row sm:items-center">
          <div className="flex h-30 w-30 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/30 sm:h-40 sm:w-40">
            <Image
              src={primaryImage}
              alt={displayName}
              width={160}
              height={160}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center pt-2 sm:pt-0">
            <h2 className="text-2xl font-semibold tracking-wider text-white sm:text-5xl">
              {displayName}
            </h2>
            <p className="mt-1 text-xs font-thin text-white/85">
              {company.description || "Company description not available"}
            </p>
          </div>
        </div>

        <div className="my-6 h-px w-full bg-white/75" />

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm tracking-[0.35em] text-white/95">ABOUT</p>
            <p className="text-[15px] leading-7 text-white/90">
              {company.description ||
                "No company description provided yet."}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm tracking-[0.35em] text-white/95">CONTACTS</p>
            <div className="space-y-3 text-[15px] text-white/90">
              <div className="flex items-center gap-3">
                <Mail size={18} />
                <span>{company.companyEmail || "company@email.com.ph"}</span>
              </div>
              {company.socialLinks?.length ? (
                company.socialLinks.map((link) => (
                  <div key={`${link.platform}-${link.url}`} className="flex items-center gap-3">
                    <LinkIcon size={18} />
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate underline decoration-white/40 underline-offset-4 hover:decoration-white"
                    >
                      {link.platform || link.url}
                    </a>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
