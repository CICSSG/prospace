"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mission } from "./types"
import { useState } from "react"
import { toast } from "sonner"

type MissionFormDialogProps = {
  open: boolean
  mode: "add" | "edit"
  mission?: Mission | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type MissionFormState = {
  missionTitle: string
  missionLink: string
}

const emptyForm = (): MissionFormState => ({
  missionTitle: "",
  missionLink: "",
})

function createInitialForm(mission?: Mission | null): MissionFormState {
  return mission
    ? {
        missionTitle: mission.missionTitle || "",
        missionLink: mission.missionLink || "",
      }
    : emptyForm()
}

export default function MissionFormDialog({
  open,
  mode,
  mission,
  onOpenChange,
  onSaved,
}: MissionFormDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => createInitialForm(mission))
  const [errors, setErrors] = useState<string[]>([])

  const validateForm = () => {
    const nextErrors: string[] = []

    if (!form.missionTitle.trim()) nextErrors.push("Mission title is required")

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      const url = mode === "add" ? "/api/addMission" : `/api/updateMission?id=${mission?.id}`
      const method = mode === "add" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missionTitle: form.missionTitle,
          missionLink: form.missionLink,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${mode === "add" ? "create" : "update"} mission`)
      }

      toast.success(`Mission ${mode === "add" ? "created" : "updated"} successfully`)
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} mission:`, error)
      toast.error(`Failed to ${mode === "add" ? "create" : "update"} mission`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-primary/40">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create New Mission" : "Edit Mission"}
          </DialogTitle>
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

          {/* Mission Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mission Title</label>
            <input
              type="text"
              value={form.missionTitle}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  missionTitle: e.target.value,
                }))
              }
              placeholder="Enter mission title"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Mission Link (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mission Link (Optional)</label>
            <input
              type="url"
              value={form.missionLink}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  missionLink: e.target.value,
                }))
              }
              placeholder="https://example.com"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

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
              {saving ? "Saving..." : mode === "add" ? "Create Mission" : "Update Mission"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
