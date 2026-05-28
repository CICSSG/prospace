"use client"

import { PaginationComponent } from "@/components/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, RefreshCw, PencilLine, Trash2, Shield, Users2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getCollectionData } from "../actions"
import UserFormDialog from "./user-form-dialog"
import DeleteUserDialog from "./delete-user-dialog"
import { User } from "./types"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const emptyList: User[] = []

export default function UsersList() {
  const { user } = useUser()
  const router = useRouter()

  const userRole = user?.publicMetadata?.role as "admin" | "data" | null
  const adminRole = user?.publicMetadata?.adminRole as "superadmin" | "admin" | null
  const [users, setUsers] = useState<User[]>(emptyList)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [availableDomains, setAvailableDomains] = useState<string[]>([])

  // Access control: Only Super Admin can access this page
  useEffect(() => {
    if (user && userRole !== "admin") {
      toast.error("You don't have permission to access this page")
      router.push("/admin/dashboard")
      return
    }
    if (user && userRole === "admin" && adminRole !== "superadmin") {
      toast.error("You don't have permission to access this page")
      router.push("/admin/dashboard")
      return
    }
  }, [user, userRole, adminRole, router])

  if (!user || userRole !== "admin" || adminRole !== "superadmin") {
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
    role?: "admin" | "data" | null
    adminRole?: "superadmin" | "admin" | null
    isAdmin?: boolean
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
    const matchesDomain =
      selectedDomains.length === 0 || 
      (userDomain && selectedDomains.includes(userDomain))

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
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    )
    setPage(1)
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
            onClick={() => setCreateUserOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
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
                    selectedDomains.includes(domain)
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background hover:bg-muted"
                  }`}
                >
                  {domain}
                </button>
              ))}
              {selectedDomains.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDomains([])}
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
                    <div className="flex gap-1">
                      {user.role === "admin" && user.adminRole === "superadmin" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <Shield size={12} /> Super Admin
                        </span>
                      )}
                      {user.role === "admin" && user.adminRole === "admin" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <Shield size={12} /> Admin
                        </span>
                      )}
                      {user.role === "data" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600">
                          <Users2 size={12} /> Data
                        </span>
                      )}
                      {!user.role && (
                        <span className="text-xs text-muted-foreground">User</span>
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
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        title="Edit user permissions"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUser(user)}
                        className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white"
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
    </div>
  )
}
