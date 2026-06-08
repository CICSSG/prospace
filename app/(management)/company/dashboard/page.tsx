"use client"

import { useUser } from "@clerk/nextjs"
import { upload } from "@vercel/blob/client"
import { Building2, CalendarDays, Link2, Loader2, RefreshCw, Save, ShieldCheck, Users2, Trash2, Plus } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAssignedCompanyIds, getManagementPageAccessState, type ManagementAccessMetadata } from "@/lib/management-access"

type SocialLink = {
	platform: string
	url: string
}

type CompanyRecord = {
	id: string
	imageUrl: string
	name: string
	logoUrl: string
	socialLinks: SocialLink[]
	companyEmail: string
	moderatorEmails: string[]
	description: string
	companyId?: number
	createdAt: string
	updatedAt: string
}

type RecentCheckIn = {
	id: string
	fullName: string
	email: string
	course: string
	checkInAt: string
	checkInDate: string
	checkInTime: string
	source: "manual" | "scanner"
	portfolioLink: string
	companyName: string
}

type DashboardResponse = {
	company: CompanyRecord | null
	stats: {
		totalCheckIns: number
		resumeCount: number
		connectedUsers: number
		moderatorCount: number
		socialLinkCount: number
	}
	recentCheckIns: RecentCheckIn[]
	availableCompanies: Array<{ id: string; name: string }>
	selectedCompanyId: string
	canEdit: boolean
}

type CompanyFormState = {
	imageUrl: string
	name: string
	logoUrl: string
	socialLinks: SocialLink[]
	companyEmail: string
	moderatorEmails: string[]
	description: string
}

const emptySocialLink = (): SocialLink => ({ platform: "", url: "" })

const emptyForm = (): CompanyFormState => ({
	imageUrl: "",
	name: "",
	logoUrl: "",
	socialLinks: [emptySocialLink()],
	companyEmail: "",
	moderatorEmails: [""],
	description: "",
})

const MAX_UPLOAD_BYTES = Math.floor(4.5 * 1024 * 1024)

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

function createForm(company?: CompanyRecord | null): CompanyFormState {
	if (!company) return emptyForm()

	return {
		imageUrl: company.imageUrl || "",
		name: company.name || "",
		logoUrl: company.logoUrl || "",
		socialLinks: company.socialLinks?.length > 0 ? company.socialLinks : [emptySocialLink()],
		companyEmail: company.companyEmail || "",
		moderatorEmails: company.moderatorEmails?.length > 0 ? company.moderatorEmails : [""],
		description: company.description || "",
	}
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

async function uploadImageToBlobStorage(file: File, filename: string) {
	return upload(filename, file, {
		access: "public",
		handleUploadUrl: "/api/logo-loop/upload",
	})
}

export default function CompanyDashboardPage() {
	const { user } = useUser()
	const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined
	const assignedCompanyId = metadata?.assignedCompany?.trim() || ""
	const assignedCompanyList = getAssignedCompanyIds(metadata)
	const isSuperAdmin = metadata?.adminRole === "superadmin"
	const isMultiCompany = !isSuperAdmin && assignedCompanyList.length > 1
	const { canEdit } = getManagementPageAccessState(metadata, "company", ["/company/dashboard", "company/dashboard"])

	const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [selectedCompanyId, setSelectedCompanyId] = useState("")
	const [form, setForm] = useState<CompanyFormState>(() => emptyForm())
	const imageInputRef = useRef<HTMLInputElement>(null)
	const logoInputRef = useRef<HTMLInputElement>(null)

	const resolvedSelectedCompanyId = isSuperAdmin ? selectedCompanyId : selectedCompanyId || assignedCompanyId

	const loadDashboard = async (companyId = resolvedSelectedCompanyId) => {
		setLoading(true)
		try {
			const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""
			const response = await fetch(`/api/company/dashboard${query}`)
			const data = await response.json().catch(() => null)

			if (!response.ok || !data?.success) {
				throw new Error(data?.error || "Failed to load company dashboard")
			}

			const payload = data.data as DashboardResponse
			setDashboard(payload)
			setForm(createForm(payload.company))

			if (!companyId && payload.selectedCompanyId) {
				setSelectedCompanyId(payload.selectedCompanyId)
			}
		} catch (error) {
			console.error("Failed to load company dashboard:", error)
			toast.error(error instanceof Error ? error.message : "Failed to load company dashboard")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadDashboard(resolvedSelectedCompanyId)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resolvedSelectedCompanyId])

	useEffect(() => {
		if (!dashboard?.company) return
		setForm(createForm(dashboard.company))
	}, [dashboard?.company])

	const updateSocialLink = (index: number, key: keyof SocialLink, value: string) => {
		setForm((current) => ({
			...current,
			socialLinks: current.socialLinks.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [key]: value } : item
			),
		}))
	}

	const addSocialLink = () => {
		setForm((current) => ({ ...current, socialLinks: [...current.socialLinks, emptySocialLink()] }))
	}

	const removeSocialLink = (index: number) => {
		setForm((current) => {
			const nextLinks = current.socialLinks.filter((_, itemIndex) => itemIndex !== index)
			return { ...current, socialLinks: nextLinks.length > 0 ? nextLinks : [emptySocialLink()] }
		})
	}

	const updateModeratorEmail = (index: number, value: string) => {
		setForm((current) => ({
			...current,
			moderatorEmails: current.moderatorEmails.map((email, itemIndex) =>
				itemIndex === index ? value : email
			),
		}))
	}

	const addModeratorEmail = () => {
		setForm((current) => ({ ...current, moderatorEmails: [...current.moderatorEmails, ""] }))
	}

	const removeModeratorEmail = (index: number) => {
		setForm((current) => {
			const nextEmails = current.moderatorEmails.filter((_, itemIndex) => itemIndex !== index)
			return { ...current, moderatorEmails: nextEmails.length > 0 ? nextEmails : [""] }
		})
	}

	const companyNameForUploads = form.name || dashboard?.company?.name || "company"

	const handleImageUpload = async (file: File) => {
		if (file.size > MAX_UPLOAD_BYTES) {
			toast.error("Image must be 4.5MB or smaller")
			return
		}

		try {
			const blob = await uploadImageToBlobStorage(file, `companies/${slugify(companyNameForUploads)}/image`)
			setForm((current) => ({ ...current, imageUrl: blob.url }))
			toast.success("Company image uploaded")
		} catch (error) {
			console.error("Failed to upload company image:", error)
			toast.error(error instanceof Error ? error.message : "Failed to upload company image")
		} finally {
			if (imageInputRef.current) imageInputRef.current.value = ""
		}
	}

	const handleLogoUpload = async (file: File) => {
		if (file.size > MAX_UPLOAD_BYTES) {
			toast.error("Logo must be 4.5MB or smaller")
			return
		}

		try {
			const blob = await uploadImageToBlobStorage(file, `companies/${slugify(companyNameForUploads)}/logo`)
			setForm((current) => ({ ...current, logoUrl: blob.url }))
			toast.success("Company logo uploaded")
		} catch (error) {
			console.error("Failed to upload company logo:", error)
			toast.error(error instanceof Error ? error.message : "Failed to upload company logo")
		} finally {
			if (logoInputRef.current) logoInputRef.current.value = ""
		}
	}

	const handleSave = async () => {
		if (!dashboard?.company) return

		setSaving(true)
		try {
			const response = await fetch("/api/updateCompany", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: dashboard.company.id,
					imageUrl: form.imageUrl.trim(),
					name: form.name.trim(),
					logoUrl: form.logoUrl.trim(),
					socialLinks: form.socialLinks.filter((link) => link.platform.trim() || link.url.trim()),
					companyEmail: form.companyEmail.trim(),
					moderatorEmails: form.moderatorEmails.map((email) => email.trim()).filter(Boolean),
					description: form.description.trim(),
				}),
			})

			const data = await response.json().catch(() => null)
			if (!response.ok || !data?.success) {
				throw new Error(data?.message || "Failed to update company")
			}

			toast.success("Company updated")
			await loadDashboard(selectedCompanyId)
		} catch (error) {
			console.error("Failed to update company:", error)
			toast.error(error instanceof Error ? error.message : "Failed to update company")
		} finally {
			setSaving(false)
		}
	}

	const statCards = useMemo(
		() => [
			{ label: "Check-ins", value: dashboard?.stats.totalCheckIns ?? 0, icon: CalendarDays },
			{ label: "Resumes", value: dashboard?.stats.resumeCount ?? 0, icon: Link2 },
			{ label: "Connections", value: dashboard?.stats.connectedUsers ?? 0, icon: Users2 },
			{ label: "Moderators", value: dashboard?.stats.moderatorCount ?? 0, icon: ShieldCheck },
		],
		[dashboard]
	)

	if (loading && !dashboard) {
		return (
			<div className="flex w-full min-w-0 flex-col gap-4 p-4">
				<div className="rounded-2xl border bg-card p-6 shadow-sm">
					<div className="h-6 w-40 animate-pulse rounded bg-muted" />
					<div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted/70" />
				</div>
			</div>
		)
	}

	if (!dashboard?.company) {
		return (
			<div className="flex w-full min-w-0 flex-col gap-4 p-4">
				<div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
					Company dashboard could not be loaded.
				</div>
			</div>
		)
	}

	return (
		<div className="flex w-full min-w-0 flex-col gap-4 p-4">
			<div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Company Dashboard</p>
					<h1 className="text-2xl font-semibold">{dashboard.company.name}</h1>
					<p className="text-sm text-muted-foreground">View company activity and update your public company profile in one place.</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{(isSuperAdmin || isMultiCompany) && dashboard.availableCompanies.length > 0 ? (
						<select
							value={resolvedSelectedCompanyId || dashboard.selectedCompanyId}
							onChange={(event) => setSelectedCompanyId(event.target.value)}
							className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm sm:min-w-56 sm:w-auto *:text-black"
						>
							{dashboard.availableCompanies.map((company) => (
								<option key={company.id} value={company.id}>
									{company.name}
								</option>
							))}
						</select>
					) : null}

					<button
						type="button"
						onClick={() => void loadDashboard(resolvedSelectedCompanyId)}
						className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-foreground hover:bg-white/15"
					>
						<RefreshCw className="size-4" />
						Refresh
					</button>
				</div>
			</div>

			<div className="grid min-w-0 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
				<div className="min-w-0 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{statCards.map((card) => {
							const Icon = card.icon
							return (
								<div key={card.label} className="rounded-2xl border bg-card p-4 shadow-sm">
									<div className="flex items-center justify-between text-sm text-muted-foreground">
										<span>{card.label}</span>
										<Icon className="size-4" />
									</div>
									<div className="mt-3 text-3xl font-semibold">{card.value}</div>
								</div>
							)
						})}
					</div>

					<div className="rounded-2xl border bg-card p-4 shadow-sm">
						<div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center">
							<div className="relative h-32 w-full max-w-full overflow-hidden rounded-2xl border bg-muted md:h-36 md:w-52 md:max-w-52">
								{dashboard.company.logoUrl ? (
									<Image src={dashboard.company.logoUrl} alt={`${dashboard.company.name} logo`} fill className="object-contain p-4" />
								) : (
									<div className="flex h-full items-center justify-center text-sm text-muted-foreground">No logo</div>
								)}
							</div>
							<div className="min-w-0 space-y-4">
								<div>
									<Badge variant="outline">{assignedCompanyId ? "Assigned company" : "Selected company"}: {dashboard.company.id.slice(0, 8)}</Badge>
									<p className="mt-3 wrap-break-word text-sm text-muted-foreground">{dashboard.company.description || "No company description provided."}</p>
								</div>
								<div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap">
									<span className="break-all rounded-full border px-3 py-1">Email: {dashboard.company.companyEmail || "-"}</span>
									<span className="rounded-full border px-3 py-1">Social links: {dashboard.stats.socialLinkCount}</span>
									<span className="rounded-full border px-3 py-1">Updated: {formatDateTime(dashboard.company.updatedAt)}</span>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border bg-card p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-between gap-2">
							<div>
								<h2 className="text-lg font-semibold">Recent check-ins</h2>
								<p className="text-sm text-muted-foreground">Latest users checked in to this company.</p>
							</div>
							<Badge variant="outline">{dashboard.stats.totalCheckIns} total</Badge>
						</div>

						<div className="w-full overflow-x-auto">
							<Table className="min-w-160">
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Course</TableHead>
									<TableHead>Checked in</TableHead>
									<TableHead className="text-right">Resume</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{dashboard.recentCheckIns.length ? (
									dashboard.recentCheckIns.map((record) => (
										<TableRow key={record.id}>
											<TableCell>
												<div className="space-y-1">
													<div className="font-medium">{record.fullName || "Unnamed user"}</div>
													<div className="text-xs text-muted-foreground">{record.email || "No email"}</div>
												</div>
											</TableCell>
											<TableCell>{record.course || "-"}</TableCell>
											<TableCell>
												<div className="space-y-1 text-sm">
													<div>{formatDateTime(record.checkInAt)}</div>
													<div className="text-xs text-muted-foreground">{record.source === "scanner" ? "Scanner" : "Manual"}</div>
												</div>
											</TableCell>
											<TableCell className="text-right">
												{record.portfolioLink ? (
													<a href={record.portfolioLink} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
														View resume
													</a>
												) : (
													<span className="text-sm text-muted-foreground">No resume</span>
												)}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
											No check-ins yet.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
							</Table>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="rounded-2xl border bg-card p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-between gap-2">
							<div>
								<h2 className="text-lg font-semibold">Company details</h2>
								<p className="text-sm text-muted-foreground">Review the company profile, moderators, and public links.</p>
							</div>
							<Badge variant="outline">{dashboard.stats.connectedUsers} connections</Badge>
						</div>

						<div className="space-y-3 text-sm">
							<p className="wrap-break-word"><span className="font-medium">Moderators:</span> {dashboard.company.moderatorEmails.length ? dashboard.company.moderatorEmails.join(", ") : "No moderators assigned"}</p>
							<div className="space-y-2">
								<p className="font-medium">Social links</p>
								<div className="space-y-2">
									{dashboard.company.socialLinks.length ? dashboard.company.socialLinks.map((link) => (
										<div key={`${link.platform}-${link.url}`} className="rounded-xl border px-3 py-2">
											<div className="font-medium">{link.platform || "Link"}</div>
											<a href={link.url} target="_blank" rel="noreferrer" className="break-all text-primary underline-offset-4 hover:underline">
												{link.url}
											</a>
										</div>
									)) : <p className="text-muted-foreground">No links provided.</p>}
								</div>
							</div>
						</div>
					</div>

					{canEdit ? (
						<div className="rounded-2xl border bg-card p-4 shadow-sm">
							<div className="mb-4 flex items-center justify-between gap-2">
								<div>
									<h2 className="text-lg font-semibold">Edit company</h2>
									<p className="text-sm text-muted-foreground">Update the assigned company profile. Moderator email changes will sync to Clerk.</p>
								</div>
								{saving ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
							</div>

							<div className="space-y-4">
								<div className="grid gap-3">
									<label className="text-sm font-medium">Company name</label>
									<Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
								</div>
								<div className="grid gap-3">
									<label className="text-sm font-medium">Company email</label>
									<Input value={form.companyEmail} onChange={(event) => setForm((current) => ({ ...current, companyEmail: event.target.value }))} />
								</div>
								<div className="grid gap-3">
									<label className="text-sm font-medium">Description</label>
									<textarea
										value={form.description}
										onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
										className="min-h-28 rounded-lg border bg-background px-3 py-2 text-sm"
									/>
								</div>
								<div className="grid gap-3">
									<label className="text-sm font-medium">Image</label>
									<div className="space-y-2 rounded-lg border bg-background p-3">
										<input
											ref={imageInputRef}
											type="file"
											accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
											className="w-full text-sm"
											onChange={(event) => {
												const file = event.target.files?.[0]
												if (file) void handleImageUpload(file)
											}}
										/>
										<p className="text-xs text-muted-foreground">Maximum 4.5MB.</p>
										{form.imageUrl ? <p className="break-all text-xs text-muted-foreground">{form.imageUrl}</p> : null}
									</div>
								</div>
								<div className="grid gap-3">
									<label className="text-sm font-medium">Logo</label>
									<div className="space-y-2 rounded-lg border bg-background p-3">
										<input
											ref={logoInputRef}
											type="file"
											accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
											className="w-full text-sm"
											onChange={(event) => {
												const file = event.target.files?.[0]
												if (file) void handleLogoUpload(file)
											}}
										/>
										<p className="text-xs text-muted-foreground">Maximum 4.5MB.</p>
										{form.logoUrl ? <p className="break-all text-xs text-muted-foreground">{form.logoUrl}</p> : null}
									</div>
								</div>

								<div className="space-y-3 rounded-xl border bg-muted/20 p-3">
									<div className="flex items-center justify-between gap-2">
										<div>
											<p className="text-sm font-medium">Social Links</p>
											<p className="text-xs text-muted-foreground">Add the company&apos;s public profiles.</p>
										</div>
										<button type="button" onClick={addSocialLink} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
											<Plus className="size-4" /> Add link
										</button>
									</div>

									<div className="space-y-3">
										{form.socialLinks.map((link, index) => (
											<div key={index} className="space-y-2 rounded-lg border bg-background p-3">
												<div className="flex flex-col gap-2 sm:flex-row">
													<Input value={link.platform} onChange={(event) => updateSocialLink(index, "platform", event.target.value)} placeholder="Platform" className="min-w-0" />
													<button type="button" onClick={() => removeSocialLink(index)} className="inline-flex items-center justify-center rounded-lg border border-destructive/40 px-3 py-2 text-destructive hover:bg-destructive hover:text-white sm:self-start">
														<Trash2 className="size-4" />
													</button>
												</div>
												<Input value={link.url} onChange={(event) => updateSocialLink(index, "url", event.target.value)} placeholder="https://..." className="min-w-0" />
											</div>
										))}
									</div>
								</div>

								<div className="space-y-3 rounded-xl border bg-muted/20 p-3">
									<div className="flex items-center justify-between gap-2">
										<div>
											<p className="text-sm font-medium">Moderator Emails</p>
											<p className="text-xs text-muted-foreground">These will create or update Clerk company moderators.</p>
										</div>
										<button type="button" onClick={addModeratorEmail} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
											<Plus className="size-4" /> Add email
										</button>
									</div>

									<div className="space-y-3">
										{form.moderatorEmails.map((email, index) => (
											<div key={index} className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row">
												<Input value={email} onChange={(event) => updateModeratorEmail(index, event.target.value)} placeholder="moderator@example.com" className="min-w-0" />
												<button type="button" onClick={() => removeModeratorEmail(index)} className="inline-flex items-center justify-center rounded-lg border border-destructive/40 px-3 py-2 text-destructive hover:bg-destructive hover:text-white sm:self-start">
													<Trash2 className="size-4" />
												</button>
											</div>
										))}
									</div>
								</div>

								<div className="flex justify-end gap-2">
									<button type="button" onClick={() => loadDashboard(resolvedSelectedCompanyId)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
										Cancel
									</button>
									<button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
										<Save className="size-4" />
										{saving ? "Saving..." : "Save changes"}
									</button>
								</div>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}
