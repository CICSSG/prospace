"use client"

import Image from "next/image"
import { ChevronLeft, Link as LinkIcon, Mail } from "lucide-react"

type UserOverlayData = {
  fullName?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  course?: string
  school?: string
  shortBio?: string
  email?: string
  companyEmail?: string
  website?: string
  linkedin?: string
}

type ConnectUserOverlayProps = {
  open: boolean
  user: UserOverlayData | null
  onClose: () => void
}

export default function ConnectUserOverlay({
  open,
  user,
  onClose,
}: ConnectUserOverlayProps) {
  if (!open || !user) return null

  const displayName =
    user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed User"

  return (
    <div className="fixed inset-0 z-999 overflow-y-auto bg-[#02062a] p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="w-fit rounded-full p-1 text-white/90 transition hover:bg-white/10"
          aria-label="Close user details"
        >
          <ChevronLeft size={32} />
        </button>

        <div className="rounded-2xl border border-white/40 bg-linear-to-r from-primary/22 to-black/0 p-6 text-white shadow-xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-dashed border-2 border-[#ff5fa2]/50">
              <Image
                src={user.profileImageUrl || "/images/ProspaceMinimalLogo-2.png"}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-wide">
              {displayName}
            </h2>
            <p className="text-sm text-white/80">{user.course || "No course provided"}</p>
            <div className="rounded-full border border-white/50 px-4 py-1 text-xs text-white/80">
              {user.school || "No school provided"}
            </div>
          </div>

          <div className="my-5 h-px w-full bg-white/35" />

          <p className="text-sm leading-6 text-white/85">
            {user.shortBio ||
              "No bio provided yet. Add a short introduction to help others get to know you."}
          </p>
        </div>

        <div className="space-y-6 text-white">
          <div className="space-y-3">
            <p className="bg-linear-to-r from-primary/22 to-black/0 px-3 py-3 text-xs tracking-[0.35em] rounded">
              EMAIL
            </p>
            <p className="text-lg tracking-[0.3em] text-white/90">
              {user.email || "no-email@prospace.local"}
            </p>
          </div>

          <div className="space-y-3">
            <p className="bg-linear-to-r from-primary/22 to-black/0 px-3 py-3 text-xs tracking-[0.35em] rounded">
              SOCIAL LINKS
            </p>
            <div className="space-y-3 text-base text-white/90">
              <div className="flex items-center gap-3">
                <Mail size={18} />
                <span>{user.companyEmail || "company@email.com.ph"}</span>
              </div>
              <div className="flex items-center gap-3">
                <LinkIcon size={18} />
                <span>{user.website || "company.com.ph"}</span>
              </div>
              <div className="flex items-center gap-3">
                <LinkIcon size={18} />
                <span>{user.linkedin || "linkedin"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
