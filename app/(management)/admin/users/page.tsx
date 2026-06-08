"use client"

import { PaginationComponent } from "@/components/pagination"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import * as XLSX from "xlsx"
import { Download, Plus, RefreshCw, PencilLine, Trash2, Shield, Users2, Building2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getCollectionData, inspectOrCreateMongoUserByEmail } from "../actions"
import UserFormDialog from "./user-form-dialog"
import DeleteUserDialog from "./delete-user-dialog"
import { User } from "./types"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  getManagementPageAccessState,
  type ManagementAccessMetadata,
  type PageAccess,
  type PageAccessSection,
} from "./permissions"

const emptyList: User[] = []

export default function UsersList() {
  const { user } = useUser()
  const router = useRouter()

  const metadata = user?.publicMetadata as ManagementAccessMetadata | undefined

  const userRole = metadata?.role ?? null
  const adminRole = metadata?.adminRole ?? null
  const pageAccess = metadata?.pageAccess?.manage as PageAccessSection | undefined
  const { canView: canViewUsersPage, canEdit: canEditUsersPage } = getManagementPageAccessState(
    metadata,
    "manage",
    ["/users"],
  )
  const [users, setUsers] = useState<User[]>(emptyList)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [domainFilters, setDomainFilters] = useState<Record<string, boolean>>({})
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [availableDomains, setAvailableDomains] = useState<string[]>([])
  const [userSetupOpen, setUserSetupOpen] = useState(false)
  const [setupEmail, setSetupEmail] = useState("")
  const [setupStep, setSetupStep] = useState<"email" | "confirm">("email")
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<{
    clerkFound?: boolean
    mongoExists?: boolean
    created?: boolean
    clerkId?: string
    email?: string
    firstName?: string
    lastName?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    if (user && !canViewUsersPage) {
      toast.error("You don't have permission to access this page")
      router.push("/admin/dashboard")
      return
    }
  }, [user, canViewUsersPage, router])

  if (!user || !canViewUsersPage) {
    return null
  }

  type UserCollectionItem = {
    _id: string
    clerkId?: string
    firstName?: string
    lastName?: string
    email?: string
    course?: string
    shortBio?: string
    resumeLink?: string
    createdAt?: string
    updatedAt?: string
    role?: "admin" | "user" | null
    adminRole?: "superadmin" | "admin" | null
    isAdmin?: boolean
    pageAccess?: {
      manage?: PageAccessSection
      data?: PageAccessSection
    } | null
    assignedCompany?: string | null
    companyId?: string | null
    companyName?: string | null
    assignedCompanies?: Array<{ id: string; name: string }> | null
  }

  const getData = useCallback(() => {
    getCollectionData("users")
      .then((response) => {
        if (response.success) {
          const mappedUsers: User[] = (response.data || []).map((item: UserCollectionItem) => ({
            id: item._id,
            clerkId: item.clerkId || "",
            firstName: item.firstName || "",
            lastName: item.lastName || "",
            email: item.email || "",
            course: item.course || "",
            shortBio: item.shortBio || "",
            resumeLink: item.resumeLink || "",
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || "",
            role: item.role || null,
            adminRole: item.adminRole || null,
            isAdmin: item.isAdmin || false,
            pageAccess: item.pageAccess || null,
            assignedCompany: item.assignedCompany || null,
            companyId: item.companyId || null,
            companyName: item.companyName || null,
            assignedCompanies: Array.isArray(item.assignedCompanies) ? item.assignedCompanies : null,
          }))

          setUsers(mappedUsers)

          // Extract unique email domains
          const domains = new Set<string>()
          mappedUsers.forEach((user) => {
            const domain = user.email.split("@")[1]
            if (domain) domains.add(domain)
          })
          setAvailableDomains(Array.from(domains).sort())
          toast.success("Users data loaded")
        } else {
          toast.error("Failed to fetch users data")
        }
      })
      .catch((error) => {
        console.error("Error fetching users data:", error)
        toast.error("Failed to fetch users data")
      })
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      normalizedSearch === "" ||
      user.firstName.toLowerCase().includes(normalizedSearch) ||
      user.lastName.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.course.toLowerCase().includes(normalizedSearch)

    const userDomain = user.email.split("@")[1]
    const activeDomains = Object.entries(domainFilters)
      .filter(([, isEnabled]) => isEnabled)
      .map(([domain]) => domain)
    const matchesDomain = activeDomains.length === 0 || (userDomain && activeDomains.includes(userDomain))

    return matchesSearch && matchesDomain
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const toggleDomainFilter = (domain: string) => {
    setDomainFilters((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }))
    setPage(1)
  }

  const clearDomainFilters = () => {
    setDomainFilters({})
    setPage(1)
  }

  const handleExportExcel = () => {
    if (!filteredUsers.length) {
      toast.error("No filtered users to export")
      return
    }

    try {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(
        filteredUsers.map((user) => ({
          Name: `${user.firstName} ${user.lastName}`.trim(),
          Email: user.email,
          Course: user.course,
          Role: user.role === "admin" ? (user.adminRole === "superadmin" ? "Super Admin" : "Admin") : "User",
          "User ID": user.id,
          "Clerk ID": user.clerkId || "",
          "Joined At": user.createdAt ? formatDate(user.createdAt) : "",
          "Updated At": user.updatedAt ? formatDate(user.updatedAt) : "",
        })),
      )

      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Users")

      const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `users-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${filteredUsers.length} filtered user${filteredUsers.length === 1 ? "" : "s"}`)
    } catch (error) {
      console.error("Failed to export users:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export users")
    }
  }

  const handleItemsPerPageChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
    const nextValue = typeof value === "function" ? value(itemsPerPage) : value
    setItemsPerPage(nextValue)
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const resetUserSetupModal = () => {
    setUserSetupOpen(false)
    setSetupEmail("")
    setSetupStep("email")
    setSetupLoading(false)
    setSetupResult(null)
  }

  const handleCheckUser = async () => {
    const email = setupEmail.trim()
    if (!email) {
      toast.error("Please enter a user email")
      return
    }

    setSetupLoading(true)
    try {
      const result = await inspectOrCreateMongoUserByEmail({ email, createIfMissing: false })
      if (!result.success) {
        throw new Error(result.error || "Failed to check user data")
      }

      setSetupResult(result)

      if (result.mongoExists) {
        toast.success("Mongo data already exists for this Clerk account")
        resetUserSetupModal()
        return
      }

      setSetupStep("confirm")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check user data")
    } finally {
      setSetupLoading(false)
    }
  }

  const handleGenerateUserData = async () => {
    if (!setupEmail.trim()) return

    setSetupLoading(true)
    try {
      const result = await inspectOrCreateMongoUserByEmail({ email: setupEmail, createIfMissing: true })
      if (!result.success) {
        throw new Error(result.error || "Failed to generate user data")
      }

      toast.success(result.created ? "User data generated successfully" : "User data already existed")
      await getData()
      resetUserSetupModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate user data")
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users Management</h1>
          <p className="text-sm text-muted-foreground">Manage user accounts and permissions.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredUsers.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            type="button"
            onClick={() => setCreateUserOpen(true)}
            disabled={!canEditUsersPage}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} /> Create Account
          </button>
          <button
            type="button"
            onClick={getData}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setUserSetupOpen(true)}
            disabled={!canEditUsersPage}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Check a Clerk account and generate missing Mongo data"
          >
            <Users2 size={16} /> Setup User Data
          </button>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by name, email, or course"
              className="w-full rounded-lg border bg-foreground/10 px-3 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Email Domain Filter */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Filter by Email Domain</div>
            <div className="flex flex-wrap gap-2">
              {availableDomains.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => toggleDomainFilter(domain)}
                  className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    domainFilters[domain]
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background hover:bg-muted"
                  }`}
                >
                  {domain}
                </button>
              ))}
              {Object.values(domainFilters).some(Boolean) && (
                <button
                  type="button"
                  onClick={clearDomainFilters}
                  className="inline-flex items-center rounded-lg border border-muted-foreground px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-60 text-sm text-muted-foreground line-clamp-2">
                      {user.course}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {user.role === "admin" && user.adminRole === "superadmin" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <Shield size={12} /> Super Admin
                        </span>
                      )}
                      {user.role === "admin" && user.adminRole === "admin" && !user.assignedCompany && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <Shield size={12} /> Admin
                        </span>
                      )}
                      {user.role === "admin" && user.adminRole === "admin" && user.assignedCompany && (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600">
                            <Building2 size={12} /> Company
                          </span>
                          {user.assignedCompanies && user.assignedCompanies.length > 0 ? (
                            user.assignedCompanies.map((c) => (
                              <span key={c.id} className="text-xs text-muted-foreground">
                                {c.name}
                              </span>
                            ))
                          ) : user.companyName ? (
                            <span className="text-xs text-muted-foreground">{user.companyName}</span>
                          ) : null}
                        </>
                      )}
                      {user.role !== "admin" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600">
                          <Users2 size={12} /> User
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditUser(user)}
                        disabled={!canEditUsersPage}
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        title="Edit user permissions"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUser(user)}
                        disabled={!canEditUsersPage}
                        className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>
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

      <UserFormDialog
        open={createUserOpen}
        mode="create"
        onOpenChange={setCreateUserOpen}
        onSaved={getData}
      />

      {editUser && (
        <UserFormDialog
          key={editUser.id}
          open={Boolean(editUser)}
          mode="edit"
          user={editUser}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditUser(null)
            }
          }}
          onSaved={getData}
        />
      )}

      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          setDeleteUser={setDeleteUser}
          getData={getData}
        />
      )}

      <Dialog open={userSetupOpen} onOpenChange={(open) => (open ? setUserSetupOpen(true) : resetUserSetupModal())}>
        <DialogContent className="sm:max-w-lg bg-primary/40">
          <DialogHeader>
            <DialogTitle>{setupStep === "email" ? "Setup user data" : "Confirm data generation"}</DialogTitle>
          </DialogHeader>

          {setupStep === "email" ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-white/75">
                Enter the Clerk account email to check whether a MongoDB user record already exists.
              </p>
              <Input
                type="email"
                value={setupEmail}
                onChange={(event) => setSetupEmail(event.target.value)}
                placeholder="user@example.com"
                className="bg-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/55">
                You may generate a MongoDB user record if the Clerk account exists but the MongoDB record is missing.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <p>
                  Clerk account: <span className="font-medium text-white">{setupResult?.email || setupEmail}</span>
                </p>
                <p className="mt-2">
                  Name: <span className="font-medium text-white">{[setupResult?.firstName, setupResult?.lastName].filter(Boolean).join(" ") || "Unknown"}</span>
                </p>
                <p className="mt-2">
                  MongoDB record: <span className="font-medium text-white">missing</span>
                </p>
              </div>
              <p className="text-sm text-white/75">
                A Clerk account was found, but there is no matching MongoDB user document for this clerkId. Do you want to generate it now?
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            {setupStep === "email" ? (
              <>
                <button
                  type="button"
                  onClick={resetUserSetupModal}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCheckUser()}
                  disabled={setupLoading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {setupLoading ? "Checking..." : "Check Clerk account"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSetupStep("email")}
                  disabled={setupLoading}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={resetUserSetupModal}
                  disabled={setupLoading}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerateUserData()}
                  disabled={setupLoading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {setupLoading ? "Generating..." : "Generate data"}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
