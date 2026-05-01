"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Company, SocialLink } from "./types"
import { UploadImageToBlobStorage, addCompanyToCollection, updateCompanyInCollection } from "../actions"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import Image from "next/image"

type CompanyFormDialogProps = {
  open: boolean
  mode: "add" | "edit"
  company?: Company | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type CompanyFormState = {
  imageUrl: string
  name: string
  logoUrl: string
  socialLinks: SocialLink[]
  companyEmail: string
  moderatorEmails: string[]
  description: string
}

const emptySocialLink = (): SocialLink => ({
  platform: "",
  url: "",
})

const emptyForm = (): CompanyFormState => ({
  imageUrl: "",
  name: "",
  logoUrl: "",
  socialLinks: [emptySocialLink()],
  companyEmail: "",
  moderatorEmails: [""],
  description: "",
})

function createInitialForm(company?: Company | null): CompanyFormState {
  return company
    ? {
        imageUrl: company.imageUrl || "",
        name: company.name || "",
        logoUrl: company.logoUrl || "",
        socialLinks:
          company.socialLinks?.length > 0 ? company.socialLinks : [emptySocialLink()],
        companyEmail: company.companyEmail || "",
        moderatorEmails:
          company.moderatorEmails?.length > 0 ? company.moderatorEmails : [""],
        description: company.description || "",
      }
    : emptyForm()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function CompanyFormDialog({
  open,
  mode,
  company,
  onOpenChange,
  onSaved,
}: CompanyFormDialogProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => createInitialForm(company))
  const [errors, setErrors] = useState<string[]>([])

  const updateSocialLink = (index: number, key: keyof SocialLink, value: string) => {
    setForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }))
  }

  const addSocialLink = () => {
    setForm((current) => ({
      ...current,
      socialLinks: [...current.socialLinks, emptySocialLink()],
    }))
  }

  const removeSocialLink = (index: number) => {
    setForm((current) => {
      const nextLinks = current.socialLinks.filter((_, itemIndex) => itemIndex !== index)
      return {
        ...current,
        socialLinks: nextLinks.length > 0 ? nextLinks : [emptySocialLink()],
      }
    })
  }

  const updateModeratorEmail = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      moderatorEmails: current.moderatorEmails.map((email, itemIndex) =>
        itemIndex === index ? value : email
      ),
    }))
  }

  const addModeratorEmail = () => {
    setForm((current) => ({
      ...current,
      moderatorEmails: [...current.moderatorEmails, ""],
    }))
  }

  const removeModeratorEmail = (index: number) => {
    setForm((current) => {
      const nextEmails = current.moderatorEmails.filter((_, itemIndex) => itemIndex !== index)
      return {
        ...current,
        moderatorEmails: nextEmails.length > 0 ? nextEmails : [""],
      }
    })
  }

  const validateForm = () => {
    const nextErrors: string[] = []

    if (!form.name.trim()) nextErrors.push("Company name is required")
    if (!form.imageUrl.trim()) nextErrors.push("Company image is required")
    if (!form.logoUrl.trim()) nextErrors.push("Company logo is required")
    if (!form.companyEmail.trim()) nextErrors.push("Company email is required")
    if (!form.description.trim()) nextErrors.push("Description is required")

    const validModeratorEmails = form.moderatorEmails
      .map((email) => email.trim())
      .filter(Boolean)

    if (validModeratorEmails.length === 0) {
      nextErrors.push("At least one moderator email is required")
    }

    validModeratorEmails.forEach((email, index) => {
      if (!isEmail(email)) {
        nextErrors.push(`Moderator email ${index + 1} must be valid`)
      }
    })

    form.socialLinks.forEach((link, index) => {
      if (!link.platform.trim() && !link.url.trim()) {
        return
      }
      if (!link.platform.trim()) nextErrors.push(`Social link ${index + 1} platform is required`)
      if (!link.url.trim()) nextErrors.push(`Social link ${index + 1} URL is required`)
    })

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const blob = await UploadImageToBlobStorage(
        file,
        `companies/${slugify(form.name || "company")}/image`
      )
      setForm((current) => ({ ...current, imageUrl: blob.url }))
      toast.success("Company image uploaded")
    } catch (error) {
      console.error("Error uploading company image:", error)
      toast.error("Failed to upload company image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true)
    try {
      const blob = await UploadImageToBlobStorage(
        file,
        `companies/${slugify(form.name || "company")}/logo`
      )
      setForm((current) => ({ ...current, logoUrl: blob.url }))
      toast.success("Company logo uploaded")
    } catch (error) {
      console.error("Error uploading company logo:", error)
      toast.error("Failed to upload company logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm()) {
      return
    }

    const payload = {
      imageUrl: form.imageUrl.trim(),
      name: form.name.trim(),
      logoUrl: form.logoUrl.trim(),
      socialLinks: form.socialLinks.filter((link) => link.platform.trim() || link.url.trim()),
      companyEmail: form.companyEmail.trim(),
      moderatorEmails: form.moderatorEmails.map((email) => email.trim()).filter(Boolean),
      description: form.description.trim(),
    }

    setSaving(true)
    try {
      if (mode === "edit" && company) {
        await updateCompanyInCollection(company.id, payload)
        toast.success("Company updated successfully")
      } else {
        await addCompanyToCollection(payload)
        toast.success("Company added successfully")
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving company:", error)
      toast.error(mode === "edit" ? "Failed to update company" : "Failed to add company")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,1100px)] overflow-y-auto sm:max-w-275">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Company" : "Add Company"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Company Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Company name"
            />

            <label className="block text-sm font-medium">Company Email</label>
            <input
              value={form.companyEmail}
              onChange={(e) => setForm((current) => ({ ...current, companyEmail: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="company@example.com"
            />

            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              className="min-h-32 w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Company description"
            />

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Company Image</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleImageUpload(file)
                    }
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                {isUploadingImage && <p className="text-xs text-muted-foreground">Uploading image...</p>}
                {form.imageUrl && (
                  <Image
                    src={form.imageUrl}
                    alt="Company image"
                    width={400}
                    height={160}
                    className="h-32 w-full rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Company Logo</label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleLogoUpload(file)
                    }
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                {isUploadingLogo && <p className="text-xs text-muted-foreground">Uploading logo...</p>}
                {form.logoUrl && (
                  <Image
                    src={form.logoUrl}
                    alt="Company logo"
                    width={400}
                    height={160}
                    className="h-32 w-full rounded-lg object-contain"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/20 p-3 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">Social Links</div>
                  <div className="text-xs text-muted-foreground">Add any number of links</div>
                </div>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Plus size={14} /> Add link
                </button>
              </div>

              <div className="space-y-3 grow-0 shrink flex flex-col">
                {form.socialLinks.map((link, index) => (
                  <div key={index} className="flex flex-row flex-wrap gap-2 rounded-lg border bg-background p-3">
                    <input
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                      className="rounded-lg border bg-background px-3 py-2 text-sm grow"
                      placeholder="Platform e.g. Facebook"
                    />
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="inline-flex items-center justify-center rounded-lg border border-destructive/40 px-3 py-2 text-destructive hover:bg-destructive hover:text-white w-fit"
                      aria-label={`Remove social link ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    <input
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/20 p-3 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">Moderator Emails</div>
                  <div className="text-xs text-muted-foreground">Create Clerk accounts for all addresses below</div>
                </div>
                <button
                  type="button"
                  onClick={addModeratorEmail}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Plus size={14} /> Add email
                </button>
              </div>

              <div className="space-y-3">
                {form.moderatorEmails.map((email, index) => (
                  <div key={index} className="flex flex-row flex-nowrap gap-2 rounded-lg border bg-background p-3">
                    <input
                      value={email}
                      onChange={(e) => updateModeratorEmail(index, e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder="moderator@example.com"
                    />
                    <button
                      type="button"
                      onClick={() => removeModeratorEmail(index)}
                      className="inline-flex items-center justify-center rounded-lg border border-destructive/40 px-3 py-2 text-destructive hover:bg-destructive hover:text-white w-fit"
                      aria-label={`Remove moderator email ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex items-center justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isUploadingImage || isUploadingLogo}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : mode === "edit" ? "Update Company" : "Add Company"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
