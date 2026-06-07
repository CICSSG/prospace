"use client"

import { useUser } from "@clerk/nextjs"
import { ReactQRCode, ReactQRCodeRef } from "@lglab/react-qr-code"
import { Check, Move, Sparkles, UserRound, X, ZoomIn } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { UploadImageToBlobStorage } from "@/app/(management)/admin/actions"

import { cn } from "@/lib/utils"
import { MongoUserProfile } from "../layout"
import Link from "next/link";
import { toast } from "sonner";

type EditableUser = {
  id?: string
  firstName?: string | null
  lastName?: string | null
  primaryEmailAddress?: { emailAddress?: string | null } | null
  emailAddresses?: Array<{ emailAddress?: string | null }>
  update?: (data: {
    firstName?: string
    lastName?: string
    password?: string
  }) => Promise<unknown> | unknown
}

type MongoUserRecord = {
  _id?: string
  clerkId?: string
  firstName?: string
  lastName?: string
  email?: string
  course?: string
  shortBio?: string
  socialLinks?: string[]
  portfolioLink?: string
  createdAt?: string
  updatedAt?: string
  userId?: number
  resumeUpdate?: boolean
  showResumeInConnect?: boolean
}

type SocialLink = {
  value: string
}

function getSocialLinkLabel(value: string) {
  const host = getSocialLinkHost(value)

  if (!host) {
    return "Link"
  }

  if (host.includes("blob.vercel-storage.com")) {
    return "Resume"
  }

  if (host.includes("github.com")) return "GitHub"
  if (host.includes("x.com") || host.includes("twitter.com")) return "X"
  if (host.includes("instagram.com")) return "Instagram"
  if (host.includes("linkedin.com")) return "LinkedIn"
  if (host.includes("facebook.com") || host.includes("fb.com"))
    return "Facebook"
  if (host.includes("youtube.com") || host.includes("youtu.be"))
    return "YouTube"
  if (host.includes("tiktok.com")) return "TikTok"
  if (host.includes("discord.com") || host.includes("discord.gg"))
    return "Discord"
  if (host.includes("behance.net")) return "Behance"
  if (host.includes("dribbble.com")) return "Dribbble"
  if (host.includes("medium.com")) return "Medium"
  if (host.includes("substack.com")) return "Substack"

  return host.split(".")[0] || "Website"
}

function isResumeLink(value: string) {
  return normalizeSocialLink(value).includes("blob.vercel-storage.com")
}

function normalizeSocialLink(value: string) {
  return value.replace(/\s+/g, "")
}

function getSocialLinkHost(value: string) {
  const normalizedInput = normalizeSocialLink(value)
  if (!normalizedInput) return ""

  const normalizedValue = normalizedInput.match(/^https?:\/\//i)
    ? normalizedInput
    : `https://${normalizedInput}`

  try {
    return new URL(normalizedValue).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return normalizedInput.replace(/^www\./, "").toLowerCase()
  }
}

function getSocialLinkHref(value: string) {
  const normalizedInput = normalizeSocialLink(value)
  if (!normalizedInput) return undefined
  return normalizedInput.startsWith("http")
    ? normalizedInput
    : `https://${normalizedInput}`
}

type CropPosition = {
  x: number
  y: number
}

const PROFILE_IMAGE_PREVIEW_SIZE = 320
const PROFILE_IMAGE_EXPORT_SIZE = 1024

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampCropPosition(
  position: CropPosition,
  imageSize: { width: number; height: number } | null,
  zoom: number
) {
  if (!imageSize) {
    return position
  }

  const fitScale = Math.max(
    PROFILE_IMAGE_PREVIEW_SIZE / imageSize.width,
    PROFILE_IMAGE_PREVIEW_SIZE / imageSize.height
  )
  const renderedWidth = imageSize.width * fitScale * zoom
  const renderedHeight = imageSize.height * fitScale * zoom
  const maxX = Math.max(0, (renderedWidth - PROFILE_IMAGE_PREVIEW_SIZE) / 2)
  const maxY = Math.max(0, (renderedHeight - PROFILE_IMAGE_PREVIEW_SIZE) / 2)

  return {
    x: clamp(position.x, -maxX, maxX),
    y: clamp(position.y, -maxY, maxY),
  }
}

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Unable to load image"))
    }

    image.src = objectUrl
  })
}

async function createCroppedProfileImage(
  file: File,
  position: CropPosition,
  zoom: number
) {
  const image = await loadImage(file)
  const fitScale = Math.max(
    PROFILE_IMAGE_PREVIEW_SIZE / image.width,
    PROFILE_IMAGE_PREVIEW_SIZE / image.height
  )
  const scaleRatio = PROFILE_IMAGE_EXPORT_SIZE / PROFILE_IMAGE_PREVIEW_SIZE
  const canvas = document.createElement("canvas")
  canvas.width = PROFILE_IMAGE_EXPORT_SIZE
  canvas.height = PROFILE_IMAGE_EXPORT_SIZE

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Canvas is not supported in this browser")
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.translate(
    PROFILE_IMAGE_EXPORT_SIZE / 2 + position.x * scaleRatio,
    PROFILE_IMAGE_EXPORT_SIZE / 2 + position.y * scaleRatio
  )
  context.scale(fitScale * zoom * scaleRatio, fitScale * zoom * scaleRatio)
  context.drawImage(image, -image.width / 2, -image.height / 2)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Failed to crop profile image"))
        return
      }

      resolve(result)
    }, "image/jpeg", 0.92)
  })

  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-image"
  return new File([blob], `${baseName}-cropped.jpg`, {
    type: "image/jpeg",
  })
}

function ProfileImageCropDialog({
  file,
  open,
  onCancel,
  onConfirm,
}: {
  file: File | null
  open: boolean
  onCancel: () => void
  onConfirm: (croppedFile: File) => Promise<boolean> | boolean
}) {
  const previewImageRef = useRef<HTMLImageElement | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origin: CropPosition
  } | null>(null)
  const [imageSource, setImageSource] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !file) {
      setImageSource(null)
      setImageSize(null)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
      dragStateRef.current = null
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setImageSource(objectUrl)
    setImageSize(null)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    dragStateRef.current = null

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file, open])

  useEffect(() => {
    setPosition((current) => clampCropPosition(current, imageSize, zoom))
  }, [imageSize, zoom])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (
        !dragStateRef.current ||
        event.pointerId !== dragStateRef.current.pointerId
      ) {
        return
      }

      const deltaX = event.clientX - dragStateRef.current.startX
      const deltaY = event.clientY - dragStateRef.current.startY
      setPosition(
        clampCropPosition(
          {
            x: dragStateRef.current.origin.x + deltaX,
            y: dragStateRef.current.origin.y + deltaY,
          },
          imageSize,
          zoom
        )
      )
    }

    const finishDrag = (event: PointerEvent) => {
      if (
        !dragStateRef.current ||
        event.pointerId !== dragStateRef.current.pointerId
      ) {
        return
      }

      dragStateRef.current = null
      setIsDragging(false)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", finishDrag)
    window.addEventListener("pointercancel", finishDrag)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", finishDrag)
      window.removeEventListener("pointercancel", finishDrag)
    }
  }, [imageSize, zoom])

  async function handleConfirm() {
    if (!file) {
      return
    }

    const image = previewImageRef.current
    if (!image) {
      toast.error("The image is still loading. Please try again in a moment.")
      return
    }

    setIsSubmitting(true)
    try {
      const croppedFile = await createCroppedProfileImage(file, position, zoom)
      const didUploadSucceed = await onConfirm(croppedFile)
      if (didUploadSucceed) {
        onCancel()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to crop image")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !file) {
    return null
  }

  const fitScale = imageSize
    ? Math.max(
        PROFILE_IMAGE_PREVIEW_SIZE / imageSize.width,
        PROFILE_IMAGE_PREVIEW_SIZE / imageSize.height
      )
    : 1
  const renderedSize = imageSize
    ? {
        width: imageSize.width * fitScale,
        height: imageSize.height * fitScale,
      }
    : null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/15 bg-[linear-gradient(180deg,rgba(10,10,34,0.98),rgba(30,22,61,0.96))] shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[0.68rem] tracking-[0.3em] text-white/45 uppercase">
              Crop profile photo
            </p>
            <p className="mt-2 text-sm text-white/75">
              Drag the image to reposition it, then zoom in or out before uploading.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/80 transition hover:bg-white/14 hover:text-white"
            aria-label="Cancel image crop"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div
                className={`relative overflow-hidden rounded-full border border-white/15 bg-white/8 shadow-[0_18px_45px_rgba(0,0,0,0.34)] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                style={{ width: PROFILE_IMAGE_PREVIEW_SIZE, height: PROFILE_IMAGE_PREVIEW_SIZE }}
                onPointerDown={(event) => {
                  if (!previewImageRef.current) {
                    return
                  }

                  event.preventDefault()
                  dragStateRef.current = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    origin: position,
                  }
                  setIsDragging(true)
                }}
              >
                <div className="pointer-events-none absolute inset-0 z-10 rounded-full ring-1 ring-inset ring-white/14" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(255,255,255,0.1)_100%)]" />
                {imageSource ? (
                  <img
                    ref={previewImageRef}
                    src={imageSource}
                    alt="Crop preview"
                    draggable={false}
                    onLoad={(event) => {
                      const target = event.currentTarget
                      setImageSize({
                        width: target.naturalWidth,
                        height: target.naturalHeight,
                      })
                    }}
                    className="absolute left-1/2 top-1/2 select-none"
                    style={{
                      width: renderedSize?.width ?? "auto",
                      height: renderedSize?.height ?? "auto",
                      transformOrigin: "center center",
                      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                    }}
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-white/15" />
                <div className="pointer-events-none absolute inset-y-8 left-1/2 w-px bg-white/15" />
              </div>
            </div>

            <p className="text-center text-xs tracking-[0.18em] text-white/52 uppercase">
              Move the photo within the circle to frame it the way you want.
            </p>
          </div>

          <div className="space-y-4 rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2 text-[0.68rem] tracking-[0.24em] text-white/48 uppercase">
                <Move className="size-3.5" />
                Position
              </div>
              <div className="mt-3 text-sm text-white/72">
                Drag the preview to center your face or subject.
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-[0.68rem] tracking-[0.24em] text-white/48 uppercase">
                <ZoomIn className="size-3.5" />
                Zoom
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mt-3 w-full accent-fuchsia-300"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-white/45">
                <span>1x</span>
                <span>3x</span>
              </div>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/88 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-300/30 bg-[linear-gradient(135deg,rgba(248,113,113,0.95),rgba(168,85,247,0.9))] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_36px_rgba(168,85,247,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Use photo
                  </>
                )}
              </button>
            </div>

            <p className="text-xs leading-5 text-white/48">
              The cropped image will be resized locally before it is uploaded to your profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileOverviewCard({
  displayName,
  subtitle,
  email,
  resumeLink,
  shortBio,
  socialLinks,
  qrValue,
  qrRef,
  profileImageUrl,
  userId,
  showResumeBanner,
}: {
  displayName: string
  subtitle: string
  email: string
  resumeLink?: string
  shortBio?: string
  socialLinks: SocialLink[]
  qrValue: string
  qrRef: React.RefObject<ReactQRCodeRef | null>
  profileImageUrl?: string
  userId?: number
  showResumeBanner: boolean
}) {
  const [qrOpen, setQrOpen] = useState(false)
  const description =
    shortBio?.trim() ||
    "No bio added yet. Use the account page to complete your profile details."

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[linear-gradient(180deg,rgba(13,14,42,0.95),rgba(62,44,122,0.56))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.14),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.08),transparent_14%),linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.05)_50%,transparent_80%)]" />

      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div className="relative shrink-0 self-start">
            <div className="absolute inset-0 -m-5 rounded-full border border-dashed border-fuchsia-300/50" />
            <div className="absolute top-0 -right-1 h-4 w-4 rounded-full bg-fuchsia-400 shadow-[0_0_18px_rgba(255,109,183,0.8)]" />
            <div className="absolute bottom-2 -left-3 h-4 w-4 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(96,165,250,0.8)]" />
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur sm:h-32 sm:w-32">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-[#120d2d] shadow-inner shadow-black/10">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={`${displayName} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="size-12 sm:size-14" strokeWidth={1.8} />
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-3xl font-semibold tracking-[0.16em] text-white sm:text-[2.35rem]">
              {displayName}
            </p>
            <p className="mt-3 text-lg font-light tracking-[0.12em] text-white/84 sm:text-xl">
              {subtitle}
            </p>
            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[0.68rem] tracking-[0.22em] text-white/88 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Sparkles className="size-3.5 text-fuchsia-200" />
              <span className="truncate">User-{userId}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-start">
            <div
              role={qrValue ? "button" : undefined}
              tabIndex={qrValue ? 0 : -1}
              onClick={() => {
                if (qrValue) setQrOpen(true)
              }}
              onKeyDown={(e) => {
                if (qrValue && (e.key === "Enter" || e.key === " "))
                  setQrOpen(true)
              }}
              className={`rounded-xl border border-white/10 bg-white p-2 shadow-[0_16px_36px_rgba(0,0,0,0.22)] ${qrValue ? "cursor-pointer" : "cursor-default"}`}
            >
              {qrValue ? (
                <ReactQRCode
                  size={148}
                  marginSize={2}
                  background={"white"}
                  gradient={{
                    type: "linear",
                    stops: [
                      { color: "#5c41c7", offset: "0" },
                      { color: "#702056", offset: "100%" },
                    ],
                    rotation: 60,
                  }}
                  dataModulesSettings={{ style: "star" }}
                  finderPatternOuterSettings={{ style: "inpoint-sm" }}
                  finderPatternInnerSettings={{ style: "rounded" }}
                  imageSettings={{
                    src: "/images/ProspaceMinimalLogo-2.png",
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                  value={qrValue}
                  ref={qrRef}
                />
              ) : (
                <div className="flex h-fit max-w-3xs items-center justify-center p-4 text-center text-xs leading-5 text-[#241c48]">
                  There was an error loading your data. Please proceed to the
                  helpdesk or email us at prospace@cicssg.com.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-white/20" />

        <p className="mt-5 max-w-4xl text-sm leading-6 text-white/76 sm:text-base">
          {description}
        </p>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-[0.68rem] tracking-[0.32em] text-white/45 uppercase">
              Email
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-3 block text-base tracking-[0.18em] break-all text-white/90 underline-offset-4 hover:underline"
            >
              {email}
            </a>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="text-[0.62rem] tracking-[0.3em] text-white/45 uppercase">
                  Resume
                </p>
                {showResumeBanner ? (
                  <p className="mt-2 text-sm text-white">
                    Please update your resume in the account section.
                  </p>
                ) : resumeLink ? (
                  <a
                    href={resumeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-sm tracking-[0.14em] text-white/88 underline-offset-4 hover:underline"
                  >
                    View resume
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-white/60">Not added yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-[0.68rem] tracking-[0.32em] text-white/45 uppercase">
              Social Links
            </p>
            <div className="mt-4 space-y-3">
              {socialLinks.length ? (
                socialLinks.map((item) => {
                  return (
                    <div
                      key={item.value}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[0.62rem] tracking-[0.28em] text-white/45 uppercase">
                          {getSocialLinkLabel(item.value)}
                        </p>
                        {getSocialLinkHref(item.value) ? (
                          <a
                            href={getSocialLinkHref(item.value)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block max-w-[18rem] truncate text-sm tracking-[0.12em] text-white/88 underline-offset-4 hover:underline sm:max-w-88"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="mt-1 max-w-[18rem] truncate text-sm tracking-[0.12em] text-white/88 sm:max-w-88">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-white/60">
                  No social links added yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="relative rounded-lg bg-transparent p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-xl bg-white">
              {qrValue ? (
                <ReactQRCode
                  size={360}
                  marginSize={2}
                  background={"white"}
                  gradient={{
                    type: "linear",
                    stops: [
                      { color: "#5c41c7", offset: "0" },
                      { color: "#702056", offset: "100%" },
                    ],
                    rotation: 60,
                  }}
                  dataModulesSettings={{ style: "star" }}
                  finderPatternOuterSettings={{ style: "inpoint-sm" }}
                  finderPatternInnerSettings={{ style: "rounded" }}
                  imageSettings={{
                    src: "/images/ProspaceMinimalLogo-2.png",
                    height: 48,
                    width: 48,
                    excavate: true,
                  }}
                  value={qrValue}
                />
              ) : (
                <div className="flex max-w-sm items-center justify-center p-8 text-center text-sm leading-6 text-[#241c48]">
                  There was an error loading your data. Please proceed to the
                  helpdesk or email us at prospace@cicssg.com.
                </div>
              )}
            </div>
            <button
              onClick={() => setQrOpen(false)}
              aria-label="Close QR"
              className="z-10 mt-4 inline-flex w-full items-center justify-center rounded bg-white/10 py-3 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AccountPanel({
  user,
  mongoUser,
  setMongoUser,
  showResumeBanner,
  profileImageUrl,
}: {
  user?: EditableUser | null
  mongoUser?: MongoUserRecord | null
  setMongoUser?: (m: MongoUserRecord | null) => void
  showResumeBanner: boolean
  profileImageUrl?: string
}) {
  const [first, setFirst] = useState(user?.firstName ?? "")
  const [last, setLast] = useState(user?.lastName ?? "")
  const [shortBio, setShortBio] = useState(mongoUser?.shortBio ?? "")
  const [course, setCourse] = useState(mongoUser?.course ?? "")
  const [resumeLink, setResumeLink] = useState<string | undefined>(
    mongoUser?.portfolioLink ?? undefined
  )
  const [resumeFileName, setResumeFileName] = useState<string | undefined>(
    undefined
  )
  const [resumeDataUrl, setResumeDataUrl] = useState<string | undefined>(
    undefined
  )
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false)
  const [profileImageFileName, setProfileImageFileName] = useState<string | undefined>(undefined)
  const [profileImageCropFile, setProfileImageCropFile] = useState<File | null>(null)
  const [showResumeInConnect, setShowResumeInConnect] = useState(
    mongoUser?.showResumeInConnect ?? true
  )
  const portfolioInputRef = useRef<HTMLInputElement | null>(null)
  const profileImageInputRef = useRef<HTMLInputElement | null>(null)
  const [socialLinks, setSocialLinks] = useState<string[]>(
    () => mongoUser?.socialLinks ?? []
  )

  const [saving, setSaving] = useState(false)

  async function onSelectResume(file?: File) {
    if (!file) return
    // Check file size (max 4.5MB)
    const maxSizeInBytes = 4.5 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      // mimic signup behavior: clear input and show error via basic alert
      if (portfolioInputRef.current) portfolioInputRef.current.value = ""
      alert(
        `File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 4.5MB`
      )
      return
    }

    setResumeFileName(file.name)
    setResumeDataUrl(undefined)
    setIsUploadingResume(true)
    // upload to Vercel blob using the same helper as registration
    try {
      const sanitizedFirstName = first.trim().replace(/\s+/g, "-")
      const sanitizedLastName = last.trim().replace(/\s+/g, "-")
      const uploaderName = [sanitizedFirstName, sanitizedLastName]
        .filter(Boolean)
        .join("-")
      const key = `resume/${uploaderName || user?.id || String(Date.now())}-Resume`
      const blob = await UploadImageToBlobStorage(file, key)
      const fileUrl = blob.url
      console.log("File uploaded successfully. URL:", fileUrl)
      setResumeLink(fileUrl)
      setResumeDataUrl(undefined)
    } catch (err) {
      console.error("Error uploading file:", err)
      if (portfolioInputRef.current) portfolioInputRef.current.value = ""
      setResumeFileName(undefined)
      setResumeLink(undefined)
      alert(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploadingResume(false)
    }
  }

  async function uploadProfileImage(file: File) {
    setIsUploadingProfileImage(true)
    setProfileImageFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/updateUserProfileImage", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      const data = responseText ? JSON.parse(responseText) : null

      if (!response.ok) {
        throw new Error(
          data?.message || `Failed to update profile image (${response.status})`
        )
      }

      toast.success("Profile picture updated successfully")
      setProfileImageFileName(undefined)
      if (profileImageInputRef.current) profileImageInputRef.current.value = ""
      window.location.reload()
      return true
    } catch (error) {
      console.error("Error uploading profile image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile image")
      return false
    } finally {
      setIsUploadingProfileImage(false)
    }
  }

  async function onSelectProfileImage(file?: File) {
    if (!file) return

    const maxSizeInBytes = 5 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      if (profileImageInputRef.current) profileImageInputRef.current.value = ""
      alert(`File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 5MB`)
      return
    }

    setProfileImageFileName(file.name)
    setProfileImageCropFile(file)
    if (profileImageInputRef.current) profileImageInputRef.current.value = ""
  }

  function addSocialLink() {
    setSocialLinks((s) => [...s, ""])
  }

  function updateSocialLink(index: number, val: string) {
    setSocialLinks((s) =>
      s.map((item, i) => (i === index ? normalizeSocialLink(val) : item))
    )
  }

  function removeSocialLink(index: number) {
    setSocialLinks((s) => s.filter((_, i) => i !== index))
  }

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      // client-side clerk update for name if available
      if (typeof user.update === "function") {
        await user.update({ firstName: first, lastName: last })
      }

      // prepare payload for server update
      console.log(resumeLink, resumeDataUrl)
      const payload: Record<string, unknown> = {
        clerkId: user.id,
        update: {
          firstName: first,
          lastName: last,
          shortBio: shortBio || undefined,
          course: course || undefined,
          portfolioLink: resumeDataUrl ?? resumeLink ?? undefined,
          showResumeInConnect,
          socialLinks: socialLinks.map(normalizeSocialLink).filter(Boolean),
          resumeUpdate: resumeLink
            ? true
            : mongoUser?.resumeUpdate === true
              ? true
              : undefined, // if a resume link exists, set resumeUpdate to true. If not, keep existing value or undefined
        },
      }

      const res = await fetch("/api/updateUser", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responseText = await res.text()
      const data = responseText ? JSON.parse(responseText) : null

      if (!res.ok) {
        toast.error(data?.message || `Failed to update profile (${res.status})`)
        throw new Error(
          data?.message || `Failed to update user (${res.status})`
        )
      }

      if (data?.success) {
        toast.success("Profile updated successfully!")
        const updatedProfile = {
          ...(mongoUser ?? {}),
          firstName: first,
          lastName: last,
          shortBio: shortBio || undefined,
          course: course || undefined,
          portfolioLink: resumeLink ?? undefined,
          showResumeInConnect,
          socialLinks: socialLinks.map(normalizeSocialLink).filter(Boolean),
          updatedAt: new Date().toISOString(),
        } as MongoUserRecord

        setMongoUser?.(
          ((data?.data as MongoUserRecord | null) ??
            updatedProfile) as MongoUserRecord
        )
      } else {
        toast.error(data?.message || "Failed to update profile")
        console.error("Failed to update user", data)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
        <p className="text-[0.68rem] tracking-[0.32em] text-white/45 uppercase">
          Profile Picture
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[#120d2d] shadow-[0_16px_32px_rgba(0,0,0,0.22)]">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Current profile picture"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="size-10" strokeWidth={1.8} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <label className="inline-flex cursor-pointer rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-white transition hover:bg-white/10">
              {isUploadingProfileImage ? "Updating..." : "Upload new picture"}
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => onSelectProfileImage(e.target.files?.[0])}
                disabled={isUploadingProfileImage}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-sm text-white/60">
              PNG, JPG, or WEBP up to 5MB.
            </p>
            {profileImageFileName ? (
              <p className="mt-2 text-sm text-white/80">{profileImageFileName}</p>
            ) : null}
          </div>
        </div>
        <ProfileImageCropDialog
          file={profileImageCropFile}
          open={Boolean(profileImageCropFile)}
          onCancel={() => {
            setProfileImageCropFile(null)
            setProfileImageFileName(undefined)
          }}
          onConfirm={uploadProfileImage}
        />
      </div>

      <div>
        <label className="block text-sm text-white/80">First name</label>
        <input
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          className="mt-2 w-full rounded-md bg-white/6 px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-white/80">Last name</label>
        <input
          value={last}
          onChange={(e) => setLast(e.target.value)}
          className="mt-2 w-full rounded-md bg-white/6 px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-white/80">Short bio</label>
        <textarea
          value={shortBio}
          onChange={(e) => setShortBio(e.target.value)}
          className="mt-2 w-full rounded-md bg-white/6 px-3 py-2 text-white"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm text-white/80">Course</label>
        <input
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="mt-2 w-full rounded-md bg-white/6 px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-white/80">
          Resume (4.5mb max)
        </label>
        <div className="mt-2 flex items-center gap-3">
          <label className="cursor-pointer rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm">
            {isUploadingResume ? "Uploading..." : "Upload file"}
            <input
              ref={portfolioInputRef}
              type="file"
              accept="application/pdf,.pdf,.doc,.docx"
              onChange={(e) => onSelectResume(e.target.files?.[0])}
              disabled={isUploadingResume}
              className="hidden"
            />
          </label>
          {showResumeBanner ? (
            <div className="text-sm text-white/80">Please update your resume.</div>
          ) : resumeFileName ? (
            <div className="text-sm text-white/80">{resumeFileName}</div>
          ) : resumeLink ? (
            <a
              href={resumeLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white/88 underline"
            >
              View current resume
            </a>
          ) : (
            <div className="text-sm text-white/60">No resume uploaded</div>
          )}
        </div>
        <label className="mt-4 flex items-start gap-3 rounded-md border border-white/10 bg-white/6 px-3 py-3 text-sm text-white/86">
          <input
            type="checkbox"
            checked={showResumeInConnect}
            onChange={(e) => setShowResumeInConnect(e.target.checked)}
            className="mt-1 size-4 rounded border-white/30 bg-transparent"
          />
          <span>
            Allow other users to see my resume on the Connect page.
            <span className="mt-1 block text-xs leading-5 text-white/55">
              Company resume views are unaffected.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm text-white/80">Social links</label>
        <div className="mt-2 space-y-2">
          {socialLinks.map((s, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={s}
                onChange={(e) => updateSocialLink(idx, e.target.value)}
                className="flex-1 rounded-md bg-white/6 px-2 py-2 text-white"
                placeholder="https://www.linkedin.com/in/your-profile"
              />
              <button
                onClick={() => removeSocialLink(idx)}
                className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm"
              >
                Remove
              </button>
            </div>
          ))}

          <div>
            <button
              onClick={addSocialLink}
              className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm"
            >
              Add link
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={save}
          disabled={saving || isUploadingResume}
          className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm"
        >
          {saving
            ? "Saving..."
            : isUploadingResume
              ? "Wait for upload..."
              : "Save"}
        </button>
      </div>
    </div>
  )
}

// Security handled by Clerk (OTP). Security UI removed.

type ProfileTab = {
  label: string
  value: string
  hash: string
}

const profileTabs: ProfileTab[] = [
  {
    label: "Profile",
    value: "profile",
    hash: "#/profile",
  },
  {
    label: "Account",
    value: "account",
    hash: "#/account",
  },
  // Security tab removed; Clerk handles login via OTP
]

const normalizeHash = (hash: string) =>
  hash.replace(/^#\/?/, "").replace(/^\//, "")

export default function Profile() {
  const { user } = useUser()
  const userId = user?.id
  const [mongoUser, setMongoUser] = useState<MongoUserRecord | null>(null)
  const [mongoLoading, setMongoLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(
    () =>
      normalizeHash(
        typeof window !== "undefined" ? window.location.hash : ""
      ) || "profile"
  )
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadUserProfile = async () => {
      if (!user?.id) {
        if (isMounted) setShowResumeBanner(false)
        return
      }

      try {
        const response = await fetch(
          `/api/getUserInCollection?user_id=${encodeURIComponent(user.id)}`
        )
        const payload = await response.json()
        const mongoUser = (
          payload?.success ? payload.data : null
        ) as MongoUserProfile | null

        if (!isMounted) return

        const hasPortfolioLink = Boolean(
          mongoUser?.portfolioLink && String(mongoUser.portfolioLink).trim()
        )
        const shouldPromptResumeUpdate = mongoUser?.resumeUpdate !== true

        const shouldShow = hasPortfolioLink && shouldPromptResumeUpdate
        setShowResumeBanner(shouldShow)
      } catch (error) {
        console.error("Failed to load user profile for resume reminder:", error)
        if (isMounted) setShowResumeBanner(false)
      }
    }

    loadUserProfile()

    return () => {
      isMounted = false
    }
  }, [user?.id, mongoUser])

  useEffect(() => {
    const onHash = () =>
      setActiveTab(normalizeHash(window.location.hash) || profileTabs[0].value)
    onHash()
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    const clerkUserId = userId ? String(userId) : ""
    if (!clerkUserId) return

    const controller = new AbortController()

    async function loadMongoUser() {
      setMongoLoading(true)
      try {
        const response = await fetch(
          `/api/getUserInCollection?user_id=${encodeURIComponent(clerkUserId)}`,
          { signal: controller.signal }
        )
        const data = await response.json()
        setMongoUser((data?.data ?? null) as MongoUserRecord | null)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load user profile data", error)
        }
      } finally {
        setMongoLoading(false)
      }
    }

    loadMongoUser()

    return () => controller.abort()
  }, [userId])

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash !== `#/${activeTab}`
    ) {
      window.location.hash = `#/${activeTab}`
    }
  }, [activeTab])

  const qrRef = useRef<ReactQRCodeRef | null>(null)
  const link =
    mongoUser?.userId != null
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=${mongoUser.userId}&type=user`
      : ""

  const email =
    mongoUser?.email ??
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "No email on file"

  const profileMetadata = (user?.publicMetadata ?? {}) as Record<
    string,
    unknown
  >
  const profileImageUrl = user?.imageUrl as string | undefined

  const displayName =
    [
      mongoUser?.firstName ?? user?.firstName,
      mongoUser?.lastName ?? user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    mongoUser?.email ||
    "Prospace user"

  const subtitle =
    mongoUser?.course ??
    (profileMetadata.subtitle as string | undefined) ??
    "Manage your profile"

  const badgeText =
    mongoUser?.userId != null
      ? `User ID ${mongoUser.userId}`
      : ((profileMetadata.role as string | undefined) ?? "Member")

  const socialLinks: SocialLink[] = (() => {
    const links: SocialLink[] = []

    for (const link of mongoUser?.socialLinks ?? []) {
      if (!isResumeLink(link)) {
        links.push({ value: link })
      }
    }

    return links
  })()

  const resumeLink =
    mongoUser?.portfolioLink ||
    (mongoUser?.socialLinks ?? []).find((link) => isResumeLink(link))

  const currentTab =
    profileTabs.find((tab) => tab.value === activeTab) ?? profileTabs[0]

  return (
    <div className="relative z-10 mt-30 min-h-screen w-full overflow-hidden px-3 py-3 text-white sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="relative mx-auto w-full max-w-350">
        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-5">
          <aside className="flex h-fit flex-col rounded-[18px] border border-white/20 bg-[linear-gradient(180deg,rgba(10,12,34,0.94),rgba(20,19,48,0.86))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div>
              <div className="pb-2 text-[0.68rem] tracking-[0.32em] text-white/70 uppercase">
                Account
              </div>
              <div className="h-px w-full bg-white/30" />
            </div>

            <nav className="mt-3 space-y-2 text-[1.02rem] tracking-[0.16em]">
              {profileTabs.map((tab) => {
                const active = currentTab.value === tab.value
                return (
                  <a
                    key={tab.value}
                    href={tab.hash}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "block rounded-md py-1 transition-colors",
                      active
                        ? "font-semibold text-white"
                        : "text-white/86 hover:text-white"
                    )}
                  >
                    {tab.label}
                  </a>
                )
              })}
            </nav>
          </aside>

          <section className="relative overflow-hidden rounded-[18px] border border-white/20 bg-[linear-gradient(180deg,rgba(10,10,34,0.95),rgba(113,81,176,0.65))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(255,255,255,0.12),transparent_14%),radial-gradient(circle_at_12%_92%,rgba(190,122,255,0.18),transparent_18%)]" />
            <div className="relative">
              {currentTab.value === "profile" && (
                <ProfileOverviewCard
                  displayName={displayName}
                  subtitle={subtitle}
                  email={email}
                  resumeLink={resumeLink}
                  shortBio={mongoUser?.shortBio}
                  socialLinks={socialLinks}
                  qrValue={link}
                  qrRef={qrRef}
                  profileImageUrl={profileImageUrl}
                  userId={mongoUser?.userId}
                  showResumeBanner={showResumeBanner}
                />
              )}

              {currentTab.value === "account" && (
                <div className="rounded-[18px] border border-white/15 bg-[linear-gradient(180deg,rgba(13,14,42,0.95),rgba(62,44,122,0.56))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-7">
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
                    <p className="text-[0.68rem] tracking-[0.32em] text-white/45 uppercase">
                      Account Details
                    </p>
                    <div className="mt-4">
                      <AccountPanel
                        key={`account-${mongoUser?._id ?? user?.id ?? "default"}-${mongoUser?.updatedAt ?? "initial"}`}
                        user={user}
                        mongoUser={mongoUser}
                        setMongoUser={setMongoUser}
                        showResumeBanner={showResumeBanner}
                        profileImageUrl={profileImageUrl}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security tab removed; Clerk handles authentication */}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
