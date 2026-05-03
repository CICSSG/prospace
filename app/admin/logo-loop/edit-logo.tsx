import { Dialog } from "@/components/ui/dialog"
import { useForm } from "@tanstack/react-form"
import clsx from "clsx"
import { X } from "lucide-react"
import z from "zod"
import { updateLogoInLoop, UploadImageToBlobStorage } from "../actions"
import { ClipLoader } from "react-spinners"
import { useRef, useState } from "react"
import { toast } from "sonner"

type Logo = {
  id: string
  logoUrl: string
  companyName: string
  companyUrl: string
}

export default function EditLogoDialog({
  logo,
  setEditLogo,
  getData,
}: {
  logo: Logo
  setEditLogo: (logo: Logo | null) => void
  getData: () => void
}) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const editFormSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyUrl: z.url("Invalid URL format"),
    logoUrl: z.url("No image uploaded"),
  })

  const { Field, handleSubmit, getFieldValue } = useForm({
    validators: { onChange: editFormSchema },
    defaultValues: {
      companyName: logo.companyName || "",
      companyUrl: logo.companyUrl || "",
      logoUrl: logo.logoUrl || "",
    },
    onSubmit: (values) => {
      updateLogoInLoop(
        logo.id,
        values.value.companyName,
        values.value.companyUrl,
        values.value.logoUrl
      )
        .then(() => {
          toast.success("Logo updated successfully")
          setEditLogo(null)
        })
        .catch((error) => {
          console.error("Error updating logo:", error)
          toast.error("Failed to update logo")
        })
        .finally(() => getData())
    },
  })

  return (
    <Dialog onOpenChange={() => setEditLogo(null)}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="relative rounded-xl border-2 border-primary/50 bg-primary/30 p-4">
          <button
            className="absolute -top-3 -right-3 cursor-pointer rounded-full bg-primary/50 p-1 text-white/50 transition-colors hover:bg-primary hover:text-white"
            onClick={() => setEditLogo(null)}
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold text-primary-foreground">
              Edit Logo
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
              className="flex flex-col gap-4"
            >
              <Field name="companyName">
                {(field) => {
                  const { errors, isTouched } = field.state.meta
                  const uniqueErrorMessages = [
                    ...new Set(
                      errors
                        .map((validationError) => validationError?.message)
                        .filter((message): message is string =>
                          Boolean(message)
                        )
                    ),
                  ]

                  return (
                    <div>
                      <label className="mb-2 block text-sm font-normal text-primary-foreground">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Company Name"
                        className={clsx(
                          "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-black/70 placeholder-[#808080] transition-all focus:text-black focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                          isTouched &&
                            errors.length > 0 &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {isTouched &&
                        uniqueErrorMessages.length > 0 &&
                        uniqueErrorMessages.map((message, index) => (
                          <p key={index} className="mt-2 text-xs text-red-500">
                            {message}
                          </p>
                        ))}
                    </div>
                  )
                }}
              </Field>

              <Field name="companyUrl">
                {(field) => {
                  const { errors, isTouched } = field.state.meta
                  const uniqueErrorMessages = [
                    ...new Set(
                      errors
                        .map((validationError) => validationError?.message)
                        .filter((message): message is string =>
                          Boolean(message)
                        )
                    ),
                  ]
                  return (
                    <div>
                      <label className="mb-2 block text-sm font-normal text-primary-foreground">
                        Company URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="https://www.example.com"
                        className={clsx(
                          "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-black/70 placeholder-[#808080] transition-all focus:text-black focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                          isTouched &&
                            errors.length > 0 &&
                            "border-red-500 focus:ring-red-500"
                        )}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {isTouched &&
                        uniqueErrorMessages.length > 0 &&
                        uniqueErrorMessages.map((message, index) => (
                          <p key={index} className="mt-2 text-xs text-red-500">
                            {message}
                          </p>
                        ))}
                    </div>
                  )
                }}
              </Field>

              <Field name="logoUrl">
                {(field) => {
                  const { errors, isTouched } = field.state.meta
                  const uniqueErrorMessages = [
                    ...new Set(
                      errors
                        .map((validationError) => validationError?.message)
                        .filter((message): message is string =>
                          Boolean(message)
                        )
                    ),
                  ]
                  return (
                    <div>
                      <label className="mb-2 block text-sm font-normal text-primary-foreground">
                        Logo URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={imageInputRef}
                        type="file"
                        className="mb-2 rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm placeholder-[#808080] transition-all focus:ring-2 focus:ring-[#1976D2] focus:outline-none text-black"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setIsUploading(true)
                            UploadImageToBlobStorage(
                              file,
                              `logoLoop/${getFieldValue("companyName")}`
                            )
                              .then((blob) => {
                                const imageUrl = blob.url
                                field.handleChange(imageUrl)
                                setIsUploading(false)
                              })
                              .catch((error) => {
                                console.error("Error uploading image:", error)
                                e.target.value = ""
                                setIsUploading(false)
                                setUploadError(
                                  error instanceof Error
                                    ? error.message
                                    : "Unknown error occurred during upload"
                                )
                              })
                          }
                        }}
                      />
                      {isUploading && (
                        <div className="flex flex-row items-center gap-2">
                          Uploading <ClipLoader size={16} color="#FFFFFF" />
                        </div>
                      )}
                      {uploadError && (
                        <p className="text-xs text-red-500">{uploadError}</p>
                      )}
                      {field.state.value && (
                        <div className="mt-2 flex w-full flex-col items-center gap-2 text-center">
                          <img
                            src={field.state.value}
                            alt="Uploaded logo"
                            className="size-30 h-auto max-w-full rounded-lg border border-[#ADADAD] px-3 py-2 text-sm text-background placeholder-[#808080] transition-all focus:ring-2 focus:ring-[#1976D2] focus:outline-none"
                          />
                          <p className="text-xs text-green-500">Image upload successful</p>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="https://www.example.com/logo.png"
                        className="hidden"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value)
                        }}
                        onBlur={field.handleBlur}
                      />
                      {isTouched &&
                        uniqueErrorMessages.length > 0 &&
                        uniqueErrorMessages.map((message, index) => (
                          <p key={index} className="mt-2 text-xs text-red-500">
                            {message}
                          </p>
                        ))}
                    </div>
                  )
                }}
              </Field>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-white hover:bg-primary/80"
                disabled={isUploading}
              >
                {isUploading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
