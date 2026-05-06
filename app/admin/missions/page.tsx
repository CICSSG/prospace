"use client"

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
import MissionFormDialog from "./mission-form-dialog"
import DeleteMissionDialog from "./delete-mission-dialog"
import ViewQRDialog from "./view-qr-dialog"
import { Mission } from "./types"

const emptyList: Mission[] = []

export default function MissionsList() {
  const [missions, setMissions] = useState<Mission[]>(emptyList)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editMission, setEditMission] = useState<Mission | null>(null)
  const [deleteMission, setDeleteMission] = useState<Mission | null>(null)
  const [viewQR, setViewQR] = useState<Mission | null>(null)

  type MissionCollectionItem = {
    _id: string
    missionTitle?: string
    missionLink?: string
  }

  const getData = useCallback(() => {
    getCollectionData("missions")
      .then((response) => {
        if (response.success) {
          const mappedMissions: Mission[] = (response.data || []).map((item: MissionCollectionItem) => ({
            id: item._id,
            missionTitle: item.missionTitle || "",
            missionLink: item.missionLink || "",
          }))

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
    const matchesSearch =
      normalizedSearch === "" ||
      mission.missionTitle.toLowerCase().includes(normalizedSearch) ||
      mission.missionLink.toLowerCase().includes(normalizedSearch)

    return matchesSearch
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Missions Management</h1>
          <p className="text-sm text-muted-foreground">Manage event missions and QR codes.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Add Mission
          </button>
          <button
            type="button"
            onClick={getData}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by title or link"
            className="w-full rounded-lg border bg-foreground/10 px-3 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {filteredMissions.length} result{filteredMissions.length === 1 ? "" : "s"}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mission Title</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMissions.length > 0 ? (
              paginatedMissions.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{mission.missionTitle}</div>
                      <div className="text-xs text-muted-foreground">ID: {mission.id.slice(0, 8)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {mission.missionLink ? (
                      <a
                        href={mission.missionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        <ExternalLink size={12} />
                        Visit Link
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No link</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setViewQR(mission)}
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        title="View QR code"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMission(mission)}
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        title="Edit mission"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteMission(mission)}
                        className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white"
                        title="Delete mission"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                  No missions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>
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
      </section>

      {addOpen && (
        <MissionFormDialog
          key="add-mission"
          open={addOpen}
          mode="add"
          onOpenChange={setAddOpen}
          onSaved={getData}
        />
      )}

      {editMission && (
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

      {deleteMission && (
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
