"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mission, MissionLink } from "./types"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getCollectionData } from "../actions"

type MissionFormDialogProps = {
  open: boolean
  mode: "add" | "edit"
  mission?: Mission | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type MissionFormState = {
  missionTitle: string
  description: string
  completionMethod: "qr-scanning" | "help-desk" | "sign-up"
  requiredSignups: string
  links: MissionLink[]
  categoryId?: string
}

const emptyForm = (): MissionFormState => ({
  missionTitle: "",
  description: "",
  completionMethod: "qr-scanning",
  requiredSignups: "1",
  links: [{ title: "", link: "" }],
  categoryId: "",
})

function createInitialForm(mission?: Mission | null): MissionFormState {
  const initialLinks = Array.isArray(mission?.links) && mission.links.length > 0
    ? mission.links
    : Array.isArray(mission?.missionLinks) && mission.missionLinks.length > 0
      ? mission.missionLinks.map((link, index) => ({
          title: `Link ${index + 1}`,
          link,
        }))
      : mission?.missionLink
        ? [{ title: "Visit Link", link: mission.missionLink }]
        : [{ title: "", link: "" }]

  return mission
    ? {
        missionTitle: mission.missionTitle || "",
        description: mission.description || "",
        completionMethod: mission.completionMethod || "qr-scanning",
        requiredSignups: mission.requiredSignups ? String(mission.requiredSignups) : "1",
        links: initialLinks,
        categoryId: mission.categoryId || "",
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
  const [categories, setCategories] = useState<{ id: string; categoryName: string }[]>([])

  useEffect(() => {
    if (!open) return
    getCollectionData("missionCategories")
      .then((res) => {
        if (res.success) {
          const mapped = (res.data || []).map((c: any) => ({ id: c._id, categoryName: c.categoryName || c.name || c.title || "" }))
          setCategories(mapped)
        }
      })
      .catch((e) => console.error("Failed to load categories", e))
  }, [open])

  const validateForm = () => {
    const nextErrors: string[] = []

    if (!form.missionTitle.trim()) nextErrors.push("Mission title is required")
    if (form.completionMethod === "sign-up") {
      const requiredSignups = Number.parseInt(form.requiredSignups, 10)
      if (!Number.isInteger(requiredSignups) || requiredSignups < 1) {
        nextErrors.push("Sign-up missions need a valid required sign-up count")
      }
    }

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
          description: form.description,
          completionMethod: form.completionMethod,
          requiredSignups: form.completionMethod === "sign-up" ? Number.parseInt(form.requiredSignups, 10) : null,
          links: form.links
            .map((item) => ({
              title: item.title.trim(),
              link: item.link.trim(),
            }))
            .filter((item) => item.link),
          categoryId: form.categoryId,
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

          {/* Mission Description (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mission Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
              placeholder="Add a short mission description"
              className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Completion Method */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Completion Method</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "qr-scanning", label: "QR Scanning" },
                { value: "help-desk", label: "Help Desk" },
                { value: "sign-up", label: "Sign-up" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                    form.completionMethod === option.value ? "border-primary bg-primary/10" : "bg-background hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="completionMethod"
                    value={option.value}
                    checked={form.completionMethod === option.value}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        completionMethod: option.value as "qr-scanning" | "help-desk" | "sign-up",
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>

            {form.completionMethod === "qr-scanning" ? (
              <p className="text-xs text-muted-foreground">
                QR code actions will be available after the mission is saved.
              </p>
            ) : form.completionMethod === "sign-up" ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  This mission is completed automatically when the user signs up with enough companies.
                </p>
                <label className="text-sm font-medium">Required company sign-ups</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.requiredSignups}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requiredSignups: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                This mission will be marked as completed through Help Desk.
              </p>
            )}
          </div>

          {/* Mission Links (Optional, Multiple) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mission Links (Optional)</label>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    links: [...current.links, { title: "", link: "" }],
                  }))
                }
                className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                Add Link
              </button>
            </div>

            <div className="space-y-2">
              {form.links.map((item, index) => (
                <div key={`mission-link-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        links: current.links.map((currentItem, itemIndex) =>
                          itemIndex === index
                            ? { ...currentItem, title: e.target.value }
                            : currentItem
                        ),
                      }))
                    }
                    placeholder="Link title"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    value={item.link}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        links: current.links.map((currentItem, itemIndex) =>
                          itemIndex === index
                            ? { ...currentItem, link: e.target.value }
                            : currentItem
                        ),
                      }))
                    }
                    placeholder="https://example.com"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => {
                        if (current.links.length === 1) {
                          return { ...current, links: [{ title: "", link: "" }] }
                        }
                        return {
                          ...current,
                          links: current.links.filter((_, itemIndex) => itemIndex !== index),
                        }
                      })
                    }
                    className="inline-flex items-center rounded-lg border px-2.5 py-2 text-xs hover:bg-muted"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
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
