"use client"

import { useUser } from "@clerk/nextjs"
import { PaginationComponent } from "@/components/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, RefreshCw, PencilLine, Trash2, QrCode, ExternalLink } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getCollectionData } from "../actions"
import MissionCategoriesSection from "./mission-categories-section"
import MissionFormDialog from "./mission-form-dialog"
import DeleteMissionDialog from "./delete-mission-dialog"
import ViewQRDialog from "./view-qr-dialog"
import { Mission, MissionLink } from "./types"
import {
  getManagementPageAccessState,
  type ManagementAccessMetadata,
} from "@/lib/management-access"

const emptyList: Mission[] = []

export default function MissionsList() {
  const { user } = useUser()
  const [missions, setMissions] = useState<Mission[]>(emptyList)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editMission, setEditMission] = useState<Mission | null>(null)
  const [deleteMission, setDeleteMission] = useState<Mission | null>(null)
  const [viewQR, setViewQR] = useState<Mission | null>(null)

  const [categories, setCategories] = useState<{ id: string; categoryName: string }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [selectedCompletionMethod, setSelectedCompletionMethod] = useState<string>("")
  const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
  const { canEdit } = getManagementPageAccessState(metadata, "manage", ["/missions", "missions"])

  type MissionCollectionItem = {
    _id: string
    title?: string
    missionTitle?: string
    description?: string
    completionMethod?: "qr-scanning" | "help-desk"
    missionLink?: string
    missionLinks?: string[]
    links?: MissionLink[]
    categoryId?: string
    categoryName?: string
  }

  const getData = useCallback(() => {
    // fetch missions and categories in parallel so we can attach categoryName reliably
    Promise.all([getCollectionData("missions"), getCollectionData("missionCategories")])
      .then(([missionsRes, categoriesRes]) => {
        const cats = Array.isArray(categoriesRes?.data) ? categoriesRes.data : []
        const mappedCats = cats.map((c: any) => ({ id: c._id, categoryName: c.categoryName || "" }))
        setCategories(mappedCats)

        if (missionsRes.success) {
          const mappedMissions: Mission[] = (missionsRes.data || []).map((item: MissionCollectionItem) => {
            const normalizedLinks: MissionLink[] = Array.isArray(item.links) && item.links.length > 0
              ? item.links
              : Array.isArray(item.missionLinks) && item.missionLinks.length > 0
                ? item.missionLinks.map((link, index) => ({
                    title: `Link ${index + 1}`,
                    link,
                  }))
                : item.missionLink
                  ? [{ title: "Visit Link", link: item.missionLink }]
                  : []

            return {
            id: item._id,
            missionTitle: item.missionTitle || item.title || "",
            description: item.description || "",
            completionMethod: item.completionMethod || "qr-scanning",
            links: normalizedLinks,
            missionLinks: normalizedLinks.map((linkItem) => linkItem.link),
            missionLink: normalizedLinks[0]?.link || "",
            categoryId: item.categoryId || undefined,
            // prefer categoryName returned by the API, fallback to joined categories
            categoryName: item.categoryName || mappedCats.find((c: any) => c.id === item.categoryId)?.categoryName || undefined,
          }})

          setMissions(mappedMissions)
          toast.success("Missions data loaded")
        } else {
          toast.error("Failed to fetch missions data")
        }
      })
      .catch((error) => {
        console.error("Error fetching missions data:", error)
        toast.error("Failed to fetch missions data")
      })
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  

  const normalizedSearch = search.trim().toLowerCase()
  const filteredMissions = missions.filter((mission) => {
    const normalizedLinks = (mission.links || [])
      .map((linkItem) => `${linkItem.title} ${linkItem.link}`)
      .join(" ")
      .toLowerCase()

    const matchesSearch =
      normalizedSearch === "" ||
      mission.missionTitle.toLowerCase().includes(normalizedSearch) ||
      (mission.description || "").toLowerCase().includes(normalizedSearch) ||
      normalizedLinks.includes(normalizedSearch)

    const matchesCategory =
      !selectedCategoryId || selectedCategoryId === "" || mission.categoryId === selectedCategoryId

    const matchesCompletionMethod =
      !selectedCompletionMethod ||
      selectedCompletionMethod === "" ||
      mission.completionMethod === selectedCompletionMethod

    return matchesSearch && matchesCategory && matchesCompletionMethod
  })

  const totalPages = Math.max(1, Math.ceil(filteredMissions.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleItemsPerPageChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
    const nextValue = typeof value === "function" ? value(itemsPerPage) : value
    setItemsPerPage(nextValue)
    setPage(1)
  }

  return (
    <div className="relative overflow-visible px-4 py-4 lg:px-6">

      <div className="mb-6 flex flex-col gap-3 rounded-3xl border bg-card/90 p-5 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Admin workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Missions Management</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage missions and their associated categories.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus size={16} /> Add Mission
            </button>
          ) : null}
          <button
            type="button"
            onClick={getData}
            className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)] xl:items-start">
        <section className="rounded-3xl border bg-card/90 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">Missions</h2>
              <p className="text-sm text-muted-foreground">Browse, search, and manage each mission record.</p>
            </div>

            <div className="flex flex-row flex-wrap gap-4">
              <input
                type="text"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by title or link"
                className="rounded-xl border bg-foreground/10 px-4 py-2.5 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />

              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value)
                  setPage(1)
                }}
                className="rounded-xl border bg-background px-3 py-2.5 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>

              <select
                value={selectedCompletionMethod}
                onChange={(e) => {
                  setSelectedCompletionMethod(e.target.value)
                  setPage(1)
                }}
                className="rounded-xl border bg-background px-3 py-2.5 text-sm"
              >
                <option value="">All completion types</option>
                <option value="qr-scanning">QR Scanning</option>
                <option value="help-desk">Help Desk</option>
              </select>

              <div className="inline-flex items-center text-nowrap justify-center rounded-xl border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                {filteredMissions.length} result{filteredMissions.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-background/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="md:hidden xl:block">Completion</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMissions.length > 0 ? (
                  paginatedMissions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium max-w-70 truncate">{mission.missionTitle}</div>
                          {/* <div className="text-xs text-muted-foreground">ID: {mission.id.slice(0, 8)}</div> */}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{mission.categoryName || "—"}</div>
                      </TableCell>
                      <TableCell className="md:hidden xl:block">
                        <span className="inline-flex rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {mission.completionMethod === "help-desk" ? "Help Desk" : "QR Scanning"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-80 text-sm text-muted-foreground line-clamp-2">
                          {mission.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(mission.links || []).length > 0 ? (
                          <div className="space-y-1 space-x-1">
                            {(mission.links || []).slice(0, 2).map((linkItem, index) => (
                              <a
                                key={`${mission.id}-link-${index}`}
                                href={linkItem.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                              >
                                <ExternalLink size={12} />
                                {linkItem.title || `Link ${index + 1}`}
                              </a>
                            ))}
                            {(mission.links || []).length > 2 ? (
                              <div className="text-xs text-muted-foreground">
                                +{(mission.links || []).length - 2} more
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No link</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto flex justify-end gap-2">
                          {mission.completionMethod === "qr-scanning" ? (
                            <button
                              type="button"
                              onClick={() => setViewQR(mission)}
                              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm transition hover:bg-muted"
                              title="View QR code"
                            >
                              <QrCode size={16} />
                            </button>
                          ) : null}
                          {canEdit ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditMission(mission)}
                                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm transition hover:bg-muted"
                                title="Edit mission"
                              >
                                <PencilLine size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteMission(mission)}
                                className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive transition hover:bg-destructive hover:text-white"
                                title="Delete mission"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No missions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
                    <PaginationComponent
                      setItemsPerPage={handleItemsPerPageChange}
                      setPage={setPage}
                      page={currentPage}
                      totalPages={totalPages}
                    />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </section>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
            <MissionCategoriesSection canEdit={canEdit} />
          </div>
        </div>
      </div>

      {canEdit && editMission && (
        <MissionFormDialog
          key={editMission.id}
          open={Boolean(editMission)}
          mode="edit"
          mission={editMission}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditMission(null)
            }
          }}
          onSaved={getData}
        />
      )}

      {canEdit && addOpen && (
        <MissionFormDialog
          key="add-mission"
          open={addOpen}
          mode="add"
          onOpenChange={(open: boolean) => {
            if (!open) setAddOpen(false)
            else setAddOpen(true)
          }}
          onSaved={() => {
            setAddOpen(false)
            getData()
          }}
        />
      )}

      {canEdit && deleteMission && (
        <DeleteMissionDialog
          mission={deleteMission}
          setDeleteMission={setDeleteMission}
          getData={getData}
        />
      )}

      {viewQR && (
        <ViewQRDialog
          mission={viewQR}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setViewQR(null)
            }
          }}
        />
      )}
    </div>
  )
}
