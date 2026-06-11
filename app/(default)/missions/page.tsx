'use client'
import { motion } from "framer-motion"
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import { CircleCheckBig, ChevronDown, Circle, ExternalLink } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { getCollectionData } from "@/app/(management)/admin/actions"

type MissionLink = {
  title: string
  link: string
}

type Mission = {
  id: string
  title: string
  description?: string
  links?: MissionLink[]
  categoryId?: string
  categoryName?: string
  completionMethod?: "qr-scanning" | "help-desk" | "sign-up"
  requiredSignups?: number | null
  isRequired?: boolean
}

type MissionGroup = {
  group: string
  missions: Mission[]
}

type MissionRecord = {
  _id: string
  missionTitle?: string
  title?: string
  description?: string
  completionMethod?: "qr-scanning" | "help-desk" | "sign-up"
  requiredSignups?: number | null
  isRequired?: boolean
  links?: MissionLink[]
  missionLinks?: string[]
  missionLink?: string
  categoryId?: string
  categoryName?: string
}

type MissionCategoryRecord = {
  _id: string
  categoryName?: string
}

type MissionCompletionRecord = {
  userId?: string | number
  missionId?: string
}

type SignupMissionProgressRecord = {
  missionId: string
  title: string
  requiredSignups: number
  currentSignups: number
  isComplete: boolean
}

const normalizeLinks = (mission: MissionRecord): MissionLink[] => {
  if (Array.isArray(mission.links) && mission.links.length > 0) {
    return mission.links
      .map((item) => ({
        title: item?.title?.trim() || "Visit Link",
        link: item?.link?.trim() || "",
      }))
      .filter((item) => Boolean(item.link))
  }

  if (Array.isArray(mission.missionLinks) && mission.missionLinks.length > 0) {
    return mission.missionLinks
      .map((link, index) => ({ title: `Link ${index + 1}`, link: link?.trim() || "" }))
      .filter((item) => Boolean(item.link))
  }

  if (typeof mission.missionLink === "string" && mission.missionLink.trim()) {
    return [{ title: "Visit Link", link: mission.missionLink.trim() }]
  }

  return []
}

const MissionsPage = () => {
  const { user } = useUser()
  const [missions, setMissions] = useState<Mission[]>([])
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([])
  const [signupProgressByMissionId, setSignupProgressByMissionId] = useState<Record<string, SignupMissionProgressRecord>>({})
  const [isLoading, setIsLoading] = useState(true)

  const missionGroups = useMemo(() => {
    const groups = new Map<string, Mission[]>()

    for (const mission of missions) {
      const groupName = mission.categoryName?.trim() || "Uncategorized"
      const current = groups.get(groupName) || []
      current.push(mission)
      groups.set(groupName, current)
    }

    return Array.from(groups.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([group, groupedMissions]) => ({
        group,
        missions: groupedMissions,
      }))
  }, [missions])

  useEffect(() => {
    let isMounted = true

    const loadMissions = async () => {
      if (isMounted) {
        setIsLoading(true)
      }

      try {
        const [missionsRes, categoriesRes, completionsRes, userRes, signupProgressRes] = await Promise.all([
          getCollectionData("missions"),
          getCollectionData("missionCategories"),
          getCollectionData("missionCompletions"),
          user?.id
            ? fetch(`/api/getUserInCollection?user_id=${encodeURIComponent(user.id)}`).then((res) => res.json())
            : Promise.resolve({ success: false, data: null }),
          user?.id
            ? fetch("/api/signup-mission-progress").then((res) => res.json())
            : Promise.resolve({ success: false, data: null }),
        ])

        if (!isMounted) return

        const missionRows = Array.isArray(missionsRes?.data) ? (missionsRes.data as MissionRecord[]) : []
        const categoryRows = Array.isArray(categoriesRes?.data)
          ? (categoriesRes.data as MissionCategoryRecord[])
          : []
        const completionRows = Array.isArray(completionsRes?.data)
          ? (completionsRes.data as MissionCompletionRecord[])
          : []
        const signupProgressRows = Array.isArray(signupProgressRes?.data?.progress)
          ? (signupProgressRes.data.progress as SignupMissionProgressRecord[])
          : []
        const signupCompletedIds = Array.isArray(signupProgressRes?.data?.completedMissionIds)
          ? (signupProgressRes.data.completedMissionIds as string[])
          : []

        const categoryById = new Map<string, string>()
        for (const category of categoryRows) {
          if (category?._id) {
            categoryById.set(String(category._id), category.categoryName?.trim() || "Uncategorized")
          }
        }

        const normalizedMissions: Mission[] = missionRows.map((mission) => ({
          id: mission._id,
          title: mission.missionTitle || mission.title || "Untitled mission",
          description: mission.description || "",
          links: normalizeLinks(mission),
          categoryId: mission.categoryId,
          completionMethod: mission.completionMethod || "qr-scanning",
          requiredSignups: mission.requiredSignups ?? undefined,
          isRequired: mission.isRequired ?? false,
          categoryName:
            mission.categoryName ||
            (mission.categoryId ? categoryById.get(String(mission.categoryId)) : undefined) ||
            "Uncategorized",
        }))

        setMissions(normalizedMissions)
        setSignupProgressByMissionId(
          signupProgressRows.reduce<Record<string, SignupMissionProgressRecord>>((accumulator, item) => {
            accumulator[item.missionId] = item
            return accumulator
          }, {})
        )
        setOpenGroups(Array.from(new Set(normalizedMissions.map((mission) => mission.categoryName || "Uncategorized"))))

        const currentUserId = userRes?.success ? userRes?.data?.userId : null
        const completed = new Set<string>(signupCompletedIds)

        if (currentUserId !== null && currentUserId !== undefined) {
          completionRows
            .filter((record) => String(record.userId) === String(currentUserId))
            .map((record) => record.missionId)
            .filter((missionId): missionId is string => Boolean(missionId))
            .forEach((missionId) => completed.add(missionId))
        }

        setCompletedMissionIds(Array.from(completed))
      } catch (error) {
        console.error("Failed to load missions:", error)
        if (isMounted) {
          setMissions([])
          setCompletedMissionIds([])
          setSignupProgressByMissionId({})
          setOpenGroups([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMissions()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const missionGroupStats = missionGroups.map((group) => {
    const completed = group.missions.filter((mission) => completedMissionIds.includes(mission.id)).length
    const total = group.missions.length

    return {
      ...group,
      completed,
      total,
      progressPercent: total ? (completed / total) * 100 : 0,
    }
  })

  const completedMissions = missions.filter((mission) => completedMissionIds.includes(mission.id)).length
  const totalMissions = missions.length
  const progressPercent = totalMissions ? (completedMissions / totalMissions) * 100 : 0

  const toggleGroup = (groupName: string) => {
    setOpenGroups((current) =>
      current.includes(groupName)
        ? current.filter((group) => group !== groupName)
        : [...current, groupName],
    )
  }

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
        <div className={`text-3xl tracking-wider md:text-4xl lg:text-5xl ${moscaLaroke.className}`}>
          MIssIOns
        </div>
        <p className="text-center leading-tight font-thin tracking-[0.2rem] lg:text-start">
          Complete your event missions and track your progress.
        </p>
        <hr className="w-full outline-1" />

        <div className="flex w-full flex-col gap-2">
          <div className={`flex flex-row justify-between text-sm uppercase tracking-[0.2em] text-white/70 ${sora.className}`}>
            <p>Overall Progress</p>
            {isLoading ? (
              <p className="animate-pulse text-white/45">Loading missions...</p>
            ) : (
              <p>
                {completedMissions}/{totalMissions} Completed
              </p>
            )}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-[#6F52FF] via-[#8B5CF6] to-[#C084FC] shadow-[0_0_24px_rgba(123,77,255,0.55)]"
              initial={{ width: 0 }}
              animate={{ width: isLoading ? "22%" : `${progressPercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4">
          {isLoading ? (
            <div className="rounded-2xl border border-white/15 bg-linear-to-r from-primary/20 to-[#0d0b29] px-5 py-6 text-white/60">
              Loading missions...
            </div>
          ) : (
            (missionGroupStats as Array<MissionGroup & { completed: number; total: number; progressPercent: number }>).map((group) => {
            const isOpen = openGroups.includes(group.group)

            return (
              <div
                key={group.group}
                className="overflow-hidden rounded-2xl border border-white/15 bg-linear-to-r from-primary/20 to-[#0d0b29]"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`text-xl tracking-[0.2em] uppercase ${sora.className}`}>
                        {group.group}
                      </p>
                      <p className="text-sm font-medium text-white/45">
                        {group.completed}/{group.total}
                      </p>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-[#6F52FF] via-[#8B5CF6] to-[#C084FC] shadow-[0_0_18px_rgba(123,77,255,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${group.progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-white/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div className="h-px bg-white/10" />

                {isOpen ? (
                  <div className="px-4 py-4">
                    <div className="flex w-full flex-col gap-3">
                      {group.missions.sort((a, b) => {
                        if (a.isRequired && !b.isRequired) return -1
                        if (!a.isRequired && b.isRequired) return 1
                        return a.title.localeCompare(b.title)
                      }).map((mission) => (
                        (() => {
                          const isCompleted = completedMissionIds.includes(mission.id)
                          const signupProgress = signupProgressByMissionId[mission.id]

                          return (
                        <div
                          key={mission.id}
                          className="rounded-xl border border-white/10 bg-white/3 px-4 py-4 transition hover:border-white/20 hover:bg-white/5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex size-4 shrink-0 items-center justify-center text-white/35">
                              {isCompleted ? (
                                <CircleCheckBig className="size-4 text-[#C084FC]" />
                              ) : (
                                <Circle className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className={`text-[17px]  font-semibold leading-tight ${sora.className} ${isCompleted ? 'line-through text-gray-600' : 'text-white/95'}`}>
                                    {mission.title}
                                  </p>
                                  {mission.isRequired && (
                                    <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                                      Required
                                    </span>
                                  )}
                                </div>

                                {mission.completionMethod === "sign-up" && signupProgress ? (
                                  <span className="shrink-0 whitespace-nowrap uppercase tracking-[0.18em] text-white/55 tabular-nums leading-none">
                                    {signupProgress.currentSignups}/{signupProgress.requiredSignups}
                                  </span>
                                ) : null}
                              </div>

                              {mission.completionMethod === "sign-up" && signupProgress ? (
                                <div className="mt-2 space-y-1">
                                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                      className="h-full rounded-full bg-linear-to-r from-[#6F52FF] via-[#8B5CF6] to-[#C084FC]"
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(100, (signupProgress.currentSignups / signupProgress.requiredSignups) * 100)}%`,
                                      }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {mission.description ? (
                                <p className="mt-1 text-sm leading-relaxed text-white/60">
                                  {mission.description}
                                </p>
                              ) : null}

                              {mission.completionMethod === "sign-up" && signupProgress ? (
                                <p className="mt-2 text-xs text-white/55">
                                  {signupProgress.isComplete
                                    ? "Requirement reached. This mission is complete."
                                    : "Keep signing up with companies to complete this mission."}
                                </p>
                              ) : null}

                              {mission.links?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {mission.links.map((link) => (
                                    <a
                                      key={link.title}
                                      href={link.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1 text-xs font-medium text-[#D8C8FF] transition hover:border-[#B48CFF]/60 hover:bg-[#8B5CF6]/18 hover:text-white"
                                    >
                                      {link.title}
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                          )
                        })()
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          }))}
        </div>
      </div>
    </div>
  )
}

export default MissionsPage