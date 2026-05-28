"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { User } from "./types"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type UserFormDialogProps = {
  open: boolean
  user?: User | null
  mode: "create" | "edit"
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type UserFormState = {
  firstName: string
  lastName: string
  email: string
  course: string
  shortBio: string
  resumeLink: string
}

const emptyForm = (): UserFormState => ({
  firstName: "",
  lastName: "",
  email: "",
  course: "",
  shortBio: "",
  resumeLink: "",
})

export default function UserFormDialog({
  open,
  user,
  mode,
  onOpenChange,
  onSaved,
}: UserFormDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<UserFormState>(() => emptyForm())
  const [role, setRole] = useState<"admin" | "data" | "none">("none")
  const [adminRole, setAdminRole] = useState<"superadmin" | "admin" | "none">("none")
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (mode === "create") {
      setForm(emptyForm())
      setRole("none")
      setAdminRole("none")
      return
    }

    setRole((user?.role as "admin" | "data" | "none") || "none")
    setAdminRole((user?.adminRole as "superadmin" | "admin" | "none") || "none")
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      course: user?.course || "",
      shortBio: user?.shortBio || "",
      resumeLink: user?.resumeLink || "",
    })
  }, [mode, user, open])

  const validateForm = () => {
    const nextErrors: string[] = []

    if (!form.firstName.trim()) nextErrors.push("First name is required")
    if (!form.lastName.trim()) nextErrors.push("Last name is required")
    if (!form.email.trim()) nextErrors.push("Email is required")

    if (mode === "create" && role === "admin" && adminRole === "none") {
      nextErrors.push("Select an admin type")
    }

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        course: form.course.trim(),
        shortBio: form.shortBio.trim(),
        resumeLink: form.resumeLink.trim(),
      }

      const normalizedRole = role === "admin" ? "admin" : role === "data" ? "data" : "user"
      const normalizedAdminRole =
        normalizedRole === "admin"
          ? adminRole === "superadmin"
            ? "superadmin"
            : "admin"
          : null

      const response =
        mode === "create"
          ? await fetch("/api/createUser", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                value: payload,
                role: normalizedRole,
                adminRole: normalizedAdminRole,
                isAdmin: normalizedRole === "admin",
              }),
            })
          : await fetch(`/api/updateUser?id=${user?.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                clerkId: user?.clerkId,
                role: normalizedRole === "user" ? null : normalizedRole,
                adminRole: normalizedAdminRole,
                isAdmin: normalizedRole === "admin",
              }),
            })

      if (!response.ok) {
        throw new Error(mode === "create" ? "Failed to create user" : "Failed to update user")
      }

      toast.success(mode === "create" ? "User created successfully" : "User updated successfully")
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error(mode === "create" ? "Error creating user:" : "Error updating user:", error)
      toast.error(mode === "create" ? "Failed to create user" : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-primary/40">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create User Account" : "Edit User Permissions"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="text-sm font-medium text-destructive">
                Please fix the following errors:
              </div>
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {mode === "create" ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
              <div className="text-sm font-medium">Account Details</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Input
                  value={form.course}
                  onChange={(event) => setForm((current) => ({ ...current, course: event.target.value }))}
                  placeholder="Course or program"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Short Bio</label>
                <textarea
                  value={form.shortBio}
                  onChange={(event) => setForm((current) => ({ ...current, shortBio: event.target.value }))}
                  placeholder="Short bio"
                  className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resume Link</label>
                <Input
                  value={form.resumeLink}
                  onChange={(event) => setForm((current) => ({ ...current, resumeLink: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="text-sm font-medium">User Information</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user?.email}
                </div>
                <div>
                  <span className="font-medium">Course:</span> {user?.course}
                </div>
                <div>
                  <span className="font-medium">Clerk ID:</span>
                  <code className="ml-2 text-xs text-muted-foreground">{user?.clerkId}</code>
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="text-sm font-medium">User Role</div>
            <RadioGroup value={role} onValueChange={(value: any) => setRole(value)}>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <RadioGroupItem value="none" id="role-none" />
                  <label htmlFor="role-none" className="flex flex-col cursor-pointer flex-1">
                    <span className="text-sm font-medium">No Role</span>
                    <span className="text-xs text-muted-foreground">
                      Regular user with no special permissions
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <RadioGroupItem value="data" id="role-data" />
                  <label htmlFor="role-data" className="flex flex-col cursor-pointer flex-1">
                    <span className="text-sm font-medium">Data Role</span>
                    <span className="text-xs text-muted-foreground">
                      Access to data management features
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <RadioGroupItem value="admin" id="role-admin" />
                  <label htmlFor="role-admin" className="flex flex-col cursor-pointer flex-1">
                    <span className="text-sm font-medium">Admin Role</span>
                    <span className="text-xs text-muted-foreground">
                      Management access (select admin type below)
                    </span>
                  </label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Admin Type Selection */}
          {role === "admin" && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="text-sm font-medium">Admin Type</div>
              <RadioGroup value={adminRole} onValueChange={(value: any) => setAdminRole(value)}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <RadioGroupItem value="admin" id="admin-type-admin" />
                    <label htmlFor="admin-type-admin" className="flex flex-col cursor-pointer flex-1">
                      <span className="text-sm font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">
                        Can manage companies, sessions, missions, and logo loop
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <RadioGroupItem value="superadmin" id="admin-type-superadmin" />
                    <label htmlFor="admin-type-superadmin" className="flex flex-col cursor-pointer flex-1">
                      <span className="text-sm font-medium">Super Admin</span>
                      <span className="text-xs text-muted-foreground">
                        Full access including user management and all features
                      </span>
                    </label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "create" ? "Create Account" : "Update Permissions"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
