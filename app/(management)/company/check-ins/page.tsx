"use client"

import { useUser } from "@clerk/nextjs"
import * as XLSX from "xlsx"
import { Download, Plus, QrCode, RefreshCw, Search, Trash2 } from "lucide-react"
import { Scanner } from "@yudiel/react-qr-scanner"
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
import { Input } from "@/components/ui/input"
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { getManagementPageAccessState, type ManagementAccessMetadata } from "@/lib/management-access"

type CheckInRecord = {
	id: string
	companyId: string
	companyName: string
	checkInKey: string
	userId: string | number | null
	clerkId: string
	email: string
	firstName: string
	lastName: string
	fullName: string
	course: string
	shortBio: string
	portfolioLink: string
	socialLinks: string[]
	checkInAt: string
	checkInDate: string
	checkInTime: string
	source: "manual" | "scanner"
	createdAt: string
	updatedAt: string
}

type CompanyOption = {
	id: string
	name: string
}

type CheckInsResponse = {
	company: CompanyOption | null
	companies: CompanyOption[]
	checkIns: CheckInRecord[]
	lastUpdated?: string
}

type CheckInPreviewUser = {
	id: string
	userId: string | number | null
	clerkId: string
	email: string
	firstName: string
	lastName: string
	fullName: string
	course: string
	shortBio: string
	portfolioLink: string
	socialLinks: string[]
}

type CheckInPreviewResponse = {
	company: CompanyOption | null
	user: CheckInPreviewUser
	existingCheckIn: CheckInRecord | null
}

const scannerConstraints: MediaTrackConstraints = {
	facingMode: { ideal: "environment" },
	width: { ideal: 1280 },
	height: { ideal: 720 },
	aspectRatio: 1,
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

function getUserProfileUrl(record: Pick<CheckInRecord, "userId" | "clerkId">) {
	const identifier = record.userId != null ? String(record.userId) : record.clerkId
	return identifier ? `/connect?id=${encodeURIComponent(identifier)}&type=user` : ""
}

function getResumeUrl(record: Pick<CheckInRecord, "portfolioLink">) {
	return record.portfolioLink?.trim() || ""
}

function formatExportDate(date = new Date()) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	return `${year}${month}${day}-${hours}${minutes}`
}

function buildCheckInExportRows(records: CheckInRecord[]) {
	return records.map((record) => ({
		id: record.id,
		companyId: record.companyId,
		companyName: record.companyName,
		checkInKey: record.checkInKey,
		userId: record.userId ?? "",
		clerkId: record.clerkId,
		firstName: record.firstName,
		lastName: record.lastName,
		fullName: record.fullName,
		email: record.email,
		course: record.course,
		shortBio: record.shortBio,
		portfolioLink: record.portfolioLink,
		socialLinks: Array.isArray(record.socialLinks) ? record.socialLinks.join(" | ") : "",
		checkInAt: record.checkInAt,
		checkInDate: record.checkInDate,
		checkInTime: record.checkInTime,
		source: record.source,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	}))
}

function CheckInProfileDialog({
	open,
	record,
	onOpenChange,
}: {
	open: boolean
	record: CheckInRecord | null
	onOpenChange: (open: boolean) => void
}) {
	const resumeUrl = record ? getResumeUrl(record) : ""

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl bg-primary/40">
				<DialogHeader>
					<DialogTitle>User profile</DialogTitle>
				</DialogHeader>

				{record ? (
					<div className="space-y-4 py-2">
						<div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
							<p>
								Name: <span className="font-medium text-white">{record.fullName || "Unknown"}</span>
							</p>
							<p className="mt-2">
								Email: <span className="font-medium text-white">{record.email || "Unknown"}</span>
							</p>
							<p className="mt-2">
								Course: <span className="font-medium text-white">{record.course || "No course"}</span>
							</p>
							<p className="mt-2">
								Check-in source: <span className="font-medium text-white">{record.source === "scanner" ? "Scanner" : "Manual"}</span>
							</p>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium text-white/90">Bio</p>
							<p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
								{record.shortBio || "No bio provided."}
							</p>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium text-white/90">Social links</p>
							<div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
								{record.socialLinks.length ? (
									record.socialLinks.map((link) => (
										<a key={link} href={link} target="_blank" rel="noreferrer" className="block break-all text-cyan-200 hover:underline">
											{link}
										</a>
									))
								) : (
									<p>No social links provided.</p>
								)}
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							{resumeUrl ? (
								<>
									<a href={resumeUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15">
										View resume
									</a>
									<a href={resumeUrl} download target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15">
										Download resume
									</a>
								</>
							) : (
								<span className="text-sm text-white/60">No resume uploaded.</span>
							)}
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
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

function CheckInScannerDialog({
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
		if (!open) {
			setScannerMessage(null)
		}
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
			setScannerMessage(error instanceof Error ? error.message : "Failed to create check-in from QR code.")
		}
	}

	const handleError = (error: unknown) => {
		const message = error instanceof Error ? error.message : "Camera access was blocked or unavailable."

		setScannerMessage(
			message.includes("permission") || message.includes("secure context")
				? "Allow camera access in Safari, then reopen the scanner."
				: "Camera could not start on this device. Make sure you are using HTTPS and allow camera access in Safari."
		)
		console.error("Scanner error:", error)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl bg-black/90 text-white">
				<DialogHeader>
					<DialogTitle>Scan check-in QR code</DialogTitle>
				</DialogHeader>

				<div className="relative min-h-96 overflow-hidden rounded-2xl border border-white/10 bg-black">
					{scannerMessage && (
						<div className="absolute top-4 left-4 right-4 z-10 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm">
							{scannerMessage}
						</div>
					)}
					<Scanner onScan={handleScan} onError={handleError} constraints={scannerConstraints} components={{ finder: true }} sound={false} />
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

function CheckInLookupDialog({
	open,
	preview,
	onOpenChange,
	onLookup,
	onConfirm,
	onResetPreview,
	companyLabel,
	canConfirm,
	lookupLoading,
	confirmLoading,
}: {
	open: boolean
	preview: CheckInPreviewResponse | null
	onOpenChange: (open: boolean) => void
	onLookup: (identifier: string) => Promise<void>
	onConfirm: (identifier: string) => Promise<void>
	onResetPreview: () => void
	companyLabel: string
	canConfirm: boolean
	lookupLoading: boolean
	confirmLoading: boolean
}) {
	const [identifier, setIdentifier] = useState("")

	useEffect(() => {
		if (!open) {
			setIdentifier("")
			return
		}

		if (!preview) {
			setIdentifier("")
		}
	}, [open, preview])

	useEffect(() => {
		if (!open || !preview) return
		setIdentifier(preview.user.email || preview.user.userId != null ? String(preview.user.userId ?? preview.user.email) : "")
	}, [open, preview])

	const isPreviewMode = Boolean(preview)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl bg-primary/40">
				<DialogHeader>
					<DialogTitle>{isPreviewMode ? "Confirm check-in" : "New check-in"}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{!isPreviewMode ? (
						<>
							<p className="text-sm text-white/75">Enter the user&apos;s email or userId to verify the user before checking them in.</p>
							<div className="space-y-2">
								<label className="text-sm text-white/80">Email or userId</label>
								<Input
									value={identifier}
									onChange={(event) => setIdentifier(event.target.value)}
									placeholder="user@example.com or 123"
									className="bg-white/10 text-white placeholder:text-white/40"
								/>
							</div>
						</>
					) : (
						<>
							<div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
								<p>
									Company: <span className="font-medium text-white">{companyLabel}</span>
								</p>
								<p className="mt-2">
									User: <span className="font-medium text-white">{preview?.user.fullName || "Unknown"}</span>
								</p>
								<p className="mt-2">
									Email: <span className="font-medium text-white">{preview?.user.email || "Unknown"}</span>
								</p>
								<p className="mt-2">
									Course: <span className="font-medium text-white">{preview?.user.course || "No course"}</span>
								</p>
							</div>
							{preview?.existingCheckIn ? (
								<div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
									This user has already checked in for this company.
								</div>
							) : null}
						</>
					)}
				</div>

				<DialogFooter className="gap-2 sm:justify-end">
					{isPreviewMode ? (
						<>
							<button
								type="button"
								onClick={onResetPreview}
								className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
							>
								Back
							</button>
							<button
								type="button"
								onClick={() => void onConfirm(identifier.trim())}
								disabled={confirmLoading || !canConfirm || Boolean(preview?.existingCheckIn)}
								className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
							>
								{confirmLoading ? "Checking in..." : "Confirm check-in"}
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void onLookup(identifier.trim())}
								disabled={lookupLoading || !canConfirm}
								className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
							>
								{lookupLoading ? "Looking up..." : "Check user"}
							</button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function CheckInEditor({
	open,
	record,
	onOpenChange,
	onSaved,
}: {
	open: boolean
	record: CheckInRecord | null
	onOpenChange: (open: boolean) => void
	onSaved: () => void
}) {
	const [checkInAt, setCheckInAt] = useState("")
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		setCheckInAt(record?.checkInAt ? toDateTimeLocal(record.checkInAt) : "")
	}, [open, record])

	const handleSave = async () => {
		if (!record) return

		setSaving(true)
		try {
			const response = await fetch("/api/company/check-ins", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					checkInId: record.id,
					checkInAt: checkInAt ? fromDateTimeLocal(checkInAt) : undefined,
				}),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.success) {
				throw new Error(data?.error || "Failed to update check-in")
			}

			toast.success("Check-in updated")
			onOpenChange(false)
			onSaved()
		} catch (error) {
			console.error("Failed to update check-in:", error)
			toast.error(error instanceof Error ? error.message : "Failed to update check-in")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-primary/40 sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit check-in</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
						<p>
							User: <span className="font-medium text-white">{record?.fullName || "Unknown"}</span>
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-white/80">Check-in date and time</label>
						<Input
							type="datetime-local"
							value={checkInAt}
							onChange={(event) => setCheckInAt(event.target.value)}
							className="bg-white/10 text-white placeholder:text-white/40"
						/>
					</div>
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
						{saving ? "Saving..." : "Save changes"}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default function CompanyCheckInsPage() {
	const { user } = useUser()
	const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
	const assignedCompanyId = metadata?.assignedCompany?.trim() || ""
	const { canView, canEdit } = getManagementPageAccessState(metadata, "company", ["/company/check-ins", "company/check-ins"])
	const isSuperAdmin = metadata?.adminRole === "superadmin"

	const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
	const [companies, setCompanies] = useState<CompanyOption[]>([])
	const [selectedCompanyId, setSelectedCompanyId] = useState("")
	const [lastUpdated, setLastUpdated] = useState("")
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState("")
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [page, setPage] = useState(1)
	const [manualOpen, setManualOpen] = useState(false)
	const [manualPreview, setManualPreview] = useState<CheckInPreviewResponse | null>(null)
	const [lookupLoading, setLookupLoading] = useState(false)
	const [confirmLoading, setConfirmLoading] = useState(false)
	const [scannerOpen, setScannerOpen] = useState(false)
	const [profileRecord, setProfileRecord] = useState<CheckInRecord | null>(null)
	const [editRecord, setEditRecord] = useState<CheckInRecord | null>(null)
	const resolvedSelectedCompanyId = isSuperAdmin ? selectedCompanyId : selectedCompanyId || assignedCompanyId
	const selectedCompanyScope = isSuperAdmin
		? resolvedSelectedCompanyId || "all"
		: selectedCompanyId || assignedCompanyId || "all"
	const selectedCompanyForActions = resolvedSelectedCompanyId

	const loadCheckIns = async (companyId = resolvedSelectedCompanyId) => {
		setLoading(true)
		try {
			const queryCompanyId = companyId === "all" ? "" : companyId
			const query = queryCompanyId ? `?companyId=${encodeURIComponent(queryCompanyId)}` : ""
			const response = await fetch(`/api/company/check-ins${query}`)
			const data = await response.json().catch(() => null)

			if (!response.ok || !data?.success) {
				throw new Error(data?.error || "Failed to fetch company check-ins")
			}

			const payload = data.data as CheckInsResponse
			setCheckIns(Array.isArray(payload.checkIns) ? payload.checkIns : [])
			setCompanies(Array.isArray(payload.companies) ? payload.companies : [])
			setLastUpdated(payload.lastUpdated || "")

			if (!companyId && !selectedCompanyId && !isSuperAdmin && payload.company?.id) {
				setSelectedCompanyId(payload.company.id)
			}
		} catch (error) {
			console.error("Failed to load company check-ins:", error)
			toast.error(error instanceof Error ? error.message : "Failed to load company check-ins")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadCheckIns(selectedCompanyScope)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCompanyScope])

	useEffect(() => {
		setPage(1)
	}, [search, selectedCompanyId])

	const filteredCheckIns = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase()
		return checkIns.filter((record) => {
			if (!normalizedSearch) return true

			const searchBlob = [
				record.companyName,
				record.fullName,
				record.email,
				record.course,
				record.checkInDate,
				record.checkInTime,
				record.source,
			]
				.join(" ")
				.toLowerCase()

			return searchBlob.includes(normalizedSearch)
		})
	}, [checkIns, search])

	const totalPages = Math.max(1, Math.ceil(filteredCheckIns.length / itemsPerPage))
	const paginatedCheckIns = filteredCheckIns.slice((page - 1) * itemsPerPage, page * itemsPerPage)

	const selectedCompanyLabel = useMemo(() => {
		if (selectedCompanyScope === "all") return "All companies"
		if (!selectedCompanyId) return "Assigned company"
		return companies.find((company) => company.id === selectedCompanyId)?.name || "Selected company"
	}, [companies, selectedCompanyId, selectedCompanyScope])

	const hasDownloadableResumes = useMemo(() => checkIns.some((record) => Boolean(getResumeUrl(record))), [checkIns])
	const downloadResumesUrl = selectedCompanyForActions
		? `/api/company/check-ins/resumes?companyId=${encodeURIComponent(selectedCompanyForActions)}`
		: ""

	const canUseActionButtons = canEdit && (!isSuperAdmin || Boolean(resolvedSelectedCompanyId))
	const canExportCheckIns = canEdit

	const handleExportExcel = () => {
		if (!canExportCheckIns) {
			toast.error("You do not have permission to export check-ins")
			return
		}

		if (!checkIns.length) {
			toast.error("No check-ins available to export")
			return
		}

		try {
			const workbook = XLSX.utils.book_new()
			const worksheet = XLSX.utils.json_to_sheet(buildCheckInExportRows(checkIns))
			const scopeLabel = selectedCompanyScope === "all" ? "all-companies" : (selectedCompanyLabel || "selected-company").toLowerCase().replace(/[^a-z0-9]+/g, "-")

			XLSX.utils.book_append_sheet(workbook, worksheet, "Check-ins")

			const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
			const blob = new Blob([output], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			})
			const url = URL.createObjectURL(blob)
			const link = document.createElement("a")
			link.href = url
			link.download = `check-ins-${scopeLabel}-${formatExportDate()}.xlsx`
			document.body.appendChild(link)
			link.click()
			link.remove()
			URL.revokeObjectURL(url)

			toast.success(`Exported ${checkIns.length} check-in${checkIns.length === 1 ? "" : "s"}`)
		} catch (error) {
			console.error("Failed to export check-ins:", error)
			toast.error(error instanceof Error ? error.message : "Failed to export check-ins")
		}
	}

	const openManualCheckIn = () => {
		if (!canUseActionButtons) {
			toast.error(isSuperAdmin ? "Select a company first" : "You do not have permission to create check-ins")
			return
		}

		setManualPreview(null)
		setManualOpen(true)
	}

	const handleManualLookup = async (identifier: string) => {
		if (!identifier.trim()) {
			toast.error("Email or userId is required")
			return
		}

		if (!selectedCompanyForActions) {
			toast.error("Select a company first")
			return
		}

		setLookupLoading(true)
		try {
			const response = await fetch("/api/company/check-ins", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mode: "preview",
					identifier: identifier.trim(),
					companyId: selectedCompanyForActions,
				}),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.success) {
				throw new Error(data?.error || "Failed to look up user")
			}

			setManualPreview(data.data as CheckInPreviewResponse)
		} catch (error) {
			console.error("Failed to look up user:", error)
			toast.error(error instanceof Error ? error.message : "Failed to look up user")
		} finally {
			setLookupLoading(false)
		}
	}

	const handleManualConfirm = async (identifier: string) => {
		if (!selectedCompanyForActions) {
			toast.error("Select a company first")
			return
		}

		setConfirmLoading(true)
		try {
			const response = await fetch("/api/company/check-ins", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mode: "checkin",
					identifier: identifier.trim(),
					source: "manual",
					companyId: selectedCompanyForActions,
				}),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.success) {
				throw new Error(data?.error || "Failed to create check-in")
			}

			toast.success("Check-in created")
			setManualOpen(false)
			setManualPreview(null)
			await loadCheckIns(selectedCompanyScope)
		} catch (error) {
			console.error("Failed to create check-in:", error)
			toast.error(error instanceof Error ? error.message : "Failed to create check-in")
		} finally {
			setConfirmLoading(false)
		}
	}

	const handleScannerCheckIn = async (scannedUserId: string) => {
		if (!selectedCompanyForActions) {
			throw new Error("Select a company first")
		}

		const response = await fetch("/api/company/check-ins", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				mode: "checkin",
				identifier: scannedUserId,
				source: "scanner",
				companyId: selectedCompanyForActions,
			}),
		})

		const data = await response.json().catch(() => null)
		if (!response.ok || !data?.success) {
			throw new Error(data?.error || "Failed to create check-in from scanner")
		}

		toast.success("Check-in logged from QR code")
		setScannerOpen(false)
		await loadCheckIns(selectedCompanyScope)
	}

	const handleDelete = async (record: CheckInRecord) => {
		const confirmed = window.confirm(`Delete the check-in for ${record.fullName || record.email || "this user"}?`)
		if (!confirmed) return

		try {
			const response = await fetch("/api/company/check-ins", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ checkInId: record.id }),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.success) {
				throw new Error(data?.error || "Failed to delete check-in")
			}

			toast.success("Check-in deleted")
			await loadCheckIns(selectedCompanyId)
		} catch (error) {
			console.error("Failed to delete check-in:", error)
			toast.error(error instanceof Error ? error.message : "Failed to delete check-in")
		}
	}

	if (!canView) {
		return (
			<div className="p-6">
				<div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white/80">
					You do not have access to this page.
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Company Check-ins</h1>
					<p className="text-sm text-muted-foreground">Review and manage company check-ins from one place.</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={handleExportExcel}
						disabled={!canExportCheckIns || !checkIns.length}
						className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-foreground hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
						title={
							isSuperAdmin
								? selectedCompanyScope === "all"
									? "Export all check-ins currently loaded"
									: `Export check-ins for ${selectedCompanyLabel}`
								: `Export check-ins for ${selectedCompanyLabel}`
						}
					>
						<Download className="size-4" />
						Export Excel
					</button>
					<button
						type="button"
						onClick={() => {
							if (!downloadResumesUrl) {
								toast.error(isSuperAdmin ? "Select a company first" : "No company selected")
								return
							}

							window.location.href = downloadResumesUrl
						}}
						disabled={!downloadResumesUrl || !hasDownloadableResumes}
						className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-foreground hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
						title={!hasDownloadableResumes ? "No resumes are available for this company" : "Download all resumes"}
					>
						<Download className="size-4" />
						Download all resumes
					</button>

					{(isSuperAdmin || !assignedCompanyId) && (
						<select
							value={selectedCompanyScope}
							onChange={(event) => setSelectedCompanyId(event.target.value === "all" ? "" : event.target.value)}
							className="h-10 min-w-52 rounded-lg border border-input bg-transparent px-3 text-sm *:text-black"
						>
							<option value="all">All companies</option>
							{companies.map((company) => (
								<option key={company.id} value={company.id}>
									{company.name}
								</option>
							))}
						</select>
					)}

					<button
						type="button"
						onClick={() => void loadCheckIns(selectedCompanyScope)}
						className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-foreground hover:bg-white/15"
					>
						<RefreshCw className="size-4" />
						Refresh
					</button>
				</div>
			</div>

			<div className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm xl:grid-cols-[1.2fr_1fr]">
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold">New check-in</h2>
							<p className="text-sm text-muted-foreground">Use QR scanning or manual lookup before confirming a check-in.</p>
						</div>
						<Badge variant="outline">{selectedCompanyLabel}</Badge>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<button
							type="button"
							onClick={openManualCheckIn}
							disabled={!canUseActionButtons}
							className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Plus className="size-4" />
							Manual check-in
						</button>
						<button
							type="button"
							onClick={() => setScannerOpen(true)}
							disabled={!canUseActionButtons}
							className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-foreground hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<QrCode className="size-4" />
							Scan QR code
						</button>
					</div>
				</div>

				<div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold">Search</h2>
							<p className="text-sm text-muted-foreground">Filter by company, name, email, course, or date.</p>
						</div>
						<Badge variant="outline">{filteredCheckIns.length} records</Badge>
					</div>

					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search check-ins"
							className="pl-9"
						/>
					</div>

					<div className="text-sm text-muted-foreground">
						Last updated: {lastUpdated ? formatDateTime(lastUpdated) : "Never"}
					</div>
				</div>
			</div>

			<CheckInLookupDialog
				open={manualOpen}
				preview={manualPreview}
				onOpenChange={(open) => {
					setManualOpen(open)
					if (!open) setManualPreview(null)
				}}
						onLookup={handleManualLookup}
						onConfirm={handleManualConfirm}
				onResetPreview={() => setManualPreview(null)}
				companyLabel={selectedCompanyLabel}
				canConfirm={Boolean(selectedCompanyForActions)}
				lookupLoading={lookupLoading}
				confirmLoading={confirmLoading}
			/>

			<CheckInScannerDialog
				open={scannerOpen}
				onOpenChange={setScannerOpen}
				onScanned={handleScannerCheckIn}
			/>

			<CheckInProfileDialog
				open={Boolean(profileRecord)}
				record={profileRecord}
				onOpenChange={(open) => {
					if (!open) setProfileRecord(null)
				}}
			/>

			<div className="rounded-2xl border bg-card p-4 shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Checked in</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
									Loading check-ins...
								</TableCell>
							</TableRow>
						) : paginatedCheckIns.length ? (
							paginatedCheckIns.map((record) => (
								<TableRow key={record.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium">{record.fullName || "Unnamed user"}</div>
											<div className="text-xs text-muted-foreground">
												{record.course || "No course"}{record.checkInKey ? ` • ${record.checkInKey}` : ""}
											</div>
										</div>
									</TableCell>
									<TableCell>{record.email || "-"}</TableCell>
									<TableCell>
										<div className="space-y-1 text-sm">
											<div>{formatDateTime(record.checkInAt)}</div>
											<div className="text-xs text-muted-foreground">{record.checkInDate || "No date"}</div>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap justify-end gap-2">
												<button
													type="button"
													onClick={() => setProfileRecord(record)}
													className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
												>
													View profile
												</button>
											{getResumeUrl(record) ? (
												<>
													<a
														href={getResumeUrl(record)}
														target="_blank"
														rel="noreferrer"
														className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
													>
														View resume
													</a>
													<a
														href={getResumeUrl(record)}
														download
														target="_blank"
														rel="noreferrer"
														className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
													>
														Download resume
													</a>
												</>
											) : null}
											{isSuperAdmin && (
												<>
													<button
														type="button"
														onClick={() => setEditRecord(record)}
														className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
													>
														Edit
													</button>
													<button
														type="button"
														onClick={() => void handleDelete(record)}
														className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/20"
													>
														<Trash2 className="size-4" />
														
													</button>
												</>
											)}
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
									No check-ins found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={6}>
								<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
									<div className="text-sm text-muted-foreground">
										Showing {paginatedCheckIns.length} of {filteredCheckIns.length} records
									</div>
									<PaginationComponent
										setItemsPerPage={setItemsPerPage}
										setPage={setPage}
										page={page}
										totalPages={totalPages}
									/>
								</div>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>

			<CheckInEditor
				open={Boolean(editRecord)}
				record={editRecord}
				onOpenChange={(open) => {
					if (!open) setEditRecord(null)
				}}
				onSaved={() => void loadCheckIns(selectedCompanyScope)}
			/>
		</div>
	)
}