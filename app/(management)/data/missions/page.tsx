"use client"

import { useUser } from "@clerk/nextjs"
import { FilterX, PencilLine, RefreshCw, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PaginationComponent } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getManagementPageAccessState, type ManagementAccessMetadata } from "@/lib/management-access"
import { getDataUserMissionsData, updateDataUserMissions } from "../../admin/actions"

type MissionOption = {
  id: string
  title: string
  description: string
  categoryId: string
  categoryName: string
  completionMethod: string
}

type MissionCategoryOption = {
  id: string
  categoryName: string
}

type MissionCompletionSummary = {
  missionId: string
  title: string
  description: string
  categoryId: string
  categoryName: string
  completionMethod: string
  completedAt: string
}

type UserMissionRecord = {
  id: string
  userId: string | number | null
  firstName: string
  lastName: string
  email: string
  course: string
  shortBio: string
  fullName: string
  completedCount: number
  completedMissionIds: string[]
  completedMissions: MissionCompletionSummary[]
}

type UserMissionsResponse = {
  users: UserMissionRecord[]
  missions: MissionOption[]
  categories: MissionCategoryOption[]
  lastUpdated?: string
}

function getFullName(user: Pick<UserMissionRecord, "firstName" | "lastName" | "email" | "userId">) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim()
  return name || user.email || `User-${user.userId ?? "unknown"}`
}

function getCompletionMethodLabel(method: string) {
  if (method === "qr-scanning") return "QR Scanning"
  if (method === "help-desk") return "Help Desk"
  return method || "Unspecified"
}

function formatUserId(userId: string | number | null) {
  return userId == null ? "" : `User-${userId}`
}

function UserMissionEditorDialog({
  open,
  user,
  missions,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  user: UserMissionRecord | null
  missions: MissionOption[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [draftMissionIds, setDraftMissionIds] = useState<string[]>([])

  useEffect(() => {
    if (!open || !user) return
    setSearch("")
    setDraftMissionIds(user.completedMissionIds)
  }, [open, user])

  const draftSet = useMemo(() => new Set(draftMissionIds), [draftMissionIds])

  const filteredMissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return missions.filter((mission) => {
      if (!normalizedSearch) return true
      const searchBlob = [
        mission.title,
        mission.description,
        mission.categoryName,
        mission.completionMethod,
      ]
        .join(" ")
        .toLowerCase()
      return searchBlob.includes(normalizedSearch)
    })
  }, [missions, search])

  const toggleMission = (missionId: string) => {
    setDraftMissionIds((current) =>
      current.includes(missionId) ? current.filter((item) => item !== missionId) : [...current, missionId]
    )
  }

  const setAllMissions = (checked: boolean) => {
    setDraftMissionIds(checked ? missions.map((mission) => mission.id) : [])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const data = await updateDataUserMissions({
        userId: user.userId,
        missionIds: draftMissionIds,
      })

      if (!data.success) {
        throw new Error(data.error || "Failed to update user missions")
      }

      toast.success("User missions updated successfully")
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error("Failed to update user missions:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user missions")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl bg-primary/40">
        <DialogHeader>
          <DialogTitle>{user ? `Edit missions for ${user.fullName}` : "Edit user missions"}</DialogTitle>
        </DialogHeader>

        {user ? (
          <div className="space-y-5 py-4">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              <Badge variant="outline" className="border-white/15 text-white">
                {formatUserId(user.userId)}
              </Badge>
              <span>{user.email || "No email on file"}</span>
              <span className="text-white/50">|</span>
              <span>{user.course || "No course on file"}</span>
              <span className="text-white/50">|</span>
              <span>
                {draftMissionIds.length} of {missions.length} missions selected
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search missions by title, category, or method"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-10 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
                />
              </div>
              <button
                type="button"
                onClick={() => setAllMissions(true)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/15"
              >
                Mark all complete
              </button>
              <button
                type="button"
                onClick={() => setAllMissions(false)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/15"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              {filteredMissions.length ? (
                filteredMissions.map((mission) => {
                  const isCompleted = draftSet.has(mission.id)
                  return (
                    <div
                      key={mission.id}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${isCompleted ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-black/15"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleMission(mission.id)}
                        aria-label={`Toggle mission ${mission.title}`}
                        className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-white/20 bg-transparent text-transparent hover:border-white/40"}`}
                      >
                        <span className="text-[10px] leading-none">✓</span>
                      </button>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="max-w-104 truncate text-sm font-medium text-white">{mission.title}</p>
                          <Badge variant="outline" className="border-white/15 text-white/85">
                            {mission.categoryName}
                          </Badge>
                          <Badge variant="outline" className="border-white/15 text-white/85">
                            {getCompletionMethodLabel(mission.completionMethod)}
                          </Badge>
                        </div>
                        {mission.description ? (
                          <p className="line-clamp-2 text-sm leading-6 text-white/70">{mission.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMission(mission.id)}
                        className={`mt-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${isCompleted ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
                      >
                        {isCompleted ? "Take back" : "Mark complete"}
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-6 text-sm text-white/65">
                  No missions matched your search.
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default function DataMissionsPage() {
  const { user, isLoaded } = useUser()
  const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
  const { canView, canEdit } = getManagementPageAccessState(metadata, "data", ["/data/missions", "data/missions"])

  const [users, setUsers] = useState<UserMissionRecord[]>([])
  const [missions, setMissions] = useState<MissionOption[]>([])
  const [categories, setCategories] = useState<MissionCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedMissionId, setSelectedMissionId] = useState("")
  const [selectedCompletionMethod, setSelectedCompletionMethod] = useState("")
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeUser, setActiveUser] = useState<UserMissionRecord | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getDataUserMissionsData()
      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to load user missions")
      }

      const response = data.data as UserMissionsResponse
      setUsers(Array.isArray(response.users) ? response.users : [])
      setMissions(Array.isArray(response.missions) ? response.missions : [])
      setCategories(Array.isArray(response.categories) ? response.categories : [])
      setLastUpdated(response.lastUpdated || null)
    } catch (error) {
      console.error("Failed to load data missions:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load user missions")
      setUsers([])
      setMissions([])
      setCategories([])
      setLastUpdated(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!canView) return
    void loadData()
  }, [canView, isLoaded])

  const sortedUsers = useMemo(() => {
    return [...users].sort((left, right) => {
      const countDiff = right.completedCount - left.completedCount
      if (countDiff !== 0) return countDiff

      const leftName = getFullName(left)
      const rightName = getFullName(right)
      const nameDiff = leftName.localeCompare(rightName, undefined, { sensitivity: "base" })
      if (nameDiff !== 0) return nameDiff

      return String(left.userId ?? left.id).localeCompare(String(right.userId ?? right.id), undefined, { sensitivity: "base" })
    })
  }, [users])

  const normalizedSearch = search.trim().toLowerCase()

  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((userMission) => {
      const userSearchBlob = [
        userMission.fullName,
        userMission.email,
        userMission.course,
        String(userMission.userId ?? ""),
        userMission.completedMissions.map((mission) => `${mission.title} ${mission.categoryName} ${mission.completionMethod}`).join(" "),
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !normalizedSearch || userSearchBlob.includes(normalizedSearch)
      const matchesCategory = !selectedCategoryId || userMission.completedMissions.some((mission) => mission.categoryId === selectedCategoryId)
      const matchesMission = !selectedMissionId || userMission.completedMissionIds.includes(selectedMissionId)
      const matchesCompletionMethod = !selectedCompletionMethod || userMission.completedMissions.some((mission) => mission.completionMethod === selectedCompletionMethod)

      return matchesSearch && matchesCategory && matchesMission && matchesCompletionMethod
    })
  }, [normalizedSearch, selectedCategoryId, selectedCompletionMethod, selectedMissionId, sortedUsers])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)

  const activeCategories = categories.length
    ? categories
    : Array.from(new Set(missions.map((mission) => mission.categoryName)))
        .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }))
        .map((categoryName) => ({ id: categoryName, categoryName }))

  const resetFilters = () => {
    setSearch("")
    setSelectedCategoryId("")
    setSelectedMissionId("")
    setSelectedCompletionMethod("")
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  if (!isLoaded) {
    return <div className="p-4 text-sm text-muted-foreground">Loading access...</div>
  }

  if (!canView) {
    return <div className="p-4 text-sm text-muted-foreground">You do not have permission to view this page.</div>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Missions Management</h1>
          <p className="text-sm text-muted-foreground">
            Review completed missions, search users, and edit mission completion status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by user, email, course, or mission title"
                className="w-full rounded-lg border bg-foreground/10 px-10 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategoryId}
              onChange={(event) => {
                setSelectedCategoryId(event.target.value)
                setPage(1)
              }}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>

            <select
              value={selectedMissionId}
              onChange={(event) => {
                setSelectedMissionId(event.target.value)
                setPage(1)
              }}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">All missions</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>

            <select
              value={selectedCompletionMethod}
              onChange={(event) => {
                setSelectedCompletionMethod(event.target.value)
                setPage(1)
              }}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">All completion methods</option>
              <option value="qr-scanning">QR Scanning</option>
              <option value="help-desk">Help Desk</option>
            </select>

            {(search || selectedCategoryId || selectedMissionId || selectedCompletionMethod) ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-muted-foreground px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <FilterX size={16} /> Clear filters
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-muted/20 px-3 py-1">
              {users.length} user{users.length === 1 ? "" : "s"} with completed missions
            </span>
            <span className="rounded-full border bg-muted/20 px-3 py-1">
              {missions.length} mission{missions.length === 1 ? "" : "s"} in catalog
            </span>
            {lastUpdated ? (
              <span className="rounded-full border bg-muted/20 px-3 py-1">
                Last updated {new Date(lastUpdated).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-background/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Missions</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Loading user missions...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((record) => (
                  <TableRow key={`${record.id}-${record.userId ?? "unknown"}`}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{record.fullName}</div>
                        <div className="text-xs text-muted-foreground">{formatUserId(record.userId)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="px-3 py-1 text-xs">
                        {record.completedCount} completed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-136 flex-wrap gap-2">
                        {record.completedMissions.slice(0, 3).map((mission) => (
                          <Badge key={mission.missionId} variant="outline" className="max-w-full border-muted-foreground/30 text-xs">
                            <span className="max-w-44 truncate">{mission.title}</span>
                          </Badge>
                        ))}
                        {record.completedMissions.length > 3 ? (
                          <Badge variant="outline" className="border-muted-foreground/30 text-xs">
                            +{record.completedMissions.length - 3} more
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="truncate">{record.email || "No email on file"}</div>
                        <div className="truncate">{record.course || "No course on file"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setActiveUser(record)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <PencilLine size={16} /> Edit missions
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No matching users with completed missions were found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <PaginationComponent page={currentPage} totalPages={totalPages} setPage={setPage} setItemsPerPage={setItemsPerPage} />
        </div>
      </section>

      <UserMissionEditorDialog
        open={Boolean(activeUser)}
        user={activeUser}
        missions={missions}
        onOpenChange={(open) => {
          if (!open) setActiveUser(null)
        }}
        onSaved={() => void loadData()}
      />
    </div>
  )
}