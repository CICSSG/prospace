"use client"

import { useUser } from "@clerk/nextjs"
import { ReactQRCode, ReactQRCodeRef } from "@lglab/react-qr-code"
import {
  Sparkles,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { UploadImageToBlobStorage } from "@/app/(management)/admin/actions"

import { cn } from "@/lib/utils"

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
  if (host.includes("facebook.com") || host.includes("fb.com")) return "Facebook"
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube"
  if (host.includes("tiktok.com")) return "TikTok"
  if (host.includes("discord.com") || host.includes("discord.gg")) return "Discord"
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
  return normalizedInput.startsWith("http") ? normalizedInput : `https://${normalizedInput}`
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
            <div className="absolute -right-1 top-0 h-4 w-4 rounded-full bg-fuchsia-400 shadow-[0_0_18px_rgba(255,109,183,0.8)]" />
            <div className="absolute -left-3 bottom-2 h-4 w-4 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(96,165,250,0.8)]" />
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur sm:h-32 sm:w-32">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#120d2d] shadow-inner shadow-black/10 overflow-hidden">
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
            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Sparkles className="size-3.5 text-fuchsia-200" />
              <span className="truncate">User</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 self-start">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setQrOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setQrOpen(true)
              }}
              className="rounded-xl border border-white/10 bg-white p-2 shadow-[0_16px_36px_rgba(0,0,0,0.22)] cursor-pointer"
            >
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
            </div>
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-white/20" />

        <p className="mt-5 max-w-4xl text-sm leading-6 text-white/76 sm:text-base">
          {description}
        </p>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/45">
              Email
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-3 block break-all text-base tracking-[0.18em] text-white/90 underline-offset-4 hover:underline"
            >
              {email}
            </a>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/45">
                  Resume
                </p>
                {resumeLink ? (
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
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/45">
              Social Links
            </p>
            <div className="mt-4 space-y-3">
              {socialLinks.length ? (
                socialLinks.map((item) => {
                  return (
                    <div key={item.value} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/45">
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
                <p className="text-sm text-white/60">No social links added yet</p>
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
            
            <div className="rounded-xl overflow-hidden bg-white">
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
            </div>
            <button
              onClick={() => setQrOpen(false)}
              aria-label="Close QR"
              className="z-10 inline-flex py-3 mt-4 w-full items-center justify-center rounded bg-white/10 text-white"
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
}: {
  user?: EditableUser | null
  mongoUser?: MongoUserRecord | null
  setMongoUser?: (m: MongoUserRecord | null) => void
}) {
  const [first, setFirst] = useState(user?.firstName ?? "")
  const [last, setLast] = useState(user?.lastName ?? "")
  const [shortBio, setShortBio] = useState(mongoUser?.shortBio ?? "")
  const [course, setCourse] = useState(mongoUser?.course ?? "")
  const [resumeLink, setResumeLink] = useState<string | undefined>(mongoUser?.portfolioLink ?? undefined)
  const [resumeFileName, setResumeFileName] = useState<string | undefined>(undefined)
  const [resumeDataUrl, setResumeDataUrl] = useState<string | undefined>(undefined)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const portfolioInputRef = useRef<HTMLInputElement | null>(null)
  const [socialLinks, setSocialLinks] = useState<string[]>(() => mongoUser?.socialLinks ?? [])

  const [saving, setSaving] = useState(false)

  async function onSelectResume(file?: File) {
    if (!file) return
    // Check file size (max 4.5MB)
    const maxSizeInBytes = 4.5 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      // mimic signup behavior: clear input and show error via basic alert
      if (portfolioInputRef.current) portfolioInputRef.current.value = ""
      alert(`File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 4.5MB`)
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

  function addSocialLink() {
    setSocialLinks((s) => [...s, ""])
  }

  function updateSocialLink(index: number, val: string) {
    setSocialLinks((s) => s.map((item, i) => (i === index ? normalizeSocialLink(val) : item)))
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
      const payload: Record<string, unknown> = {
        clerkId: user.id,
        update: {
          firstName: first,
          lastName: last,
          shortBio: shortBio || undefined,
          course: course || undefined,
          portfolioLink: resumeDataUrl ?? resumeLink ?? undefined,
          socialLinks: socialLinks.map(normalizeSocialLink).filter(Boolean),
          resumeUpdate: resumeLink ? true : mongoUser?.resumeUpdate === true ? true : undefined, // if a resume link exists, set resumeUpdate to true. If not, keep existing value or undefined
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
        throw new Error(data?.message || `Failed to update user (${res.status})`)
      }

      if (data?.success) {
        const updatedProfile = {
          ...(mongoUser ?? {}),
          firstName: first,
          lastName: last,
          shortBio: shortBio || undefined,
          course: course || undefined,
          portfolioLink: resumeLink ?? undefined,
          socialLinks: socialLinks.map(normalizeSocialLink).filter(Boolean),
          updatedAt: new Date().toISOString(),
        } as MongoUserRecord

        setMongoUser?.(
          ((data?.data as MongoUserRecord | null) ?? updatedProfile) as MongoUserRecord
        )
      } else {
        console.error("Failed to update user", data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
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
        <label className="block text-sm text-white/80">Resume (4.5mb max)</label>
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
          {resumeFileName ? (
            <div className="text-sm text-white/80">{resumeFileName}</div>
          ) : resumeLink ? (
            <a href={resumeLink} target="_blank" rel="noreferrer" className="text-sm underline text-white/88">
              View current resume
            </a>
          ) : (
            <div className="text-sm text-white/60">No resume uploaded</div>
          )}
        </div>
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
            <button onClick={addSocialLink} className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm">
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
          {saving ? "Saving..." : isUploadingResume ? "Wait for upload..." : "Save"}
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
  const link = useMemo(
    () => `https://prospace.app/u/${user?.id ?? ""}`,
    [user?.id]
  )

  const email =
    mongoUser?.email ??
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "No email on file"

  const profileMetadata = (user?.publicMetadata ?? {}) as Record<string, unknown>
  const profileImageUrl = user?.imageUrl as string | undefined

  const displayName =
    [mongoUser?.firstName ?? user?.firstName, mongoUser?.lastName ?? user?.lastName]
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
      : (profileMetadata.role as string | undefined) ?? "Member"

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
    <div className="mt-30 relative z-10 min-h-screen w-full overflow-hidden px-3 py-3 text-white sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="relative mx-auto w-full max-w-350">
        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-5">
          <aside className="flex h-fit flex-col rounded-[18px] border border-white/20 bg-[linear-gradient(180deg,rgba(10,12,34,0.94),rgba(20,19,48,0.86))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div>
              <div className="pb-2 text-[0.68rem] uppercase tracking-[0.32em] text-white/70">
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
                      active ? "font-semibold text-white" : "text-white/86 hover:text-white"
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
                />
              )}

              {currentTab.value === "account" && (
                <div className="rounded-[18px] border border-white/15 bg-[linear-gradient(180deg,rgba(13,14,42,0.95),rgba(62,44,122,0.56))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-7">
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/45">
                      Account Details
                    </p>
                    <div className="mt-4">
                      <AccountPanel key={`account-${mongoUser?._id ?? user?.id ?? "default"}-${mongoUser?.updatedAt ?? "initial"}`} user={user} mongoUser={mongoUser} setMongoUser={setMongoUser} />
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
