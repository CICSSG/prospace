"use client"
import { UploadImageToBlobStorage } from "@/app/admin/actions"
import { useForm } from "@tanstack/react-form"
import clsx from "clsx"
import React, { useRef, useState } from "react"
import { ClipLoader } from "react-spinners"
import z, { optional, string, ZodOptional } from "zod"

const SignUpPage = () => {
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const formSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    course: z.string().min(2, "Course must be at least 2 characters"),
    shortBio: z.string().max(500, "Short bio must be less than 500 characters"),
  })

  const { Field, handleSubmit, getFieldValue } = useForm({
    validators: {
      
      onChange: formSchema,
      //   onBlur: formSchema,
    },
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      course: "",
      shortBio: "",
    },

    onSubmit: (values) => {
      console.log("Form submitted with values:", values)
    },
  })

  return (
    <div className="mt-30 mb-10">
      <h1 className="mb-6 text-center text-3xl font-bold">Registration</h1>

      <form
        className="flex flex-col gap-2"
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
                  <label className="mb-2 block text-sm font-normal text-primary-foreground">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex. Juan"
                    className={clsx(
                      "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
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
                  <label className="mb-2 block text-sm font-normal text-primary-foreground">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex. Dela Cruz"
                    className={clsx(
                      "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
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
                <label className="mb-2 block text-sm font-normal text-primary-foreground">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="ex. juandelacruz@gmail.com"
                  className={clsx(
                    "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
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
                <label className="mb-2 block text-sm font-normal text-primary-foreground">
                  Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex. Bachelor of Science in Computer Science"
                  className={clsx(
                    "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
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
                <label className="mb-2 block text-sm font-normal text-primary-foreground">
                  Short Bio
                </label>
                <input
                  type="text"
                  placeholder="ex. I am passionate about...."
                  className={clsx(
                    "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
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
                    "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
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
                {getFieldValue("firstName") == "" ? (
                  <div className="w-90 text-center"></div>
                ) : (
                  <>
                    <label className="mb-2 block text-sm font-normal text-primary-foreground">
                      Resume{" "}
                      <span className="text-xs text-primary-foreground/50">
                        (Max file size: 5MB)
                      </span>
                    </label>
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="mb-2 rounded-lg border border-[#ADADAD] bg-white px-3 py-2 text-sm text-background placeholder-[#808080] transition-all focus:ring-2 focus:ring-[#1976D2] focus:outline-none"
                      disabled={getFieldValue("firstName") == ""}
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
                  </>
                )}
                {isUploading && (
                  <div className="flex flex-row items-center gap-2">
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
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
        >
          Register
        </button>
      </form>
    </div>
  )
}

export default SignUpPage
