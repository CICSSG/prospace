import { auth } from "@clerk/nextjs/server"
import { Collection, ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import clientPromise from "@/lib/mongodb"
import { getManagementPageAccessState, type ManagementAccessMetadata } from "@/lib/management-access"

type CompanyRecord = {
	_id: string | ObjectId
	name?: string
	imageUrl?: string
	logoUrl?: string
	socialLinks?: Array<{ platform?: string; url?: string }>
	companyEmail?: string
	moderatorEmails?: string[]
	description?: string
	companyId?: number
	createdAt?: string
	updatedAt?: string
}

type CompanyCheckInRecord = {
	_id?: string | ObjectId
	companyId?: string
	companyName?: string
	checkInKey?: string
	userId?: string | number | null
	clerkId?: string
	email?: string
	firstName?: string
	lastName?: string
	fullName?: string
	course?: string
	portfolioLink?: string
	socialLinks?: string[]
	checkInAt?: string
	checkInDate?: string
	checkInTime?: string
	source?: "manual" | "scanner"
}

type ConnectRecord = {
	_id?: string | ObjectId
	user_id?: string
	user_connect?: string
	type?: string
}

function asString(value: unknown) {
	return value == null ? "" : String(value)
}

function isAuthorized(metadata: ManagementAccessMetadata | undefined) {
	return Boolean(metadata?.isAdmin)
}

function getCompanyObjectId(companyId: string) {
	return ObjectId.isValid(companyId) ? new ObjectId(companyId) : null
}

function toRecentCheckIn(record: CompanyCheckInRecord) {
	return {
		id: asString(record._id),
		companyId: record.companyId || "",
		companyName: record.companyName || "",
		checkInKey: record.checkInKey || "",
		userId: record.userId ?? null,
		clerkId: record.clerkId || "",
		email: record.email || "",
		firstName: record.firstName || "",
		lastName: record.lastName || "",
		fullName: record.fullName || `${record.firstName || ""} ${record.lastName || ""}`.trim() || record.email || "Unnamed user",
		course: record.course || "",
		portfolioLink: record.portfolioLink || "",
		socialLinks: Array.isArray(record.socialLinks) ? record.socialLinks : [],
		checkInAt: record.checkInAt || "",
		checkInDate: record.checkInDate || "",
		checkInTime: record.checkInTime || "",
		source: record.source || "manual",
	}
}

export async function GET(request: NextRequest) {
	try {
		const { sessionClaims, userId } = await auth()
		const metadata = sessionClaims?.publicMetadata as ManagementAccessMetadata | undefined

		if (!userId || !isAuthorized(metadata) || !getManagementPageAccessState(metadata, "company", ["/company/dashboard", "company/dashboard"]).canView) {
			return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
		}

		const requestedCompanyId = request.nextUrl.searchParams.get("companyId") || ""
		const isSuperAdmin = metadata?.adminRole === "superadmin"
		const assignedCompany = asString(metadata?.assignedCompany).trim()
		const requestedScope = asString(requestedCompanyId).trim()

		const client = await clientPromise
		const db = client.db(process.env.MONGODB_DATABASE)
		const companiesCollection = db.collection("companies") as Collection<CompanyRecord>
		const checkInsCollection = db.collection("companyCheckins") as Collection<CompanyCheckInRecord>
		const connectCollection = db.collection("connect") as Collection<ConnectRecord>
		const canBrowseCompanies = isSuperAdmin || (!assignedCompany && getManagementPageAccessState(metadata, "company", ["/company/dashboard", "company/dashboard"]).canView)
		const availableCompanies = canBrowseCompanies
			? await companiesCollection.find({}).sort({ name: 1 }).toArray()
			: []

		let companyScope = ""

		if (isSuperAdmin) {
			companyScope = requestedScope || assignedCompany || asString(availableCompanies[0]?._id)
		} else if (assignedCompany) {
			companyScope = requestedScope && requestedScope !== assignedCompany ? "__forbidden__" : assignedCompany
		} else {
			companyScope = requestedScope || asString(availableCompanies[0]?._id)
		}

		if (!companyScope) {
			return NextResponse.json({ success: false, error: "Company access is required" }, { status: 403 })
		}

		if (companyScope === "__forbidden__") {
			return NextResponse.json({ success: false, error: "You can only view your assigned company" }, { status: 403 })
		}

		const companyObjectId = getCompanyObjectId(companyScope)

		const companyQuery = companyObjectId ? { _id: companyObjectId } : { _id: companyScope }
		const [company, recentCheckIns, companyConnections] = await Promise.all([
			companiesCollection.findOne(companyQuery),
			checkInsCollection.find({ companyId: companyScope }).sort({ checkInAt: -1, createdAt: -1 }).limit(8).toArray(),
			connectCollection.find({ user_connect: companyScope, type: "company" }).toArray(),
		])

		if (!company) {
			return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 })
		}

		const totalCheckIns = await checkInsCollection.countDocuments({ companyId: companyScope })
		const resumeCount = await checkInsCollection.countDocuments({
			companyId: companyScope,
			portfolioLink: { $exists: true, $ne: "" },
		})

		return NextResponse.json({
			success: true,
			data: {
				company: {
					id: asString(company._id),
					imageUrl: company.imageUrl || "",
					name: company.name || "Unnamed company",
					logoUrl: company.logoUrl || "",
					socialLinks: Array.isArray(company.socialLinks) ? company.socialLinks : [],
					companyEmail: company.companyEmail || "",
					moderatorEmails: Array.isArray(company.moderatorEmails) ? company.moderatorEmails : [],
					description: company.description || "",
					companyId: company.companyId,
					createdAt: company.createdAt || "",
					updatedAt: company.updatedAt || "",
				},
				stats: {
					totalCheckIns,
					resumeCount,
					connectedUsers: companyConnections.length,
					moderatorCount: Array.isArray(company.moderatorEmails) ? company.moderatorEmails.length : 0,
					socialLinkCount: Array.isArray(company.socialLinks) ? company.socialLinks.length : 0,
				},
				recentCheckIns: recentCheckIns.map(toRecentCheckIn),
				availableCompanies: availableCompanies.map((item) => ({
					id: asString(item._id),
					name: item.name || "Unnamed company",
				})),
				selectedCompanyId: companyScope,
				canEdit:
					isSuperAdmin ||
					Boolean(metadata?.pageAccess?.company?.["/company/dashboard"] === "edit" || metadata?.pageAccess?.company?.["company/dashboard"] === "edit"),
			},
		})
	} catch (error) {
		console.error("Failed to load company dashboard:", error)
		return NextResponse.json({ success: false, error: "Failed to load company dashboard" }, { status: 500 })
	}
}
