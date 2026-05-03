"use client"
import { sendOTP, verifyOTP, completeSignup } from "@/app/actions"
import { UploadImageToBlobStorage } from "@/app/admin/actions"
import { useForm } from "@tanstack/react-form"
import clsx from "clsx"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { permanentRedirect, RedirectType } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ClipLoader } from "react-spinners"
import { toast } from "sonner"
import z from "zod"
import { X } from "lucide-react"

const SignUpPage = () => {
  const portfolioInputRef = useRef<HTMLInputElement>(null)
  const focusRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1) // 1: Basic info, 2: OTP, 3: Optional fields
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [socialLinksData, setSocialLinksData] = useState<Array<{ id: string; url: string }>>([])
  const [currentUserEmail, setCurrentUserEmail] = useState("")

  const dlsudEmailPattern = /^[a-z0-9._%+-]+@dlsud\.edu\.ph$/i
  const dlsuEmailPattern = /^[a-z0-9._%+-]+@dlsu\.edu\.ph$/i

  const dlsudEmailValidator = z.string().regex(dlsudEmailPattern)
  const dlsuEmailValidator = z.string().regex(dlsuEmailPattern)

  const step1Schema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.union(
      [dlsudEmailValidator, dlsuEmailValidator],
      "Must be a valid email of any DLSU branch"
    ),
    course: z.string().min(2, "Course must be at least 2 characters"),
  })

  const step2Schema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
  })

  const step3Schema = z.object({
    shortBio: z.string().max(500, "Short bio must be less than 500 characters"),
    portfolioLink: z.string(),
  })

  const { Field: Field1, handleSubmit: handleSubmit1, getFieldValue: getFieldValue1 } = useForm({
    validators: {
      onChange: step1Schema,
    },
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      course: "",
    },
    onSubmit: async (formData) => {
      setIsSending(true)
      const values = formData.value
      setCurrentUserEmail(values.email)
      sendOTP(values.email, values.firstName, values.lastName, values.course)
        .then((response: any) => {
          setIsSending(false)
          // Check if there's a nextStep (existing tempUser found)
          if (response.nextStep) {
            toast.success(response.message)
            setStep(response.nextStep)
          } else {
            // New registration, send OTP
            setOtpSent(true)
            setOtpTimer(300) // 5 minutes
            toast.success("OTP sent to your email!")
            setStep(2)
          }
        })
        .catch((error) => {
          setIsSending(false)
          console.error("Error sending OTP:", error)
          toast.error(error instanceof Error ? error.message : "Failed to send OTP. Please try again.")
        })
    },
  })

  const { Field: Field2, handleSubmit: handleSubmit2 } = useForm({
    validators: {
      onChange: step2Schema,
    },
    defaultValues: {
      otp: "",
    },
    onSubmit: async (formData) => {
      const email = getFieldValue1("email")
      const values = formData.value
      setIsVerifying(true)
      verifyOTP(email, values.otp)
        .then(() => {
          setIsVerifying(false)
          toast.success("Email verified successfully!")
          setStep(3)
        })
        .catch((error) => {
          setIsVerifying(false)
          console.error("Error verifying OTP:", error)
          toast.error(error instanceof Error ? error.message : "Failed to verify OTP")
        })
    },
  })

  const { Field: Field3, handleSubmit: handleSubmit3 } = useForm({
    validators: {
      onChange: step3Schema,
    },
    defaultValues: {
      shortBio: "",
      portfolioLink: "",
    },
    onSubmit: async (formData) => {
      const email = getFieldValue1("email")
      const values = formData.value
      setIsCompleting(true)
      completeSignup(email, values.shortBio, socialLinksData.map(s => s.url), values.portfolioLink)
        .then(() => {
          setIsCompleting(false)
          toast.success("Registration successful! Redirecting...")
          permanentRedirect("/signup/success", RedirectType.push)
        })
        .catch((error) => {
          if (isRedirectError(error)) {
            permanentRedirect("/signup/success", RedirectType.push)
          }
          setIsCompleting(false)
          console.error("Error completing signup:", error)
          toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.")
        })
    },
  })

  // OTP Timer effect
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (otpTimer === 0 && otpSent) {
      setOtpSent(false)
    }
  }, [otpTimer, otpSent])

  useEffect(() => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }, [step])

  return (
    <div className="w-full bg-linear-to-r from-purple-500/15 to-pink-500/15 p-6">
      <div className="mx-auto mt-30 mb-10 w-full max-w-md rounded-lg border-2 border-primary/70 bg-primary/15 p-6 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">Registration</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Step {step} of 3
        </p>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit1()
            }}
          >
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Fields marked with <span className="text-red-500">*</span> are required.
            </p>

            <div className="flex flex-row gap-4">
              <Field1 name="firstName">
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
              </Field1>

              <Field1 name="lastName">
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
              </Field1>
            </div>

            <Field1 name="email">
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
            </Field1>

            <Field1 name="course">
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
            </Field1>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/50 disabled:hover:bg-primary/50"
              disabled={isSending}
            >
              {isSending ? (
                <div className="flex flex-row items-center justify-center gap-2">
                  Sending OTP
                  <ClipLoader size={16} color="#FFFFFF" />
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit2()
            }}
          >
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Enter the 6-digit OTP sent to <strong>{getFieldValue1("email")}</strong>
            </p>

            <Field2 name="otp">
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
                      OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className={clsx(
                        "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                        isTouched &&
                          errors.length > 0 &&
                          "border-red-500 focus:ring-red-500"
                      )}
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value.replace(/\D/g, ""))
                      }}
                      onBlur={field.handleBlur}
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
            </Field2>

            <p className="text-xs text-muted-foreground">
              OTP expires in: <strong>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}</strong>
            </p>

            {otpTimer === 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsSending(true)
                  sendOTP(
                    getFieldValue1("email"),
                    getFieldValue1("firstName"),
                    getFieldValue1("lastName"),
                    getFieldValue1("course")
                  )
                    .then((response: any) => {
                      setIsSending(false)
                      setOtpTimer(300)
                      toast.success("New OTP sent!")
                    })
                    .catch((error) => {
                      setIsSending(false)
                      toast.error("Failed to resend OTP")
                    })
                }}
                className="text-sm text-primary hover:underline"
              >
                Resend OTP
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 focus:outline-none"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/50 disabled:hover:bg-primary/50"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <div className="flex flex-row items-center justify-center gap-2">
                    Verifying
                    <ClipLoader size={16} color="#FFFFFF" />
                  </div>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Optional Information */}
        {step === 3 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit3()
            }}
          >
            <p className="mb-4 text-center text-sm text-muted-foreground">
              The following fields are optional. Click <strong>Complete Registration</strong> to finish.
            </p>

            <Field3 name="shortBio">
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
                    <textarea
                      placeholder="ex. I am passionate about...."
                      className={clsx(
                        "w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                        isTouched &&
                          errors.length > 0 &&
                          "border-red-500 focus:ring-red-500"
                      )}
                      rows={3}
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
            </Field3>

            {/* Social Links Dynamic Field */}
            <div>
              <label className="mb-1 flex w-full flex-row items-center text-sm font-normal text-primary-foreground">
                Social Links
                <span className="mr-2 ml-auto text-xs text-muted-foreground">
                  (optional)
                </span>
              </label>
              <div className="space-y-2">
                {socialLinksData.map((link) => (
                  <div key={link.id} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/profile"
                      className="flex-1 rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:bg-white focus:text-background focus:ring-2 focus:ring-[#1976D2] focus:outline-none"
                      value={link.url}
                      onChange={(e) => {
                        setSocialLinksData((prev) =>
                          prev.map((l) =>
                            l.id === link.id ? { ...l, url: e.target.value } : l
                          )
                        )
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSocialLinksData((prev) =>
                          prev.filter((l) => l.id !== link.id)
                        )
                      }}
                      className="rounded-lg border border-red-500 p-2 text-red-500 hover:bg-red-500/10"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSocialLinksData((prev) => [
                      ...prev,
                      { id: Date.now().toString(), url: "" },
                    ])
                  }}
                  className="w-full rounded-lg border border-dashed border-primary px-3 py-2 text-sm text-primary hover:bg-primary/10"
                >
                  + Add Social Link
                </button>
              </div>
            </div>

            <Field3 name="portfolioLink">
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
                        Portfolio{" "}
                        <span className="text-xs text-primary-foreground/50">
                          (pdf, doc, docx, max: 5MB)
                        </span>
                      </div>
                      <span className="mr-2 ml-auto text-xs text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <input
                      ref={portfolioInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="mb-2 w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:ring-2 focus:ring-[#1976D2] focus:outline-none"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setIsUploading(true)
                          UploadImageToBlobStorage(
                            file,
                            `portfolio/${getFieldValue1("firstName")}-Portfolio`
                          )
                            .then((blob) => {
                              const fileUrl = blob.url
                              field.handleChange(fileUrl)
                              setIsUploading(false)
                              setUploadError(null)
                            })
                            .catch((error) => {
                              console.error("Error uploading file:", error)
                              if (portfolioInputRef.current) {
                                portfolioInputRef.current.value = ""
                              }
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
                        Portfolio upload successful
                      </p>
                    )}
                  </div>
                )
              }}
            </Field3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 focus:outline-none"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/50 disabled:hover:bg-primary/50"
                disabled={isUploading || isCompleting}
              >
                {isCompleting ? (
                  <div className="flex flex-row items-center justify-center gap-2">
                    Completing
                    <ClipLoader size={16} color="#FFFFFF" />
                  </div>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default SignUpPage
