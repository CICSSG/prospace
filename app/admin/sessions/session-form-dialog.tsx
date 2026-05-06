"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Session } from "./types"
import { UploadImageToBlobStorage, getCollectionData } from "../actions"
import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { Combobox } from "@/components/ui/combobox"

type SessionFormDialogProps = {
  open: boolean
  mode: "add" | "edit"
  session?: Session | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type SessionFormState = {
  topicPictureUrl: string
  logoUrl: string
  sessionTitle: string
  startTime: string
  endTime: string
  sessionDate: string
  company: string
}

const emptyForm = (): SessionFormState => ({
  topicPictureUrl: "",
  logoUrl: "",
  sessionTitle: "",
  startTime: "",
  endTime: "",
  sessionDate: "",
  company: "",
})

function createInitialForm(session?: Session | null): SessionFormState {
  return session
    ? {
        topicPictureUrl: session.topicPictureUrl || "",
        logoUrl: session.logoUrl || "",
        sessionTitle: session.sessionTitle || "",
        startTime: session.startTime || "",
        endTime: session.endTime || "",
        sessionDate: session.sessionDate || "",
        company: session.company || "",
      }
    : emptyForm()
}

export default function SessionFormDialog({
  open,
  mode,
  session,
  onOpenChange,
  onSaved,
}: SessionFormDialogProps) {
  const topicInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingTopic, setIsUploadingTopic] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => createInitialForm(session))
  const [errors, setErrors] = useState<string[]>([])
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    // Fetch companies for the dropdown
    const fetchCompanies = async () => {
      try {
        const response = await getCollectionData("companies")
        if (response.success) {
          const companyList = (response.data || []).map((item: any) => ({
            id: item._id,
            name: item.name || "Unnamed",
          }))
          setCompanies(companyList)
        }
      } catch (error) {
        console.error("Error fetching companies:", error)
      }
    }

    if (open) {
      fetchCompanies()
    }
  }, [open])

  const validateForm = () => {
    const nextErrors: string[] = []

    if (!form.sessionTitle.trim()) nextErrors.push("Session title is required")
    if (!form.topicPictureUrl.trim()) nextErrors.push("Topic picture is required")
    if (!form.logoUrl.trim()) nextErrors.push("Logo is required")
    if (!form.startTime.trim()) nextErrors.push("Start time is required")
    if (!form.endTime.trim()) nextErrors.push("End time is required")
    if (!form.sessionDate.trim()) nextErrors.push("Session date is required")
    if (!form.company.trim()) nextErrors.push("Company is required")

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleTopicImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingTopic(true)
    try {
      const blob = await UploadImageToBlobStorage(file, `session-topic-${Date.now()}`)
      setForm((current) => ({
        ...current,
        topicPictureUrl: blob.url,
      }))
      toast.success("Topic picture uploaded")
    } catch (error) {
      console.error("Error uploading topic picture:", error)
      toast.error("Failed to upload topic picture")
    } finally {
      setIsUploadingTopic(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const blob = await UploadImageToBlobStorage(file, `session-logo-${Date.now()}`)
      setForm((current) => ({
        ...current,
        logoUrl: blob.url,
      }))
      toast.success("Logo uploaded")
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Failed to upload logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      const url = mode === "add" ? "/api/addSession" : `/api/updateSession?id=${session?.id}`
      const method = mode === "add" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicPictureUrl: form.topicPictureUrl,
          logoUrl: form.logoUrl,
          sessionTitle: form.sessionTitle,
          startTime: form.startTime,
          endTime: form.endTime,
          sessionDate: form.sessionDate,
          company: form.company,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${mode === "add" ? "create" : "update"} session`)
      }

      toast.success(`Session ${mode === "add" ? "created" : "updated"} successfully`)
      onOpenChange(false)
      onSaved()
    } catch (error) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} session:`, error)
      toast.error(`Failed to ${mode === "add" ? "create" : "update"} session`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-primary/40">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create New Session" : "Edit Session"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="text-sm font-medium text-primary-foreground">
                Please fix the following errors:
              </div>
              <ul className="mt-2 space-y-1 text-xs text-primary-foreground">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Topic Picture Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic Picture</label>
            <div className="flex gap-3">
              {form.topicPictureUrl && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <Image
                    src={form.topicPictureUrl}
                    alt="Topic picture"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={topicInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTopicImageUpload}
                  disabled={isUploadingTopic}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => topicInputRef.current?.click()}
                  disabled={isUploadingTopic}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  {isUploadingTopic ? "Uploading..." : "Upload Topic Picture"}
                </button>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <div className="flex gap-3">
              {form.logoUrl && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <Image
                    src={form.logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                </button>
              </div>
            </div>
          </div>

          {/* Company Combobox */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned Company</label>
            <Combobox
              options={companies.map((company) => ({
                id: company.id,
                label: company.name,
              }))}
              value={form.company}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  company: value,
                }))
              }
              placeholder="Search and select a company..."
            />
          </div>

          {/* Session Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Title</label>
            <input
              type="text"
              value={form.sessionTitle}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  sessionTitle: e.target.value,
                }))
              }
              placeholder="Enter session title"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Session Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Date</label>
            <input
              type="date"
              value={form.sessionDate}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  sessionDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    startTime: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    endTime: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
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
              {saving ? "Saving..." : mode === "add" ? "Create Session" : "Update Session"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
