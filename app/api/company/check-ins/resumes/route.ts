import { auth } from "@clerk/nextjs/server"
import { Collection } from "mongodb"
import { PassThrough, Readable } from "stream"
import { NextRequest, NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { canAccessManagementPath, type ManagementAccessMetadata } from "@/lib/management-access"

type MongoUserRecord = {
	_id: string
	userId?: string | number | null
	clerkId?: string
	firstName?: string
	lastName?: string
	email?: string
	portfolioLink?: string
	createdAt?: string
	updatedAt?: string
}

type CompanyRecord = {
	_id: string
	name?: string
}

type CompanyCheckInRecord = {
	_id?: string
	checkInKey?: string
	companyId?: string
	companyName?: string
	userId?: string | number | null
	clerkId?: string
	email?: string
	firstName?: string
	lastName?: string
	fullName?: string
	portfolioLink?: string
	checkInAt?: string
	createdAt?: string
	updatedAt?: string
}

function asString(value: unknown) {
	return value == null ? "" : String(value)
}

function getFullName(firstName?: string, lastName?: string, email?: string) {
	const name = `${firstName || ""} ${lastName || ""}`.trim()
	return name || email || "Unnamed user"
}

function getCheckInKey(user: MongoUserRecord) {
	return asString(user.userId || user.clerkId || user._id)
}

function isAuthorized(metadata: ManagementAccessMetadata | undefined) {
	return Boolean(metadata?.isAdmin) && canAccessManagementPath("/company/check-ins", metadata?.pageAccess ?? undefined, metadata?.adminRole, metadata?.assignedCompany)
}

function getCompanyScope(metadata: ManagementAccessMetadata | undefined, requestedCompanyId?: string) {
	const assignedCompany = asString(metadata?.assignedCompany).trim()
	const isSuperAdmin = metadata?.adminRole === "superadmin"
	const requested = asString(requestedCompanyId).trim()

	if (isSuperAdmin) {
		if (!requested || requested === "all") {
			return ""
		}

		return requested
	}

	if (!assignedCompany) {
		return ""
	}

	if (requested && requested !== assignedCompany) {
		return "__forbidden__"
	}

	return assignedCompany
}

function sanitizeFileName(value: string) {
	return value
		.replace(/[\\/:*?"<>|]+/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/[. ]+$/g, "")
}

function getFileExtensionFromUrl(resumeUrl: string, contentType?: string | null) {
	try {
		const parsedUrl = new URL(resumeUrl)
		const pathname = parsedUrl.pathname
		const lastSegment = pathname.split("/").pop() || ""
		const match = lastSegment.match(/\.[a-z0-9]+$/i)
		if (match?.[0]) {
			return match[0].toLowerCase()
		}
	} catch {
		// fall through to content type and default extension
	}

	const normalizedContentType = (contentType || "").toLowerCase()
	if (normalizedContentType.includes("pdf")) return ".pdf"
	if (normalizedContentType.includes("wordprocessingml")) return ".docx"
	if (normalizedContentType.includes("msword")) return ".doc"
	if (normalizedContentType.includes("zip")) return ".zip"
	if (normalizedContentType.includes("png")) return ".png"
	if (normalizedContentType.includes("jpeg") || normalizedContentType.includes("jpg")) return ".jpg"

	return ".pdf"
}

function resolveResumeUrl(value: string, requestUrl: string) {
	const trimmed = value.trim()
	if (!trimmed) return ""

	try {
		const parsedUrl = new URL(trimmed, requestUrl)
		if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
			return ""
		}

		return parsedUrl.toString()
	} catch {
		return ""
	}
}

async function fetchResumeBuffer(resumeUrl: string, requestUrl: string) {
	const resolvedUrl = resolveResumeUrl(resumeUrl, requestUrl)
	if (!resolvedUrl) return null

	const response = await fetch(resolvedUrl)
	if (!response.ok) return null

	const contentType = response.headers.get("content-type")
	const buffer = Buffer.from(await response.arrayBuffer())

	return {
		buffer,
		contentType,
		resolvedUrl,
	}
}

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
	try {
		const { sessionClaims, userId } = await auth()
		const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

		if (!userId || !isAuthorized(metadata)) {
			return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
		}

		const requestedCompanyId = request.nextUrl.searchParams.get("companyId") || ""
		const companyScope = getCompanyScope(metadata, requestedCompanyId)

		if (!companyScope && metadata?.adminRole !== "superadmin") {
			return NextResponse.json({ success: false, error: "Company access is required" }, { status: 403 })
		}

		if (companyScope === "__forbidden__") {
			return NextResponse.json({ success: false, error: "You can only view your assigned company" }, { status: 403 })
		}

		if (!companyScope) {
			return NextResponse.json({ success: false, error: "Select a company first" }, { status: 400 })
		}

		const client = await clientPromise
		const db = client.db(process.env.MONGODB_DATABASE)
		const usersCollection = db.collection("users") as Collection<MongoUserRecord>
		const companiesCollection = db.collection("companies") as Collection<CompanyRecord>
		const checkInsCollection = db.collection("companyCheckins") as Collection<CompanyCheckInRecord>

		const [company, users, checkIns] = await Promise.all([
			companiesCollection.findOne({ _id: companyScope }),
			usersCollection.find({}).toArray(),
			checkInsCollection.find({ companyId: companyScope }).sort({ checkInAt: -1, createdAt: -1 }).toArray(),
		])

		const companyName = company?.name || "Company"
		const companyFolderName = sanitizeFileName(companyName) || "company"

		const pass = new PassThrough()
		const ArchiverModule = await import("archiver")
		const ZipArchiveClass = (ArchiverModule as any).ZipArchive ?? (ArchiverModule as any).default?.ZipArchive
		if (!ZipArchiveClass) {
			throw new Error("Archiver ZipArchive class not found")
		}
		const archiveStream = new (ZipArchiveClass as any)({ zlib: { level: 6 } })
		archiveStream.on("error", (err: any) => {
			console.error("Archiver error:", err)
			pass.destroy(err)
		})
		archiveStream.pipe(pass)

		const usersByKey = new Map<string, MongoUserRecord>()
		users.forEach((user) => {
			const userKey = getCheckInKey(user)
			if (userKey) usersByKey.set(userKey, user)
			if (user.clerkId) usersByKey.set(user.clerkId, user)
			if (user.email) usersByKey.set(user.email.toLowerCase(), user)
		})

		const seenKeys = new Set<string>()
		const skippedResumes: string[] = []
		let addedCount = 0

		const concurrency = 12
		for (let i = 0; i < checkIns.length; i += concurrency) {
			const batch = checkIns.slice(i, i + concurrency)
			await Promise.all(
				batch.map(async (record) => {
					const checkInKey = asString(record.checkInKey || record.userId || record.clerkId)
					if (!checkInKey || seenKeys.has(checkInKey)) return
					seenKeys.add(checkInKey)

					const user = usersByKey.get(asString(record.userId)) || usersByKey.get(asString(record.clerkId)) || null
					const resumeUrl = asString(record.portfolioLink || user?.portfolioLink)
					if (!resumeUrl.trim()) {
						skippedResumes.push(`${getFullName(record.firstName || user?.firstName, record.lastName || user?.lastName, record.email || user?.email)} - no resume link`)
						return
					}

					try {
						const resp = await fetch(resumeUrl)
						if (!resp.ok) {
							skippedResumes.push(`${getFullName(record.firstName || user?.firstName, record.lastName || user?.lastName, record.email || user?.email)} - unavailable resume`)
							return
						}

						const contentType = resp.headers.get("content-type")
						const extension = getFileExtensionFromUrl(resumeUrl, contentType)
						const fullName = getFullName(record.firstName || user?.firstName, record.lastName || user?.lastName, record.email || user?.email)
						const email = asString(record.email || user?.email)
						const baseName = sanitizeFileName([fullName, email].filter(Boolean).join(" - ")) || `resume-${addedCount + 1}`
						const fileName = `${String(addedCount + 1).padStart(2, "0")} - ${baseName}${extension}`

						// convert web stream to node readable
						const nodeStream = (resp.body && (Readable as any).fromWeb) ? (Readable as any).fromWeb(resp.body) : null
						if (nodeStream) {
							archiveStream.append(nodeStream, { name: `${companyFolderName}/${fileName}` })
						} else {
							const arrayBuffer = await resp.arrayBuffer()
							archiveStream.append(Buffer.from(arrayBuffer), { name: `${companyFolderName}/${fileName}` })
						}
						addedCount += 1
					} catch (error) {
						console.error("Failed to fetch resume for archive:", error)
						skippedResumes.push(`${getFullName(record.firstName || user?.firstName, record.lastName || user?.lastName, record.email || user?.email)} - fetch failed`)
					}
				})
			)
		}

		if (addedCount === 0) {
			return NextResponse.json({ success: false, error: "No resumes found for this company" }, { status: 404 })
		}

		if (skippedResumes.length > 0) {
			archiveStream.append([
				"Some checked-in users did not have downloadable resumes.",
				"",
				...skippedResumes,
			].join("\n"), { name: `${companyFolderName}/missing-resumes.txt` })
		}

		archiveStream.finalize()

		const archiveName = `${companyFolderName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "company"}-resumes.zip`

		const webStream = (Readable as any).toWeb ? (Readable as any).toWeb(pass) : pass
		return new NextResponse(webStream, {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${archiveName}"`,
			},
		})
	} catch (error) {
		console.error("Failed to build resumes archive:", error)
		return NextResponse.json({ success: false, error: "Failed to build resumes archive" }, { status: 500 })
	}
}
