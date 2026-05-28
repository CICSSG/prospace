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
  role?: "admin" | "data" | null
  adminRole?: "superadmin" | "admin" | null
  isAdmin?: boolean
}
