"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Session } from "./types"
import { useState } from "react"
import { toast } from "sonner"

type DeleteSessionDialogProps = {
  session: Session | null
  setDeleteSession: (session: Session | null) => void
  getData: () => void
}

export default function DeleteSessionDialog({
  session,
  setDeleteSession,
  getData,
}: DeleteSessionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!session) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/deleteSession?id=${session.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete session")
      }

      toast.success("Session deleted successfully")
      setDeleteSession(null)
      getData()
    } catch (error) {
      console.error("Error deleting session:", error)
      toast.error("Failed to delete session")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={!!session} onOpenChange={() => setDeleteSession(null)}>
      <DialogContent className="sm:max-w-md bg-primary/40">
        <DialogHeader>
          <DialogTitle>Delete Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the session "{session?.sessionTitle}"?
          </p>
          <p className="text-xs text-destructive">
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteSession(null)}
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
