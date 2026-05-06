"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Mission } from "./types"
import { useState } from "react"
import { toast } from "sonner"

type DeleteMissionDialogProps = {
  mission: Mission | null
  setDeleteMission: (mission: Mission | null) => void
  getData: () => void
}

export default function DeleteMissionDialog({
  mission,
  setDeleteMission,
  getData,
}: DeleteMissionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!mission) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/deleteMission?id=${mission.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete mission")
      }

      toast.success("Mission deleted successfully")
      setDeleteMission(null)
      getData()
    } catch (error) {
      console.error("Error deleting mission:", error)
      toast.error("Failed to delete mission")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={!!mission} onOpenChange={() => setDeleteMission(null)}>
      <DialogContent className="sm:max-w-md bg-primary/40">
        <DialogHeader>
          <DialogTitle>Delete Mission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the mission "{mission?.missionTitle}"?
          </p>
          <p className="text-xs text-destructive">
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteMission(null)}
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
