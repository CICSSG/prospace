"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { MissionCategory } from "./types"

type MissionCategoryFormDialogProps = {
  open: boolean
  mode: "add" | "edit"
  category?: MissionCategory | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type MissionCategoryFormState = {
  categoryName: string
}

const emptyForm = (): MissionCategoryFormState => ({
  categoryName: "",
})

function createInitialForm(category?: MissionCategory | null): MissionCategoryFormState {
  return category
    ? {
        categoryName: category.categoryName || "",
      }
    : emptyForm()
}

export default function MissionCategoryFormDialog({
  open,
  mode,
  category,
  onOpenChange,
  onSaved,
}: MissionCategoryFormDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => createInitialForm(category))
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setForm(createInitialForm(category))
      setErrors([])
      setSaving(false)
    }
  }, [category, open])

  const validateForm = () => {
    const nextErrors: string[] = []

    if (!form.categoryName.trim()) nextErrors.push("Category name is required")

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      const url = mode === "add" ? "/api/addMissionCategory" : `/api/updateMissionCategory?id=${category?.id}`
      const method = mode === "add" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryName: form.categoryName,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${mode === "add" ? "create" : "update"} mission category`)
      }

      toast.success(`Mission category ${mode === "add" ? "created" : "updated"} successfully`)
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} mission category:`, error)
      toast.error(`Failed to ${mode === "add" ? "create" : "update"} mission category`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl bg-primary/40">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Create Mission Category" : "Edit Mission Category"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="text-sm font-medium text-destructive">Please fix the following errors:</div>
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <input
              type="text"
              value={form.categoryName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoryName: event.target.value,
                }))
              }
              placeholder="Enter category name"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

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
              {saving ? "Saving..." : mode === "add" ? "Create Category" : "Update Category"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}