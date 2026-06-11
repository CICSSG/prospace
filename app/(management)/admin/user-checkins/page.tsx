"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useMemo, useState } from "react"
import { Camera, FilterX, PencilLine, RefreshCw, Search, X } from "lucide-react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { toast } from "sonner"

import { PaginationComponent } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import {
	Dialog,
	DialogContent,
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
import {
	getAdminUserCheckInsData,
	updateAdminUserCheckIns,
	type UserCheckInRecord,
	type UserCheckInsResponse,
} from "../actions"

type CompanyOption = { id: string; name: string }

type CheckInCompanySummary = UserCheckInRecord["checkedInCompanies"][number]

function formatDateTime(value: string) {
	if (!value) return ""
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ""
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

function getSourceLabel(source: string) {
	return source === "scanner" ? "Scanner" : "Manual"
}

function formatUserId(userId: string | number | null) {
	return userId == null ? "" : `User-${userId}`
}

const scannerConstraints: MediaTrackConstraints = {
	facingMode: { ideal: "environment" },
	width: { ideal: 1280 },
	height: { ideal: 720 },
	aspectRatio: 1,
}

function getUserIdFromQrValue(rawValue: string) {
	try {
		const parsedUrl = new URL(rawValue, window.location.origin)
		return parsedUrl.searchParams.get("id")?.trim() || null
	} catch {
		return null
	}
}

// ── Company Check-in Editor Dialog ────────────────────────────────────────────

function UserCheckInEditorDialog({
	open,
	user,
	companies,
	onOpenChange,
	onSaved,
}: {
	open: boolean
	user: UserCheckInRecord | null
	companies: CompanyOption[]
	onOpenChange: (open: boolean) => void
	onSaved: () => void
}) {
	const [saving, setSaving] = useState(false)
	const [search, setSearch] = useState("")
	const [draftCompanyIds, setDraftCompanyIds] = useState<string[]>([])

	useEffect(() => {
		if (!open || !user) return
		setSearch("")
		setDraftCompanyIds(user.checkedInCompanyIds)
	}, [open, user])

	const draftSet = useMemo(() => new Set(draftCompanyIds), [draftCompanyIds])

	const existingByCompanyId = useMemo(() => {
		if (!user) return new Map<string, CheckInCompanySummary>()
		return new Map(user.checkedInCompanies.map((c) => [c.companyId, c]))
	}, [user])

	const filteredCompanies = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return companies
		return companies.filter((c) => c.name.toLowerCase().includes(q))
	}, [companies, search])

	const toggleCompany = (companyId: string) => {
		setDraftCompanyIds((current) =>
			current.includes(companyId) ? current.filter((id) => id !== companyId) : [...current, companyId]
		)
	}

	const setAllCompanies = (checked: boolean) => {
		setDraftCompanyIds(checked ? companies.map((c) => c.id) : [])
	}

	const handleSave = async () => {
		if (!user) return
		setSaving(true)
		try {
			const result = await updateAdminUserCheckIns({
				userMongoId: user.id,
				companyIds: draftCompanyIds,
			})

			if (!result.success) {
				throw new Error(result.error || "Failed to update check-ins")
			}

			const { added = 0, removed = 0 } = result.data ?? {}
			const parts: string[] = []
			if (added > 0) parts.push(`${added} added`)
			if (removed > 0) parts.push(`${removed} removed`)
			toast.success(parts.length ? `Check-ins updated: ${parts.join(", ")}` : "No changes made")
			onOpenChange(false)
			onSaved()
		} catch (error) {
			console.error("Failed to update user check-ins:", error)
			toast.error(error instanceof Error ? error.message : "Failed to update check-ins")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden p-0 sm:max-w-2xl bg-primary/40">
				<DialogHeader className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6">
					<DialogTitle className="text-base sm:text-lg">
						{user ? `Edit check-ins for ${user.fullName}` : "Edit user check-ins"}
					</DialogTitle>
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
								<span>{draftCompanyIds.length} of {companies.length} companies selected</span>
							</div>
						</div>

						<div className="shrink-0 space-y-2">
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
								<input
									type="text"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search companies…"
									className="w-full rounded-xl border border-white/10 bg-black/20 px-10 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
								/>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setAllCompanies(true)}
									className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15 sm:flex-none sm:px-4"
								>
									Check all
								</button>
								<button
									type="button"
									onClick={() => setAllCompanies(false)}
									className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15 sm:flex-none sm:px-4"
								>
									Clear all
								</button>
							</div>
						</div>

						<div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
							{filteredCompanies.length ? (
								filteredCompanies.map((company) => {
									const isCheckedIn = draftSet.has(company.id)
									const existing = existingByCompanyId.get(company.id)
									return (
										<div
											key={company.id}
											className={`rounded-2xl border px-4 py-3 transition ${isCheckedIn ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-black/15"}`}
										>
											<div className="flex items-start gap-3">
												<button
													type="button"
													onClick={() => toggleCompany(company.id)}
													aria-label={`Toggle ${company.name}`}
													className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${isCheckedIn ? "border-primary bg-primary text-primary-foreground" : "border-white/20 bg-transparent text-transparent hover:border-white/40"}`}
												>
													<span className="text-[10px] leading-none">✓</span>
												</button>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-white">{company.name}</p>
													{isCheckedIn && existing ? (
														<p className="mt-0.5 text-xs text-emerald-300/80">
															{formatDateTime(existing.checkInAt)} · {getSourceLabel(existing.source)}
														</p>
													) : isCheckedIn ? (
														<p className="mt-0.5 text-xs text-emerald-300/60">Will be checked in on save</p>
													) : null}
												</div>
											</div>
											<div className="mt-2.5 flex justify-end">
												<button
													type="button"
													onClick={() => toggleCompany(company.id)}
													className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${isCheckedIn ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30" : "bg-white/10 text-white/80 hover:bg-white/15"}`}
												>
													{isCheckedIn ? "Remove check-in" : "Check in"}
												</button>
											</div>
										</div>
									)
								})
							) : (
								<div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-6 text-sm text-white/65">
									No companies matched your search.
								</div>
							)}
						</div>

						<div className="shrink-0 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void handleSave()}
								disabled={saving}
								className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? "Saving..." : "Save changes"}
							</button>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UserCheckInsPage() {
	const { user, isLoaded } = useUser()
	const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
	const { canView, canEdit } = getManagementPageAccessState(metadata, "manage", ["/user-checkins", "user-checkins"])

	const [users, setUsers] = useState<UserCheckInRecord[]>([])
	const [companies, setCompanies] = useState<CompanyOption[]>([])
	const [loading, setLoading] = useState(true)
	const [lastUpdated, setLastUpdated] = useState<string | null>(null)
	const [search, setSearch] = useState("")
	const [filterCompanyId, setFilterCompanyId] = useState("")
	const [onlyWithCheckIns, setOnlyWithCheckIns] = useState(false)
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [activeUser, setActiveUser] = useState<UserCheckInRecord | null>(null)
	const [scannerOpen, setScannerOpen] = useState(false)
	const [scannerMessage, setScannerMessage] = useState<string | null>(null)

	const openEditorById = (userId: string) => {
		const normalizedUserId = userId.trim()
		if (!normalizedUserId) {
			toast.error("Scanned QR code did not include a user id")
			return
		}
		const matchedUser = users.find((u) => String(u.userId ?? "") === normalizedUserId)
		if (!matchedUser) {
			toast.error(`No user found for id ${normalizedUserId}`)
			return
		}
		const matchedPage = Math.max(1, Math.ceil((filteredUsers.findIndex((u) => u.id === matchedUser.id) + 1) / itemsPerPage))
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
		openEditorById(userId)
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

	const loadData = async () => {
		setLoading(true)
		try {
			const result = await getAdminUserCheckInsData()
			if (!result.success || !result.data) {
				throw new Error(result.error || "Failed to load check-ins")
			}
			const payload = result.data as UserCheckInsResponse
			setUsers(Array.isArray(payload.users) ? payload.users : [])
			setCompanies(Array.isArray(payload.companies) ? payload.companies : [])
			setLastUpdated(payload.lastUpdated || null)
		} catch (error) {
			console.error("Failed to load user check-ins:", error)
			toast.error(error instanceof Error ? error.message : "Failed to load user check-ins")
			setUsers([])
			setCompanies([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!isLoaded) return
		if (!canView) return
		void loadData()
	}, [canView, isLoaded])

	const normalizedSearch = search.trim().toLowerCase()

	const filteredUsers = useMemo(() => {
		return users.filter((u) => {
			if (onlyWithCheckIns && u.checkInCount === 0) return false

			if (filterCompanyId && !u.checkedInCompanyIds.includes(filterCompanyId)) return false

			if (normalizedSearch) {
				const blob = [u.fullName, u.email, u.course, String(u.userId ?? "")].join(" ").toLowerCase()
				if (!blob.includes(normalizedSearch)) return false
			}

			return true
		})
	}, [users, normalizedSearch, filterCompanyId, onlyWithCheckIns])

	const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
	const currentPage = Math.min(page, totalPages)
	const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

	const usersWithCheckIns = useMemo(() => users.filter((u) => u.checkInCount > 0).length, [users])

	const resetFilters = () => {
		setSearch("")
		setFilterCompanyId("")
		setOnlyWithCheckIns(false)
		setPage(1)
	}

	const hasActiveFilters = Boolean(search || filterCompanyId || onlyWithCheckIns)

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
					<div className="mb-2 inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
						Admin workspace
					</div>
					<h1 className="text-2xl font-semibold">User Check-ins</h1>
					<p className="text-sm text-muted-foreground">
						View and edit company check-ins per user. Add or remove check-ins in bulk.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => { setScannerMessage(null); setScannerOpen(true) }}
						className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
					>
						<Camera size={16} /> Scanner
					</button>
					<button
						type="button"
						onClick={() => void loadData()}
						className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
					>
						<RefreshCw size={16} /> Refresh
					</button>
				</div>
			</div>

			{scannerOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
					<button
						type="button"
						aria-label="Close scanner"
						onClick={() => { setScannerOpen(false); setScannerMessage(null) }}
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
							<input
								type="text"
								value={search}
								onChange={(e) => { setSearch(e.target.value); setPage(1) }}
								placeholder="Search by name, email, or course"
								className="w-full rounded-lg border bg-foreground/10 px-10 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
						<div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
							{filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<select
							value={filterCompanyId}
							onChange={(e) => { setFilterCompanyId(e.target.value); setPage(1) }}
							className="rounded-lg border bg-background px-3 py-2 text-sm"
						>
							<option value="">All companies</option>
							{companies.map((c) => (
								<option key={c.id} value={c.id}>{c.name}</option>
							))}
						</select>

						<button
							type="button"
							onClick={() => { setOnlyWithCheckIns((v) => !v); setPage(1) }}
							className={`rounded-lg border px-3 py-2 text-sm transition ${onlyWithCheckIns ? "border-primary bg-primary/20 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
						>
							With check-ins only
						</button>

						{hasActiveFilters && (
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
						<span className="rounded-full border bg-muted/20 px-3 py-1">{usersWithCheckIns} with check-ins</span>
						<span className="rounded-full border bg-muted/20 px-3 py-1">{companies.length} companies</span>
						{lastUpdated && (
							<span className="rounded-full border bg-muted/20 px-3 py-1">
								Last updated {new Date(lastUpdated).toLocaleString()}
							</span>
						)}
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border bg-background/70">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Check-ins</TableHead>
								<TableHead>Companies</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
										Loading user check-ins...
									</TableCell>
								</TableRow>
							) : paginatedUsers.length > 0 ? (
								paginatedUsers.map((record) => (
									<TableRow key={record.id}>
										<TableCell>
											<div className="space-y-1">
												<div className="font-medium">{record.fullName}</div>
												{record.userId != null && (
													<div className="text-xs text-muted-foreground">{formatUserId(record.userId)}</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1 text-sm text-muted-foreground">
												<div className="truncate max-w-48">{record.email || "No email"}</div>
												<div className="truncate max-w-48">{record.course || "No course"}</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={record.checkInCount > 0 ? "default" : "outline"}
												className="px-3 py-1 text-xs"
											>
												{record.checkInCount} check-in{record.checkInCount === 1 ? "" : "s"}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex max-w-72 flex-wrap gap-1.5">
												{record.checkedInCompanies.slice(0, 3).map((c) => (
													<Badge key={c.companyId} variant="outline" className="max-w-full border-muted-foreground/30 text-xs">
														<span className="max-w-32 truncate">{c.companyName}</span>
													</Badge>
												))}
												{record.checkedInCompanies.length > 3 && (
													<Badge variant="outline" className="border-muted-foreground/30 text-xs">
														+{record.checkedInCompanies.length - 3} more
													</Badge>
												)}
												{record.checkedInCompanies.length === 0 && (
													<span className="text-xs text-muted-foreground">None</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<button
												type="button"
												disabled={!canEdit}
												onClick={() => setActiveUser(record)}
												className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
											>
												<PencilLine size={16} /> Edit check-ins
											</button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
										No users found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="mt-4">
					<PaginationComponent
						page={currentPage}
						totalPages={totalPages}
						setPage={setPage}
						setItemsPerPage={setItemsPerPage}
					/>
				</div>
			</section>

			<UserCheckInEditorDialog
				open={Boolean(activeUser)}
				user={activeUser}
				companies={companies}
				onOpenChange={(open) => { if (!open) setActiveUser(null) }}
				onSaved={() => void loadData()}
			/>
		</div>
	)
}
