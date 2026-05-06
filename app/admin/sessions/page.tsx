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
import { Plus, RefreshCw, PencilLine, Trash2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getCollectionData } from "../actions"
import SessionFormDialog from "./session-form-dialog"
import DeleteSessionDialog from "./delete-session-dialog"
import { Session } from "./types"

const emptyList: Session[] = []

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>(emptyList)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [deleteSession, setDeleteSession] = useState<Session | null>(null)
  const [companies, setCompanies] = useState<Map<string, string>>(new Map())

  type SessionCollectionItem = {
    _id: string
    topicPictureUrl?: string
    logoUrl?: string
    sessionTitle?: string
    startTime?: string
    endTime?: string
    sessionDate?: string
    company?: string
  }

  const getData = useCallback(() => {
    getCollectionData("sessions")
      .then((response) => {
        if (response.success) {
          const mappedSessions: Session[] = (response.data || []).map((item: SessionCollectionItem) => ({
            id: item._id,
            topicPictureUrl: item.topicPictureUrl || "",
            logoUrl: item.logoUrl || "",
            sessionTitle: item.sessionTitle || "",
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            sessionDate: item.sessionDate || "",
            company: item.company || "",
          }))

          setSessions(mappedSessions)
          toast.success("Sessions data loaded")
        } else {
          toast.error("Failed to fetch sessions data")
        }
      })
      .catch((error) => {
        console.error("Error fetching sessions data:", error)
        toast.error("Failed to fetch sessions data")
      })
  }, [])

  // Fetch companies mapping
  useEffect(() => {
    getCollectionData("companies")
      .then((response) => {
        if (response.success) {
          const companyMap = new Map<string, string>()
          ;(response.data || []).forEach((company: any) => {
            companyMap.set(company._id, company.name || "Unnamed")
          })
          setCompanies(companyMap)
        }
      })
      .catch((error) => {
        console.error("Error fetching companies:", error)
      })
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      normalizedSearch === "" ||
      session.sessionTitle.toLowerCase().includes(normalizedSearch) ||
      session.company.toLowerCase().includes(normalizedSearch) ||
      companies.get(session.company)?.toLowerCase().includes(normalizedSearch)

    const today = new Date().toISOString().split("T")[0]
    const matchesFilter =
      filter === "all" ||
      (filter === "upcoming" && session.sessionDate >= today) ||
      (filter === "past" && session.sessionDate < today)

    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (value: typeof filter) => {
    setFilter(value)
    setPage(1)
  }

  const handleItemsPerPageChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
    const nextValue = typeof value === "function" ? value(itemsPerPage) : value
    setItemsPerPage(nextValue)
    setPage(1)
  }

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(`${date}T${time}`)
      return dateObj.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return `${date} ${time}`
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sessions Management</h1>
          <p className="text-sm text-muted-foreground">Manage career sessions and company talks.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Add Session
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
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by title, company name"
            className="w-full rounded-lg border bg-foreground/10 px-3 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />

          <select
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value as typeof filter)}
            className="rounded-lg border bg-foreground/40 text-background px-3 py-2 text-sm"
          >
            <option value="all">All sessions</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {filteredSessions.length} result{filteredSessions.length === 1 ? "" : "s"}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Topic</TableHead>
              <TableHead className="w-24">Logo</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Start - End</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.length > 0 ? (
              paginatedSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {session.topicPictureUrl ? (
                      <Image
                        src={session.topicPictureUrl}
                        alt={session.sessionTitle}
                        width={72}
                        height={72}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No image</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.logoUrl ? (
                      <Image
                        src={session.logoUrl}
                        alt="Logo"
                        width={72}
                        height={72}
                        className="h-16 w-16 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No logo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{session.sessionTitle}</div>
                      <div className="text-xs text-muted-foreground">ID: {session.id.slice(0, 8)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[10rem] text-sm">
                      {companies.get(session.company) || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(`${session.sessionDate}T00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditSession(session)}
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        title="Edit session"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSession(session)}
                        className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white"
                        title="Delete session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7}>
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
        <SessionFormDialog
          key="add-session"
          open={addOpen}
          mode="add"
          onOpenChange={setAddOpen}
          onSaved={getData}
        />
      )}

      {editSession && (
        <SessionFormDialog
          key={editSession.id}
          open={Boolean(editSession)}
          mode="edit"
          session={editSession}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditSession(null)
            }
          }}
          onSaved={getData}
        />
      )}

      {deleteSession && (
        <DeleteSessionDialog
          session={deleteSession}
          setDeleteSession={setDeleteSession}
          getData={getData}
        />
      )}
    </div>
  )
}
