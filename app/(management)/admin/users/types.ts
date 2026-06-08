import type { PageAccess } from "./permissions"

export type User = {
  id: string
  clerkId: string
  firstName: string
  lastName: string
  email: string
  course: string
  shortBio: string
  resumeLink: string
  createdAt: string
  updatedAt: string
  role?: "admin" | "user" | null
  adminRole?: "superadmin" | "admin" | null
  isAdmin?: boolean
  pageAccess?: PageAccess | null
  assignedCompany?: string | null
  companyId?: string | null
  companyName?: string | null
  assignedCompanies?: Array<{ id: string; name: string }> | null
}
