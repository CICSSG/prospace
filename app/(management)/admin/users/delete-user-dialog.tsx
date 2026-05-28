"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { User } from "./types"
import { useState } from "react"
import { toast } from "sonner"

type DeleteUserDialogProps = {
  user: User | null
  setDeleteUser: (user: User | null) => void
  getData: () => void
}

export default function DeleteUserDialog({
  user,
  setDeleteUser,
  getData,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/deleteUser?id=${user.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast.success("User deleted successfully")
      setDeleteUser(null)
      getData()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={() => setDeleteUser(null)}>
      <DialogContent className="sm:max-w-md bg-primary/40">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete {user?.firstName} {user?.lastName}?
          </p>
          <div className="rounded-lg border bg-background p-3 text-xs space-y-1">
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">Clerk ID:</span>{" "}
              <code className="text-muted-foreground">{user?.clerkId}</code>
            </div>
          </div>
          <p className="text-xs text-destructive">
            This action cannot be undone and will delete their profile data.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteUser(null)}
            className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center rounded-lg bg-destructive px-3 py-2 text-sm text-white hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
