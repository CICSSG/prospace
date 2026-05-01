"use client"
import { registerUser } from "@/app/actions"
import { UploadImageToBlobStorage } from "@/app/admin/actions"
import { useForm } from "@tanstack/react-form"
import clsx from "clsx"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { permanentRedirect, RedirectType } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ClipLoader } from "react-spinners"
import { toast } from "sonner"
import z from "zod"

const SignUpPage = () => {
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const focusRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const dlsudEmailPattern = /^[a-z0-9._%+-]+@dlsud\.edu\.ph$/i
  const dlsuEmailPattern = /^[a-z0-9._%+-]+@dlsu\.edu\.ph$/i

  const dlsudEmailValidator = z.string().regex(dlsudEmailPattern)
  const dlsuEmailValidator = z.string().regex(dlsuEmailPattern)

  const formSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.union(
      [dlsudEmailValidator, dlsuEmailValidator],
      "Must be a valid email of any DLSU branch"
    ),
    course: z.string().min(2, "Course must be at least 2 characters"),
    shortBio: z.string().max(500, "Short bio must be less than 500 characters"),
    resumeLink: z.string(),
  })

  const { Field, handleSubmit, getFieldValue } = useForm({
    validators: {
      onChange: formSchema,
    },
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      course: "",
      shortBio: "",
      resumeLink: "",
    },

    onSubmit: (values) => {
      setIsRegistering(true)
      registerUser(values)
        .then(() => {
          setIsRegistering(false)
          toast.success(
            "Registration successful! Check your email for confirmation."
          )
          permanentRedirect("/signup/success", RedirectType.push)
        })
        .catch((error) => {
          if (isRedirectError(error)) {
            permanentRedirect("/signup/success", RedirectType.push)
          }
          console.log("Registration error:", error)
          console.error("Registration error:", error)
          setIsRegistering(false)
          toast.error("Registration failed. Please try again.", error)
        })
    },
  })

  useEffect(() => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }, [])

  return (
    <div className="w-full bg-linear-to-r from-purple-500/15 to-pink-500/15 p-6">
      <div className="mx-auto mt-30 mb-10 w-full max-w-md rounded-lg border-2 border-primary/70 bg-primary/15 p-6 shadow-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">Registration</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Fields marked with <span className="text-red-500">*</span> are
          required.
        </p>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <div className="flex flex-row gap-4">
            <Field name="firstName">
              {(field) => {
                const { errors, isTouched } = field.state.meta
                const uniqueErrorMessages = [
                  ...new Set(
                    errors
                      .map((validationError) => validationError?.message)
                      .filter((message): message is string => Boolean(message))
                  ),
                ]

                return (
                  <div>
                    <label className="mb-1 block text-sm font-normal text-primary-foreground">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex. Juan"
                      className={clsx(
                        "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                        isTouched &&
                          errors.length > 0 &&
                          "border-red-500 focus:ring-red-500"
                      )}
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                      }}
                      onBlur={field.handleBlur}
                      // autoFocus
                      ref={focusRef}
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

            <Field name="lastName">
              {(field) => {
                const { errors, isTouched } = field.state.meta
                const uniqueErrorMessages = [
                  ...new Set(
                    errors
                      .map((validationError) => validationError?.message)
                      .filter((message): message is string => Boolean(message))
                  ),
                ]

                return (
                  <div>
                    <label className="mb-1 block text-sm font-normal text-primary-foreground">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ex. Dela Cruz"
                      className={clsx(
                        "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                        isTouched &&
                          errors.length > 0 &&
                          "border-red-500 focus:ring-red-500"
                      )}
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
          </div>

          <Field name="email">
            {(field) => {
              const { errors, isTouched } = field.state.meta
              const uniqueErrorMessages = [
                ...new Set(
                  errors
                    .map((validationError) => validationError?.message)
                    .filter((message): message is string => Boolean(message))
                ),
              ]

              return (
                <div>
                  <label className="mb-1 block text-sm font-normal text-primary-foreground">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ex. juandelacruz@dlsud.edu.ph"
                    className={clsx(
                      "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                      isTouched &&
                        errors.length > 0 &&
                        "border-red-500 focus:ring-red-500"
                    )}
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

          <Field name="course">
            {(field) => {
              const { errors, isTouched } = field.state.meta
              const uniqueErrorMessages = [
                ...new Set(
                  errors
                    .map((validationError) => validationError?.message)
                    .filter((message): message is string => Boolean(message))
                ),
              ]

              return (
                <div>
                  <label className="mb-1 block text-sm font-normal text-primary-foreground">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex. Bachelor of Science in Computer Science"
                    className={clsx(
                      "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                      isTouched &&
                        errors.length > 0 &&
                        "border-red-500 focus:ring-red-500"
                    )}
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

          <Field name="shortBio">
            {(field) => {
              const { errors, isTouched } = field.state.meta
              const uniqueErrorMessages = [
                ...new Set(
                  errors
                    .map((validationError) => validationError?.message)
                    .filter((message): message is string => Boolean(message))
                ),
              ]

              return (
                <div>
                  <label className="mb-1 flex w-full flex-row items-center text-sm font-normal text-primary-foreground">
                    Short Bio
                    <span className="mr-2 ml-auto text-xs text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex. I am passionate about...."
                    className={clsx(
                      "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                      isTouched &&
                        errors.length > 0 &&
                        "border-red-500 focus:ring-red-500"
                    )}
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

          {/* <Field name="socialLinks">
          {(field) => {
            const { errors, isTouched } = field.state.meta
            const uniqueErrorMessages = [
              ...new Set(
                errors
                  .map((validationError) => validationError?.message)
                  .filter((message): message is string => Boolean(message))
              ),
            ]

            return (
              <div>
                <label className="mb-2 block text-sm font-normal text-primary-foreground">
                  Social Links
                </label>
                <input
                  type="text"
                  placeholder="ex. https://twitter.com/username"
                  className={clsx(
                    "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none focus:bg-white",
                    isTouched &&
                      errors.length > 0 &&
                      "border-red-500 focus:ring-red-500"
                  )}
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
        </Field> */}

          <Field name="resumeLink">
            {(field) => {
              const { errors, isTouched } = field.state.meta
              const uniqueErrorMessages = [
                ...new Set(
                  errors
                    .map((validationError) => validationError?.message)
                    .filter((message): message is string => Boolean(message))
                ),
              ]

              return (
                <div>
                  <label className="mb-1 flex w-full flex-row items-center text-sm font-normal text-primary-foreground">
                    <div>
                      Resume{" "}
                      <span className="text-xs text-primary-foreground/50">
                        (pdf, doc, docx, max: 5MB)
                      </span>
                    </div>
                    <span className="mr-2 ml-auto text-xs text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="mb-2 w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:ring-2 focus:ring-[#1976D2] focus:outline-none"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setIsUploading(true)
                        UploadImageToBlobStorage(
                          file,
                          `resume/${getFieldValue("firstName")}-Resume`
                        )
                          .then((blob) => {
                            const fileUrl = blob.url
                            field.handleChange(fileUrl)
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
                    <div className="flex flex-row items-center gap-2 text-xs text-primary-foreground">
                      Uploading <ClipLoader size={16} color="#FFFFFF" />
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                  {field.state.value && (
                    <p className="text-xs text-green-500">
                      Resume upload successful
                    </p>
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
                </div>
              )
            }}
          </Field>

          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/50 disabled:hover:bg-primary/50"
            disabled={isUploading || isRegistering}
          >
            {isRegistering ? (
              <div className="flex flex-row items-center justify-center gap-2">
                Registering
                <ClipLoader size={16} color="#FFFFFF" />
              </div>
            ) : (
              "Register"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignUpPage
