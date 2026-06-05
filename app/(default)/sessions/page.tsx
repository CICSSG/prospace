"use client"

import { motion } from "framer-motion"
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import { Clock, ExternalLink, UserRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { getCollectionData } from "@/app/(management)/admin/actions"

type SessionRecord = {
  _id: string
  topicPictureUrl?: string
  logoUrl?: string
  sessionTitle?: string
  startTime?: string
  endTime?: string
  sessionDate?: string
  company?: string
  sessionSet?: string
  sessionLinks?: unknown[]
}

type CompanyRecord = {
  _id: string
  name?: string
}

type NormalizedLink = {
  id: string
  label: string
  href: string
}

const formatTime = (time?: string) => {
  if (!time) return "TBA"

  const [hoursText, minutesText] = time.split(":")
  const hours = Number(hoursText)
  const minutes = Number(minutesText || "0")

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time

  const suffix = hours >= 12 ? "PM" : "AM"
  const normalizedHours = hours % 12 || 12
  return `${normalizedHours}:${minutes.toString().padStart(2, "0")} ${suffix}`
}

const formatSetLabel = (sessionSet?: string) => {
  if (!sessionSet) return "SET"
  return sessionSet.replace(/^set/i, "Set ").replace(/\s+/g, " ").trim()
}

const formatSessionTitle = (title?: string) => {
  if (!title) return "Session details coming soon"
  return title.replace(/^Session\s*\d+\s*-\s*/i, "")
}

const formatCompanyLabel = (
  session: SessionRecord,
  companies: Map<string, string>
) => {
  if (session.company) {
    return companies.get(session.company) || session.company
  }

  return "ProSpace"
}

const normalizeSessionLinks = (links: unknown[]): NormalizedLink[] => {
  return links
    .map((link, index) => {
      if (typeof link === "string") {
        return {
          id: `link-${index}`,
          label: link,
          href: link,
        }
      }

      if (link && typeof link === "object") {
        const record = link as Record<string, unknown>
        const href =
          typeof record.url === "string"
            ? record.url
            : typeof record.href === "string"
              ? record.href
              : ""
        const label =
          typeof record.label === "string"
            ? record.label
            : typeof record.title === "string"
              ? record.title
              : href

        if (href) {
          return { id: `link-${index}`, label, href }
        }
      }

      return null
    })
    .filter((link): link is NormalizedLink => Boolean(link))
}

const getDefaultSessionLinks = (sessionSet?: string): NormalizedLink[] => {
  const normalized = sessionSet?.toLowerCase().trim()

  if (normalized === "set2") {
    return [
      {
        id: "set2-link-1",
        label: "cicssg.com/ProSpaceSessionSet2",
        href: "https://cicssg.com/ProSpaceSessionSet2",
      },
      {
        id: "set2-link-2",
        label: "facebook.com/SIKAPTala",
        href: "https://www.facebook.com/SIKAPTala",
      },
    ]
  }

  return [
    {
      id: "set1-link-1",
      label: "cicssg.com/ProSpaceSessionSet1",
      href: "https://cicssg.com/ProSpaceSessionSet1",
    },
    {
      id: "set1-link-2",
      label: "facebook.com/DLSUD.CICSSG",
      href: "https://www.facebook.com/DLSUD.CICSSG",
    },
  ]
}

export default function Sessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [companies, setCompanies] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSessions = async () => {
      setIsLoading(true)

      try {
        const [sessionsResponse, companiesResponse] = await Promise.all([
          getCollectionData("sessions"),
          getCollectionData("companies"),
        ])

        if (!isMounted) return

        if (sessionsResponse.success) {
          setSessions((sessionsResponse.data || []) as SessionRecord[])
        } else {
          setSessions([])
        }

        if (companiesResponse.success) {
          const nextCompanies = new Map<string, string>()
          ;(companiesResponse.data || []).forEach((company: CompanyRecord) => {
            nextCompanies.set(company._id, company.name || "Unnamed")
          })
          setCompanies(nextCompanies)
        }
      } catch (error) {
        console.error("Error loading sessions:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSessions()

    return () => {
      isMounted = false
    }
  }, [])

  const orderedSessions = useMemo(() => {
    const setOrder = (sessionSet?: string) => {
      const normalized = sessionSet?.toLowerCase().trim()
      if (normalized === "set1") return 1
      if (normalized === "set2") return 2
      return 99
    }

    return [...sessions].sort((left, right) => {
      const dateCompare = (left.sessionDate || "").localeCompare(right.sessionDate || "")
      if (dateCompare !== 0) return dateCompare

      const setCompare = setOrder(left.sessionSet) - setOrder(right.sessionSet)
      if (setCompare !== 0) return setCompare

      return (left.startTime || "").localeCompare(right.startTime || "")
    })
  }, [sessions])

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; sessionDate?: string; startTime?: string; endTime?: string; sessions: SessionRecord[] }>()

    const keyFor = (s: SessionRecord) => `${s.sessionDate || ""}|${s.startTime || ""}-${s.endTime || ""}`

    const setOrder = (sessionSet?: string) => {
      const normalized = sessionSet?.toLowerCase().trim()
      if (normalized === "set1") return 1
      if (normalized === "set2") return 2
      return 99
    }

    for (const s of orderedSessions) {
      const key = keyFor(s)
      const entry = map.get(key)
      if (!entry) {
        map.set(key, { key, sessionDate: s.sessionDate, startTime: s.startTime, endTime: s.endTime, sessions: [s] })
      } else {
        entry.sessions.push(s)
      }
    }

    const groupsArray = Array.from(map.values()).map((g) => {
      g.sessions.sort((a, b) => setOrder(a.sessionSet) - setOrder(b.sessionSet) || (a.startTime || "").localeCompare(b.startTime || ""))
      return g
    })

    groupsArray.sort((a, b) => {
      const dateCompare = (a.sessionDate || "").localeCompare(b.sessionDate || "")
      if (dateCompare !== 0) return dateCompare
      return (a.startTime || "").localeCompare(b.startTime || "")
    })

    return groupsArray
  }, [orderedSessions])

  return (
    <div className="mt-30 mb-10 flex w-full flex-col items-center gap-4 px-4 lg:gap-10">
      <div className="absolute h-lvh w-[99vw] animate-pulse select-none animate-duration-4000 animate-ease-in-out animate-infinite">
        <motion.div className="absolute top-65 left-10 z-10 select-none lg:left-20 2xl:top-70 2xl:left-40">
          <Image
            src="/images/HeroStarTopLeft.png"
            alt="Hero Star Top Left"
            width={45}
            height={45}
            className="rotate-15 animate-spin animate-duration-8000 animate-infinite lg:size-20"
          />
        </motion.div>
        <motion.div className="absolute top-35 right-10 select-none lg:right-30 2xl:top-40 2xl:right-40">
          <Image
            src="/images/HeroStarTopRight.png"
            alt="Hero Star Top Right"
            width={40}
            height={40}
            className="rotate-30 animate-spin select-none animate-duration-25000 animate-infinite lg:size-40"
          />
        </motion.div>
      </div>

      <div className="z-10 flex w-full max-w-4xl flex-col items-center gap-8">
        <div className={`text-3xl ${moscaLaroke.className} tracking-wider md:text-4xl lg:text-5xl`}>
          SessIOns
        </div>
        <p className="text-center leading-tight font-thin tracking-[0.2rem] lg:text-start">
          Explore specialized tracks designed to build your technical and professional identity.
        </p>
        <div className="flex w-full flex-row flex-wrap items-center justify-center gap-4 rounded-lg border border-white/40 bg-linear-to-l to-[#7B4DFF]/22 px-4 py-6">
          <div className="relative">
            <h1 className={`text-6xl font-bold md:text-7xl ${moscaLaroke.className}`}>06</h1>
            <h1 className={`absolute top-0 left-0 text-6xl font-bold blur-xs md:text-7xl ${moscaLaroke.className}`}>
              06
            </h1>
          </div>
          <div>
            <p className="font-light">JUNE • SATURDAY</p>
            <p className="font-bold">Online Career Sessions</p>
            <p className="font-light">Microsoft Teams and Facebook Live</p>
          </div>
          <div className="w-full rounded-full border border-white/60 bg-linear-to-b to-[#7B4DFF]/22 px-4 py-1 text-center text-white md:ml-10 md:w-fit">
            Open to All
          </div>
        </div>
      </div>

      <div className="z-10 flex w-full max-w-5xl flex-col items-center gap-8">
        <div className="h-0.5 w-full bg-white/30 xl:w-[calc(100%+4rem)]" />
        <div className="z-10 grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`session-skeleton-${index}`}
                className="overflow-hidden rounded-[14px] border border-white/18 bg-[#1a1730] shadow-[0_20px_45px_rgba(0,0,0,0.32)]"
              >
                <div className="h-34 bg-linear-to-b from-white/28 via-white/16 to-white/8" />
                <div className="border-t border-white/10 bg-[#120f24] px-4 pb-4 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-[#BBA4FF]">
                    <Clock size={18} strokeWidth={1} className="shrink-0" />
                    <div className="h-3 w-36 rounded-full bg-white/15" />
                    <div className="h-px flex-1 bg-[#BBA4FF]/25" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-5 w-24 rounded-full bg-white/12" />
                    <div className="h-3 w-28 rounded-full bg-white/10" />
                  </div>
                  <div className="mt-4 h-23 rounded-md bg-white/0" />
                </div>
              </div>
            ))
          ) : groups.length > 0 ? (
            groups.map((group, groupIndex) => (
              <div key={group.key} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#BBA4FF]">
                  <Clock size={18} strokeWidth={1.75} className="shrink-0" />
                  <span className="text-[13px] font-semibold tracking-[0.08em] text-white/85">
                    {formatTime(group.startTime)} – {formatTime(group.endTime)}
                  </span>
                  <div className="h-px flex-1 bg-[#BBA4FF]/25" />
                </div>

                <div className="flex flex-col gap-4">
                  {group.sessions.map((session, sessionIndex) => {
                    const companyLabel = formatCompanyLabel(session, companies)
                    const setLabel = formatSetLabel(session.sessionSet)
                    const cleanTitle = formatSessionTitle(session.sessionTitle)
                    const sessionLinks = normalizeSessionLinks(
                      Array.isArray(session.sessionLinks) ? session.sessionLinks : []
                    )
                    const linksToShow = sessionLinks.length > 0 ? sessionLinks : getDefaultSessionLinks(session.sessionSet)

                    return (
                      <motion.article
                        key={session._id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: groupIndex * 0.08 + sessionIndex * 0.06 }}
                        className="overflow-hidden rounded-[14px] border border-white/18 bg-[#1a1730] shadow-[0_20px_45px_rgba(0,0,0,0.32)]"
                      >
                        <div className="relative h-34 overflow-hidden bg-linear-to-b from-white/28 via-white/16 to-white/8">
                          {session.topicPictureUrl ? (
                            <Image
                              src={session.topicPictureUrl}
                              alt={session.sessionTitle || "Session topic"}
                              fill
                              className="object-cover blur-[1px]"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-linear-to-b from-white/24 via-white/10 to-transparent" />
                          <div className="mt-3 flex items-center gap-2 absolute bottom-2 left-2">
                            <div className="rounded-full border border-[#BBA4FF]/65 bg-[#3d2e73] px-2.5 py-1 text-[10px] tracking-[0.16em] text-white/85">
                              {setLabel}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/10 bg-[#120f24] px-4 pb-4 pt-4">
                          {/* <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold tracking-[0.32em] text-white/85">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80">
                                <UserRound size={14} strokeWidth={1.6} />
                              </div>
                              <span className="truncate uppercase">NAME</span>
                            </div>
                            <div className="max-w-[55%] truncate text-right text-[11px] tracking-[0.26em] text-[#BBA4FF]">
                              {companyLabel}
                            </div>
                          </div> */}

                          

                          <div className="mt-4 min-h-23">
                            <h2 className="max-w-[20rem] text-[15px] font-semibold leading-[1.15] tracking-[0.03em] text-white">
                              {cleanTitle}
                            </h2>
                          </div>

                          <div className="space-y-2 text-[11px] text-white/55">
                            {linksToShow.slice(0, 2).map((link) => (
                                <Link
                                  key={link.id}
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 transition-colors hover:text-white/85"
                                >
                                  <ExternalLink size={12} className="shrink-0" />
                                  <span className="truncate">{link.label}</span>
                                </Link>
                              ))}
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-[14px] border border-white/18 bg-[#1a1730] px-6 py-10 text-center text-white/70 shadow-[0_20px_45px_rgba(0,0,0,0.32)]">
              No sessions available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
