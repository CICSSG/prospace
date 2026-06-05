"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { MissionCategory } from "./types"

type DeleteMissionCategoryDialogProps = {
  category: MissionCategory | null
  setDeleteCategory: (category: MissionCategory | null) => void
  getData: () => void
}

export default function DeleteMissionCategoryDialog({
  category,
  setDeleteCategory,
  getData,
}: DeleteMissionCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!category) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/deleteMissionCategory?id=${category.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete mission category")
      }

      toast.success("Mission category deleted successfully")
      setDeleteCategory(null)
      getData()
    } catch (error) {
      console.error("Error deleting mission category:", error)
      toast.error("Failed to delete mission category")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={!!category} onOpenChange={() => setDeleteCategory(null)}>
      <DialogContent className="sm:max-w-md bg-primary/40">
        <DialogHeader>
          <DialogTitle>Delete Mission Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the category "{category?.categoryName}"?
          </p>
          <p className="text-xs text-destructive">This action cannot be undone.</p>
        </div>

        <DialogFooter className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteCategory(null)}
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