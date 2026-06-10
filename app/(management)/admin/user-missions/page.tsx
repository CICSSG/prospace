"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, ChevronDown, FilterX, PencilLine, RefreshCw, Search, X } from "lucide-react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { toast } from "sonner"
import * as XLSX from "xlsx"

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
import { getAdminUserMissionsData, updateAdminUserMissions } from "../actions"

type MissionOption = {
	id: string
	title: string
	description: string
	categoryId: string
	categoryName: string
	completionMethod: string
	requiredSignups?: number | null
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

const scannerConstraints: MediaTrackConstraints = {
	facingMode: { ideal: "environment" },
	width: { ideal: 1280 },
	height: { ideal: 720 },
	aspectRatio: 1,
}

function getFullName(user: Pick<UserMissionRecord, "firstName" | "lastName" | "email" | "userId">) {
	const name = `${user.firstName || ""} ${user.lastName || ""}`.trim()
	return name || user.email || `User-${user.userId ?? "unknown"}`
}

function getCompletionMethodLabel(method: string) {
	if (method === "qr-scanning") return "QR Scanning"
	if (method === "help-desk") return "Help Desk"
	if (method === "sign-up") return "Sign-up"
	return method || "Unspecified"
}

function formatUserId(userId: string | number | null) {
	return userId == null ? "" : `User-${userId}`
}

function formatExportDate(date = new Date()) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	return `${year}${month}${day}-${hours}${minutes}`
}

function buildFilteredMissionExportRows(users: UserMissionRecord[]) {
	const userRows = users.map((user) => ({
		userId: user.userId ?? "",
		fullName: user.fullName,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		course: user.course,
		shortBio: user.shortBio,
		completedCount: user.completedCount,
		completedMissionIds: user.completedMissionIds.join(", "),
		completedMissionsJson: JSON.stringify(user.completedMissions),
	}))

	const missionRows = users.flatMap((user) =>
		user.completedMissions.map((mission) => ({
			userId: user.userId ?? "",
			fullName: user.fullName,
			email: user.email,
			course: user.course,
			missionId: mission.missionId,
			missionTitle: mission.title,
			missionDescription: mission.description,
			categoryId: mission.categoryId,
			categoryName: mission.categoryName,
			completionMethod: mission.completionMethod,
			completedAt: mission.completedAt,
		}))
	)

	return { userRows, missionRows }
}

function getUserIdFromQrValue(rawValue: string) {
	try {
		const parsedUrl = new URL(rawValue, window.location.origin)
		return parsedUrl.searchParams.get("id")?.trim() || null
	} catch {
		return null
	}
}

function MissionMultiSelect({
	missions,
	selectedIds,
	onChange,
}: {
	missions: MissionOption[]
	selectedIds: Set<string>
	onChange: (ids: Set<string>) => void
}) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const handler = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [open])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		return q ? missions.filter((m) => m.title.toLowerCase().includes(q)) : missions
	}, [missions, search])

	const toggle = (id: string) => {
		const next = new Set(selectedIds)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		onChange(next)
	}

	const label = selectedIds.size === 0 ? "All missions" : `${selectedIds.size} mission${selectedIds.size === 1 ? "" : "s"} selected`

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
			>
				{label}
				<ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
			</button>

			{open && (
				<div className="absolute top-full left-0 z-20 mt-1 w-72 rounded-lg border bg-background shadow-lg">
					<div className="border-b p-2">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search missions…"
							className="w-full rounded border bg-muted/20 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>
					<div className="max-h-52 overflow-y-auto p-1">
						{filtered.length ? (
							filtered.map((m) => (
								<label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
									<input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggle(m.id)} className="accent-primary" />
									<span className="truncate">{m.title}</span>
								</label>
							))
						) : (
							<p className="px-2 py-3 text-sm text-muted-foreground">No missions found.</p>
						)}
					</div>
					{selectedIds.size > 0 && (
						<div className="border-t p-2">
							<button
								type="button"
								onClick={() => onChange(new Set())}
								className="w-full rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								Clear selection ({selectedIds.size})
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	)
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
			const data = await updateAdminUserMissions({
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
			<DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden p-0 sm:max-w-4xl bg-primary/40">
				<DialogHeader className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6">
					<DialogTitle className="text-base sm:text-lg">{user ? `Edit missions for ${user.fullName}` : "Edit user missions"}</DialogTitle>
				</DialogHeader>

				{user ? (
					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6">
						<div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
								<Badge variant="outline" className="border-white/15 text-white">
									{formatUserId(user.userId)}
								</Badge>
								<span className="truncate">{user.email || "No email on file"}</span>
							</div>
							<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/60">
								<span className="truncate">{user.course || "No course on file"}</span>
								<span>{draftMissionIds.length} of {missions.length} selected</span>
							</div>
						</div>

						<div className="shrink-0 space-y-2">
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
								<input
									type="text"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search missions…"
									className="w-full rounded-xl border border-white/10 bg-black/20 px-10 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
								/>
							</div>
							<div className="flex gap-2">
								<button type="button" onClick={() => setAllMissions(true)} className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15 sm:flex-none sm:px-4">
									Mark all
								</button>
								<button type="button" onClick={() => setAllMissions(false)} className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15 sm:flex-none sm:px-4">
									Clear all
								</button>
							</div>
						</div>

						<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
							{filteredMissions.length ? (
								filteredMissions.map((mission) => {
									const isCompleted = draftSet.has(mission.id)
									return (
										<div key={mission.id} className={`rounded-2xl border px-4 py-3 transition ${isCompleted ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-black/15"}`}>
											<div className="flex items-start gap-3">
												<button type="button" onClick={() => toggleMission(mission.id)} aria-label={`Toggle mission ${mission.title}`} className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-white/20 bg-transparent text-transparent hover:border-white/40"}`}>
													<span className="text-[10px] leading-none">✓</span>
												</button>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-white">{mission.title}</p>
													<div className="mt-1 flex flex-wrap gap-1.5">
														<Badge variant="outline" className="border-white/15 text-white/85 text-xs">{mission.categoryName}</Badge>
														<Badge variant="outline" className="border-white/15 text-white/85 text-xs">{getCompletionMethodLabel(mission.completionMethod)}</Badge>
													</div>
													{mission.description ? <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/60">{mission.description}</p> : null}
												</div>
											</div>
											<div className="mt-2.5 flex justify-end">
												<button type="button" onClick={() => toggleMission(mission.id)} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${isCompleted ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30" : "bg-white/10 text-white/80 hover:bg-white/15"}`}>
													{isCompleted ? "Take back" : "Mark complete"}
												</button>
											</div>
										</div>
									)
								})
							) : (
								<div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-6 text-sm text-white/65">No missions matched your search.</div>
							)}
						</div>

						<div className="shrink-0 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
							<button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10">Cancel</button>
							<button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}

export default function UserMissionsPage() {
	const { user, isLoaded } = useUser()
	const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
	const { canView, canEdit } = getManagementPageAccessState(metadata, "manage", ["/user-missions", "user-missions"])

	const [users, setUsers] = useState<UserMissionRecord[]>([])
	const [missions, setMissions] = useState<MissionOption[]>([])
	const [categories, setCategories] = useState<MissionCategoryOption[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState("")
	const [selectedCategoryId, setSelectedCategoryId] = useState("")
	const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set())
	const [selectedCompletionMethod, setSelectedCompletionMethod] = useState("")
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [activeUser, setActiveUser] = useState<UserMissionRecord | null>(null)
	const [lastUpdated, setLastUpdated] = useState<string | null>(null)
	const [scannerOpen, setScannerOpen] = useState(false)
	const [scannerMessage, setScannerMessage] = useState<string | null>(null)

	const loadData = async () => {
		setLoading(true)
		try {
			const data = await getAdminUserMissionsData()
			if (!data.success || !data.data) {
				throw new Error(data.error || "Failed to load user missions")
			}

			const response = data.data as UserMissionsResponse
			setUsers(Array.isArray(response.users) ? response.users : [])
			setMissions(Array.isArray(response.missions) ? response.missions : [])
			setCategories(Array.isArray(response.categories) ? response.categories : [])
			setLastUpdated(response.lastUpdated || null)
		} catch (error) {
			console.error("Failed to load user missions:", error)
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

	const missionsForFilter = useMemo(() => {
		// Only consider one non-default filter at a time (priority: mission > category > method).
		const activeFilter: "mission" | "category" | "method" | null = selectedMissionIds.size > 0
			? "mission"
			: selectedCategoryId
			? "category"
			: selectedCompletionMethod
			? "method"
			: null

		const baseUsers = sortedUsers.filter((userMission) => {
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
			const matchesCompletionMethod = !selectedCompletionMethod || userMission.completedMissions.some((mission) => mission.completionMethod === selectedCompletionMethod)
			const matchesMission = selectedMissionIds.size === 0 || [...selectedMissionIds].some((id) => userMission.completedMissionIds.includes(id))

			if (activeFilter === "mission") return matchesSearch && matchesMission
			if (activeFilter === "category") return matchesSearch && matchesCategory
			if (activeFilter === "method") return matchesSearch && matchesCompletionMethod

			// no specific active filter: respect all filters (original behavior)
			return matchesSearch && matchesCategory && matchesCompletionMethod && matchesMission
		})

		const ids = new Set<string>()

		if (activeFilter === "mission") {
			for (const id of selectedMissionIds) ids.add(id)
		} else if (activeFilter === "category") {
			for (const u of baseUsers) {
				for (const m of u.completedMissions) {
					if (m && m.missionId && m.categoryId === selectedCategoryId) ids.add(m.missionId)
				}
			}
		} else if (activeFilter === "method") {
			for (const u of baseUsers) {
				for (const m of u.completedMissions) {
					if (m && m.missionId && m.completionMethod === selectedCompletionMethod) ids.add(m.missionId)
				}
			}
		} else {
			for (const u of baseUsers) {
				for (const m of u.completedMissions) {
					if (m && m.missionId) ids.add(m.missionId)
				}
			}
		}

		return ids
	}, [sortedUsers, normalizedSearch, selectedCategoryId, selectedCompletionMethod, selectedMissionIds])

	const filteredUsers = useMemo(() => {
		const activeFilter: "mission" | "category" | "method" | null = selectedMissionIds.size > 0
			? "mission"
			: selectedCategoryId
			? "category"
			: selectedCompletionMethod
			? "method"
			: null

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
			const matchesMission = selectedMissionIds.size === 0 || [...selectedMissionIds].some((id) => userMission.completedMissionIds.includes(id))
			const matchesCompletionMethod = !selectedCompletionMethod || userMission.completedMissions.some((mission) => mission.completionMethod === selectedCompletionMethod)

			if (activeFilter === "mission") return matchesSearch && matchesMission
			if (activeFilter === "category") return matchesSearch && matchesCategory
			if (activeFilter === "method") return matchesSearch && matchesCompletionMethod

			return matchesSearch && matchesCategory && matchesMission && matchesCompletionMethod
		})
	}, [normalizedSearch, selectedCategoryId, selectedCompletionMethod, selectedMissionIds, sortedUsers])

	const missionsForSelect = useMemo(() => {
		if (!missions || missions.length === 0) return []
		return missions.filter((m) => {
			if (!m || !m.id) return false
			if (selectedMissionIds.has(m.id)) return true
			if (missionsForFilter.size === 0) return true
			return missionsForFilter.has(m.id)
		})
	}, [missions, missionsForFilter, selectedMissionIds])

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
		setSelectedMissionIds(new Set())
		setSelectedCompletionMethod("")
		setPage(1)
	}

	const handleSearchChange = (value: string) => {
		setSearch(value)
		setPage(1)
	}

	const openUserMissionEditorById = (userId: string) => {
		const normalizedUserId = userId.trim()
		if (!normalizedUserId) {
			toast.error("Scanned QR code did not include a user id")
			return
		}

		const matchedUser = users.find((user) => String(user.userId ?? "") === normalizedUserId)
		if (!matchedUser) {
			toast.error(`No user found for id ${normalizedUserId}`)
			return
		}

		const matchedPage = Math.max(1, Math.ceil((filteredUsers.findIndex((user) => user.id === matchedUser.id) + 1) / itemsPerPage))
		setPage(matchedPage)
		setActiveUser(matchedUser)
	}

	const handleScannerScan = (detectedCodes: any) => {
		const rawValue = detectedCodes?.[0]?.rawValue
		if (!rawValue) return

		const userId = getUserIdFromQrValue(String(rawValue))
		setScannerOpen(false)
		setScannerMessage(null)

		if (!userId) {
			toast.error("Scanned QR code did not contain a valid user id")
			return
		}

		openUserMissionEditorById(userId)
	}

	const handleScannerError = (error: unknown) => {
		const message = error instanceof Error ? error.message : "Camera access was blocked or unavailable."
		setScannerMessage(
			message.includes("permission") || message.includes("secure context")
				? "Allow camera access in your browser, then reopen the scanner. If you denied access earlier, enable Camera permissions in browser settings."
				: "Camera could not start on this device. Make sure you are using HTTPS and allow camera access."
		)
		console.error("Scanner error:", error)
	}

	const handleExportExcel = () => {
		if (!filteredUsers.length) {
			toast.error("No filtered user missions to export")
			return
		}

		try {
			const { userRows, missionRows } = buildFilteredMissionExportRows(filteredUsers)
			const workbook = XLSX.utils.book_new()
			const userSheet = XLSX.utils.json_to_sheet(userRows)
			const missionSheet = XLSX.utils.json_to_sheet(missionRows)

			XLSX.utils.book_append_sheet(workbook, userSheet, "Filtered Users")
			XLSX.utils.book_append_sheet(workbook, missionSheet, "Filtered Missions")

			const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
			const blob = new Blob([output], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			})
			const url = URL.createObjectURL(blob)
			const link = document.createElement("a")
			link.href = url
			link.download = `user-missions-${formatExportDate()}.xlsx`
			document.body.appendChild(link)
			link.click()
			link.remove()
			URL.revokeObjectURL(url)

			toast.success(`Exported ${filteredUsers.length} filtered user${filteredUsers.length === 1 ? "" : "s"}`)
		} catch (error) {
			console.error("Failed to export user missions:", error)
			toast.error(error instanceof Error ? error.message : "Failed to export user missions")
		}
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
					<div className="mb-2 inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Admin workspace</div>
					<h1 className="text-2xl font-semibold">User Missions Management</h1>
					<p className="text-sm text-muted-foreground">Review completed missions, search users, and edit mission completion status.</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => {
							setScannerMessage(null)
							setScannerOpen(true)
						}}
						className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
					>
						<Camera size={16} />
						Scanner
					</button>
					<button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
						Export Excel
					</button>
					<button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
						<RefreshCw size={16} /> Refresh
					</button>
				</div>
			</div>

			{scannerOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
					<button
						type="button"
						aria-label="Close scanner"
						onClick={() => {
							setScannerOpen(false)
							setScannerMessage(null)
						}}
						className="absolute top-4 right-4 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
					>
						<X size={18} />
					</button>

					{scannerMessage ? (
						<div className="absolute top-16 right-4 left-4 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm sm:top-4 sm:right-4 sm:left-auto sm:max-w-sm">
							{scannerMessage}
						</div>
					) : null}

					<div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-sm">
						<Scanner
							onScan={handleScannerScan}
							onError={handleScannerError}
							constraints={scannerConstraints}
							components={{ finder: true }}
							sound={false}
						/>
					</div>
				</div>
			) : null}

			<section className="rounded-2xl border bg-card p-4 shadow-sm">
				<div className="mb-4 space-y-3">
					<div className="grid gap-3 lg:grid-cols-[1fr_auto]">
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<input type="text" value={search} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search by user, email, course, or mission title" className="w-full rounded-lg border bg-foreground/10 px-10 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
						</div>

						<div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
							{filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<select value={selectedCategoryId} onChange={(event) => { setSelectedCategoryId(event.target.value); setPage(1) }} className="rounded-lg border bg-background px-3 py-2 text-sm">
							<option value="">All categories</option>
							{activeCategories.map((category) => (
								<option key={category.id} value={category.id}>{category.categoryName}</option>
							))}
						</select>

						<MissionMultiSelect
							missions={missions}
							selectedIds={selectedMissionIds}
							onChange={(ids) => { setSelectedMissionIds(ids); setPage(1) }}
						/>

						<select value={selectedCompletionMethod} onChange={(event) => { setSelectedCompletionMethod(event.target.value); setPage(1) }} className="rounded-lg border bg-background px-3 py-2 text-sm">
							<option value="">All completion methods</option>
							<option value="qr-scanning">QR Scanning</option>
							<option value="help-desk">Help Desk</option>
							<option value="sign-up">Sign-up</option>
						</select>

						{(search || selectedCategoryId || selectedMissionIds.size > 0 || selectedCompletionMethod) ? (
							<button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-muted-foreground px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
								<FilterX size={16} /> Clear filters
							</button>
						) : null}
					</div>

					<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
						<span className="rounded-full border bg-muted/20 px-3 py-1">{users.length} user{users.length === 1 ? "" : "s"} with completed missions</span>
						<span className="rounded-full border bg-muted/20 px-3 py-1">{missions.length} mission{missions.length === 1 ? "" : "s"} in catalog</span>
						{lastUpdated ? <span className="rounded-full border bg-muted/20 px-3 py-1">Last updated {new Date(lastUpdated).toLocaleString()}</span> : null}
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
								<TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Loading user missions...</TableCell></TableRow>
							) : paginatedUsers.length > 0 ? (
								paginatedUsers.map((record) => (
									<TableRow key={`${record.id}-${record.userId ?? "unknown"}`}>
										<TableCell>
											<div className="space-y-1">
												<div className="font-medium">{record.fullName}</div>
												<div className="text-xs text-muted-foreground">{formatUserId(record.userId)}</div>
											</div>
										</TableCell>
										<TableCell><Badge variant="default" className="px-3 py-1 text-xs">{record.completedCount} completed</Badge></TableCell>
										<TableCell>
											<div className="flex max-w-136 flex-wrap gap-2">
												{(() => {
													const badgesToShow = record.completedMissions.filter((mission) => {
														if (!mission || !mission.missionId) return false
														// include if mission id is in the computed set for the current table filters
														if (missionsForFilter.size === 0) return true
														if (missionsForFilter.has(mission.missionId)) return true
														// also include selected missions so they stay visible in badges
														if (selectedMissionIds.has(mission.missionId)) return true
														return false
													})

													const shown = badgesToShow.slice(0, 3)
													return (
														<>
															{shown.map((mission) => (
																<Badge key={mission.missionId} variant="outline" className="max-w-full border-muted-foreground/30 text-xs"><span className="max-w-44 truncate">{mission.title}</span></Badge>
															))}
															{badgesToShow.length > shown.length ? <Badge variant="outline" className="border-muted-foreground/30 text-xs">+{badgesToShow.length - shown.length} more</Badge> : null}
														</>
													)
												})()}
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1 text-sm text-muted-foreground">
												<div className="truncate">{record.email || "No email on file"}</div>
												<div className="truncate">{record.course || "No course on file"}</div>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<button type="button" disabled={!canEdit} onClick={() => setActiveUser(record)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
												<PencilLine size={16} /> Edit missions
											</button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No matching users with completed missions were found.</TableCell></TableRow>
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
    