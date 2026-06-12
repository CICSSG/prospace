"use client"

import { useUser } from "@clerk/nextjs"
import { QrCode, FilterX, Plus, RefreshCw, Search, Trash2, Download, Check } from "lucide-react"
import { Scanner } from "@yudiel/react-qr-scanner"
import * as XLSX from "xlsx"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PaginationComponent } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getManagementPageAccessState, type ManagementAccessMetadata } from "@/lib/management-access"

type AttendanceRecord = {
  id: string
  attendanceKey: string
  userId: string | number | null
  clerkId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  attendanceAt: string
  attendanceDate: string
  attendanceTime: string
  source: "manual" | "scanner"
  createdAt: string
  updatedAt: string
}

type AttendanceUser = {
  id: string
  attendanceKey: string
  userId: string | number | null
  clerkId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  course: string
  hasAttendanceToday: boolean
  attendanceRecord: AttendanceRecord | null
  latestAttendanceRecord: AttendanceRecord | null
  createdAt: string
  updatedAt: string
}

type AttendanceResponse = {
  users: AttendanceUser[]
  attendanceRecords: AttendanceRecord[]
  lastUpdated?: string
}

const scannerConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
  aspectRatio: 1,
}

function getLookupValue(user: AttendanceUser) {
  return user.userId != null ? String(user.userId) : user.email
}

function formatDateTime(value: string) {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function toDateTimeLocal(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function extractUserIdFromQr(rawValue: string) {
  const trimmed = rawValue.trim()

  try {
    const url = new URL(trimmed)
    return url.searchParams.get("id") || ""
  } catch {
    const match = trimmed.match(/[?&]id=([^&]+)/i)
    if (match?.[1]) {
      return decodeURIComponent(match[1])
    }

    return trimmed
  }
}

function getAttendanceDateKey(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-CA")
}

const PHT_OFFSET_MS = 8 * 60 * 60 * 1000

function toPHT(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "", time: "" }
  const ms = Date.parse(isoString)
  if (Number.isNaN(ms)) return { date: "", time: "" }
  const pht = new Date(ms + PHT_OFFSET_MS)
  const iso = pht.toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) }
}

function formatDateLabel(dateKey: string) {
  if (!dateKey) return dateKey
  const date = new Date(dateKey + "T00:00:00")
  if (Number.isNaN(date.getTime())) return dateKey
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

// ─── Export Dialog ─────────────────────────────────────────────────────────────

function ExportDialog({
  open,
  onOpenChange,
  attendanceRecords,
  users,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendanceRecords: AttendanceRecord[]
  users: AttendanceUser[]
}) {
  const [exportMode, setExportMode] = useState<"all" | "select">("all")
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) {
      setExportMode("all")
      setSelectedDates(new Set())
    }
  }, [open])

  const uniqueDates = useMemo(() => {
    const counts = new Map<string, number>()
    attendanceRecords.forEach((r) => {
      const { date } = toPHT(r.createdAt)
      if (date) counts.set(date, (counts.get(date) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [attendanceRecords])

  const allDatesSelected = uniqueDates.length > 0 && uniqueDates.every(([d]) => selectedDates.has(d))

  const toggleDate = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const toggleAll = () => {
    if (allDatesSelected) {
      setSelectedDates(new Set())
    } else {
      setSelectedDates(new Set(uniqueDates.map(([d]) => d)))
    }
  }

  const handleExport = () => {
    const courseByKey = new Map(users.map((u) => [u.attendanceKey, u.course]))

    const recordsToExport =
      exportMode === "all"
        ? attendanceRecords
        : attendanceRecords.filter((r) => selectedDates.has(toPHT(r.createdAt).date))

    if (recordsToExport.length === 0) {
      toast.error("No records to export for the selected dates")
      return
    }

    const rows = [...recordsToExport]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((r) => {
        const { date, time } = toPHT(r.createdAt)
        return {
          Name: r.fullName,
          Email: r.email,
          Course: courseByKey.get(r.attendanceKey) ?? "",
          "User ID": r.userId ?? "",
          "Date (PHT)": date,
          "Time (PHT)": time,
          Source: r.source,
        }
      })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    const colWidths = [
      { wch: 28 },
      { wch: 32 },
      { wch: 40 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
    ]
    ws["!cols"] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "Attendance")

    const filename = `attendance-${new Date().toLocaleDateString("en-CA")}.xlsx`
    XLSX.writeFile(wb, filename)
    toast.success(`Exported ${rows.length} record${rows.length === 1 ? "" : "s"}`)
    onOpenChange(false)
  }

  const exportCount =
    exportMode === "all"
      ? attendanceRecords.length
      : attendanceRecords.filter((r) => selectedDates.has(toPHT(r.createdAt).date)).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-primary/40">
        <DialogHeader>
          <DialogTitle>Export attendance to Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-white/10 px-4 py-3 hover:bg-white/5">
              <span
                className={`flex size-4 items-center justify-center rounded-full border-2 ${exportMode === "all" ? "border-primary bg-primary" : "border-white/40"}`}
              >
                {exportMode === "all" && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-sm text-white/90">
                Export all data
                <span className="ml-2 text-xs text-white/50">({attendanceRecords.length} records)</span>
              </span>
              <input
                type="radio"
                name="exportMode"
                value="all"
                checked={exportMode === "all"}
                onChange={() => setExportMode("all")}
                className="sr-only"
              />
            </label>

            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-white/10 px-4 py-3 hover:bg-white/5">
              <span
                className={`flex size-4 items-center justify-center rounded-full border-2 ${exportMode === "select" ? "border-primary bg-primary" : "border-white/40"}`}
              >
                {exportMode === "select" && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-sm text-white/90">Select specific day(s)</span>
              <input
                type="radio"
                name="exportMode"
                value="select"
                checked={exportMode === "select"}
                onChange={() => setExportMode("select")}
                className="sr-only"
              />
            </label>
          </div>

          {exportMode === "select" && (
            <div className="space-y-2">
              {uniqueDates.length === 0 ? (
                <p className="text-sm text-white/50 text-center py-4">No attendance records found</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="w-full flex items-center justify-between rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    <span>{allDatesSelected ? "Deselect all" : "Select all days"}</span>
                    <span className="text-xs text-white/50">{uniqueDates.length} day{uniqueDates.length === 1 ? "" : "s"}</span>
                  </button>

                  <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-white/10 p-2">
                    {uniqueDates.map(([date, count]) => {
                      const checked = selectedDates.has(date)
                      return (
                        <label
                          key={date}
                          className="flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 hover:bg-white/5"
                        >
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary" : "border-white/30 bg-white/5"}`}
                          >
                            {checked && <Check size={11} className="text-white" />}
                          </span>
                          <span className="flex-1 text-sm text-white/80">{formatDateLabel(date)}</span>
                          <span className="text-xs text-white/40">{count} record{count === 1 ? "" : "s"}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDate(date)}
                            className="sr-only"
                          />
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {exportCount > 0 && (
            <p className="text-xs text-white/50 text-center">
              {exportCount} record{exportCount === 1 ? "" : "s"} will be exported
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportMode === "select" && selectedDates.size === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={15} /> Export
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Upsert Dialog ─────────────────────────────────────────────────────────────

function AttendanceUpsertDialog({
  open,
  mode,
  user,
  attendanceRecord,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  mode: "create" | "edit"
  user?: AttendanceUser | null
  attendanceRecord?: AttendanceRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [identifier, setIdentifier] = useState("")
  const [attendanceAt, setAttendanceAt] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    if (mode === "create") {
      setIdentifier(user ? getLookupValue(user) : "")
      setAttendanceAt("")
      return
    }

    setIdentifier(user ? getLookupValue(user) : "")
    setAttendanceAt(attendanceRecord?.attendanceAt ? toDateTimeLocal(attendanceRecord.attendanceAt) : "")
  }, [attendanceRecord, mode, open, user])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === "create") {
        if (!identifier.trim()) {
          toast.error("Email or userId is required")
          return
        }

        const response = await fetch("/api/data/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: identifier.trim() }),
        })

        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to create attendance record")
        }

        toast.success(data.action === "updated" ? "Attendance updated" : "Attendance created")
      } else {
        if (!attendanceRecord?.id) {
          throw new Error("Attendance record is missing")
        }

        const response = await fetch("/api/data/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendanceId: attendanceRecord.id,
            attendanceAt: attendanceAt ? fromDateTimeLocal(attendanceAt) : undefined,
          }),
        })

        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to update attendance record")
        }

        toast.success("Attendance updated")
      }

      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to save attendance record")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-primary/40">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New attendance entry" : "Edit attendance entry"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "create" ? (
            <>
              <p className="text-sm text-white/75">
                Enter the user&apos;s email or userId to log attendance.
              </p>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="user@example.com or 123"
                className="bg-white/10 text-white placeholder:text-white/40"
              />
            </>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p>User: <span className="font-medium text-white">{user?.fullName || attendanceRecord?.fullName || "Unknown"}</span></p>
              <p className="mt-2">Email: <span className="font-medium text-white">{user?.email || attendanceRecord?.email || "Unknown"}</span></p>
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-2">
              <label className="text-sm text-white/80">Attendance date and time</label>
              <Input
                type="datetime-local"
                value={attendanceAt}
                onChange={(e) => setAttendanceAt(e.target.value)}
                className="bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "create" ? "Create attendance" : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Scanner Dialog ─────────────────────────────────────────────────────────────

function AttendanceScannerDialog({
  open,
  onOpenChange,
  onScanned,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanned: (userId: string) => Promise<void>
}) {
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setScannerMessage(null)
  }, [open])

  const handleScan = async (detectedCodes: any) => {
    const rawValue = detectedCodes?.[0]?.rawValue
    if (!rawValue) return

    const userId = extractUserIdFromQr(String(rawValue))
    if (!userId) {
      setScannerMessage("Could not read a user id from the scanned QR code.")
      return
    }

    try {
      await onScanned(userId)
    } catch (error) {
      setScannerMessage(error instanceof Error ? error.message : "Failed to create attendance from QR code.")
    }
  }

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Camera access was blocked or unavailable."
    setScannerMessage(
      message.includes("permission") || message.includes("secure context")
        ? "Allow camera access in iPhone Safari, then reopen the scanner."
        : "Camera could not start on this device. Make sure you are using HTTPS and allow camera access in Safari."
    )
    console.error("Scanner error:", error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-black/90 text-white">
        <DialogHeader>
          <DialogTitle>Scan attendance QR code</DialogTitle>
        </DialogHeader>

        <div className="relative min-h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
          {scannerMessage && (
            <div className="absolute top-4 left-4 right-4 z-10 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm">
              {scannerMessage}
            </div>
          )}
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={scannerConstraints}
            components={{ finder: true }}
            sound={false}
          />
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
          >
            Close scanner
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAttendance() {
  const { user } = useUser()
  const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
  const { canView, canEdit } = getManagementPageAccessState(metadata, "manage", ["/admin/attendance", "admin/attendance"])

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AttendanceUser[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "missing">("all")
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [prefillUser, setPrefillUser] = useState<AttendanceUser | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/data/attendance")
      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: AttendanceResponse; error?: string }
        | null

      if (!response.ok || !data?.success || !data.data) {
        throw new Error(data?.error || "Failed to load attendance data")
      }

      setUsers(Array.isArray(data.data.users) ? data.data.users : [])
      setAttendanceRecords(Array.isArray(data.data.attendanceRecords) ? data.data.attendanceRecords : [])
      setLastUpdated(data.data.lastUpdated || null)
    } catch (error) {
      console.error("Failed to load attendance data:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load attendance data")
      setUsers([])
      setAttendanceRecords([])
      setLastUpdated(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    if (!canView) {
      toast.error("You do not have permission to access this page")
      return
    }
    void loadData()
  }, [canView, loadData, user])

  const normalizedSearch = search.trim().toLowerCase()

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const searchBlob = [
        item.fullName,
        item.email,
        item.course,
        String(item.userId ?? ""),
        item.attendanceRecord?.attendanceAt ?? "",
        item.attendanceRecord?.attendanceDate ?? "",
        item.attendanceRecord?.attendanceTime ?? "",
        item.latestAttendanceRecord?.attendanceAt ?? "",
        item.latestAttendanceRecord?.attendanceDate ?? "",
        item.latestAttendanceRecord?.attendanceTime ?? "",
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !normalizedSearch || searchBlob.includes(normalizedSearch)
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "present"
            ? item.hasAttendanceToday
            : !item.hasAttendanceToday

      return matchesSearch && matchesStatus
    })
  }, [normalizedSearch, statusFilter, users])

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (a.hasAttendanceToday !== b.hasAttendanceToday) return a.hasAttendanceToday ? -1 : 1
      return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" })
    })
  }, [filteredUsers])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  )

  const todayKey = new Date().toLocaleDateString("en-CA")
  const presentCount = attendanceRecords.filter(
    (r) => (r.attendanceDate || getAttendanceDateKey(r.attendanceAt)) === todayKey
  ).length
  const missingCount = users.length - presentCount

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setPage(1)
  }

  const openCreate = (userToPrefill?: AttendanceUser) => {
    setPrefillUser(userToPrefill || null)
    setCreateOpen(true)
  }

  const handleScannerAttendance = async (scannedUserId: string) => {
    const response = await fetch("/api/data/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: scannedUserId, source: "scanner" }),
    })

    const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "Failed to create attendance record from scanner")
    }

    toast.success("Attendance logged from QR code")
    await loadData()
  }

  const handleDelete = async () => {
    if (!deleteRecord) return

    try {
      const response = await fetch("/api/data/attendance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId: deleteRecord.id }),
      })

      const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to delete attendance record")
      }

      toast.success("Attendance record deleted")
      setDeleteRecord(null)
      await loadData()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to delete attendance record")
    }
  }

  if (!user || !canView) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Track attendance records, create entries by email or userId, and export to Excel.
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
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={attendanceRecords.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} /> Export to Excel
          </button>
          <button
            type="button"
            onClick={() => openCreate()}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} /> New Entry
          </button>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode size={16} /> Scan QR
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
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name, email, course, userId, or attendance time"
                className="w-full rounded-lg border bg-foreground/10 px-10 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {sortedUsers.length} result{sortedUsers.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as "all" | "present" | "missing"); setPage(1) }}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All users</option>
              <option value="present">With attendance</option>
              <option value="missing">Missing attendance</option>
            </select>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-muted-foreground px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <FilterX size={16} /> Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-muted/20 px-3 py-1">{users.length} total users</span>
            <span className="rounded-full border bg-muted/20 px-3 py-1">{presentCount} attendance record{presentCount === 1 ? "" : "s"}</span>
            <span className="rounded-full border bg-muted/20 px-3 py-1">{missingCount} without attendance</span>
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
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Last Logged</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading attendance data...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.userId != null ? `User-${item.userId}` : item.attendanceKey}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.email || "No email on file"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-60 text-sm text-muted-foreground line-clamp-2">
                        {item.course || "No course on file"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.hasAttendanceToday ? (
                        <Badge variant="default" className="px-3 py-1 text-xs">Attendance logged today</Badge>
                      ) : (
                        <Badge variant="outline" className="px-3 py-1 text-xs">Missing today</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {item.latestAttendanceRecord ? formatDateTime(item.latestAttendanceRecord.attendanceAt) : "No attendance yet"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="ml-auto flex justify-end gap-2">
                        {item.hasAttendanceToday ? (
                          <button
                            type="button"
                            onClick={() => setDeleteRecord(item.attendanceRecord)}
                            disabled={!canEdit}
                            className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete attendance"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCreate(item)}
                            disabled={!canEdit}
                            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Log today
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No users matched your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>
                  <PaginationComponent
                    page={currentPage}
                    totalPages={totalPages}
                    setPage={setPage}
                    setItemsPerPage={setItemsPerPage}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        attendanceRecords={attendanceRecords}
        users={users}
      />

      <AttendanceUpsertDialog
        open={createOpen}
        mode="create"
        user={prefillUser}
        onOpenChange={(open) => { setCreateOpen(open); if (!open) setPrefillUser(null) }}
        onSaved={() => void loadData()}
      />

      <Dialog open={Boolean(deleteRecord)} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <DialogContent className="sm:max-w-lg bg-primary/40">
          <DialogHeader>
            <DialogTitle>Delete attendance record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-white/80">
            <p>Delete attendance for <span className="font-medium text-white">{deleteRecord?.fullName || "this user"}</span>?</p>
            <p>This action cannot be undone.</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteRecord(null)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttendanceScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanned={handleScannerAttendance}
      />
    </div>
  )
}
