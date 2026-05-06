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
import localFont from "next/font/local"

const moscaLaroke = localFont({
  src: "../../mosca-laroke.regular.otf",
  display: "swap",
})

const sora = localFont({
  src: "../../sora-regular.ttf",
  display: "swap",
})

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
  const [otpTimer, setOtpTimer] = useState(15)
  const [socialLinksData, setSocialLinksData] = useState<
    Array<{ id: string; url: string }>
  >([])
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])

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

  const {
    Field: Field1,
    Subscribe: Subscribe1,
    handleSubmit: handleSubmit1,
    getFieldValue: getFieldValue1,
  } = useForm({
    validators: {
      onMount: step1Schema,
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
            setOtpTimer(60) // 1 minute
            toast.success("OTP sent to your email!")
            setStep(2)
          }
        })
        .catch((error) => {
          setIsSending(false)
          console.error("Error sending OTP:", error)
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to send OTP. Please try again."
          )
        })
    },
  })

  const { Field: Field2, Subscribe: Subscribe2, handleSubmit: handleSubmit2 } = useForm({
    validators: {
      onMount: step2Schema,
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
          toast.error(
            error instanceof Error ? error.message : "Failed to verify OTP"
          )
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
      completeSignup(
        email,
        values.shortBio,
        socialLinksData.map((s) => s.url),
        values.portfolioLink
      )
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
          toast.error(
            error instanceof Error
              ? error.message
              : "Registration failed. Please try again."
          )
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
    <div className="w-full p-6">
      <div className="mx-auto mt-30 mb-10 w-full max-w-md rounded-lg border-2 border-white/70 bg-linear-to-r from-primary/22 p-6 shadow-2xl">
        <h1
          className={`mb-2 text-center text-3xl font-bold tracking-widest ${moscaLaroke.className}`}
        >
          REGISTRATION
        </h1>
        <p className="mb-2 text-center text-sm font-thin tracking-[0.2rem] text-white/90">
          Step {step} of 3
        </p>

        <div className="mb-6 flex flex-row justify-center gap-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full border border-white/30 ${index < step - 1 ? "bg-green-500/30" : index === step - 1 ? "bg-blue-500/30" : "bg-gray-300/10"}`}
            />
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit1()
            }}
          >
            <div className="flex flex-row gap-4">
              <Field1 name="firstName">
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
                        .filter((message): message is string =>
                          Boolean(message)
                        )
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

            <Subscribe1 selector={(state) => ({ isValid: state.isValid, fieldMeta: state.fieldMeta })}>
              {({ isValid, fieldMeta }) => {
                const requiredFields = ["firstName", "lastName", "email", "course"]
                const allTouched = requiredFields.every((f) => !!(fieldMeta as any)[f]?.isTouched)
                const enable = isValid && allTouched
                return (
                  <button
                    type="submit"
                    className="mx-auto mt-4 w-40 cursor-pointer rounded-full border border-white/20 from-primary to-primary/0 px-4 py-2 text-sm font-medium transition-all not-disabled:bg-linear-to-l not-disabled:text-white/90 not-disabled:hover:text-white not-disabled:hover:bg-primary not-disabled:hover:scale-102 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/0 disabled:text-white/50"
                    disabled={isSending || !enable}
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
                )
              }}
            </Subscribe1>
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
              Enter the 6-digit OTP sent to{" "}
              <strong>{getFieldValue1("email")}</strong>
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
                    <div className="flex justify-center gap-3">
                      {[...Array(6)].map((_, i) => {
                        const digit = (field.state.value || "").charAt(i) || ""
                        return (
                          <input
                            key={i}
                            ref={(el) => {
                              otpInputRefs.current[i] = el
                              if (i === 0) focusRef.current = el
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(-1)
                              const current = (field.state.value || "")
                              const chars = current.split("").slice(0, 6)
                              while (chars.length < 6) chars.push("")
                              chars[i] = v || ""
                              const newOtp = chars.join("")
                              field.handleChange(newOtp)
                              if (v && i < 5) {
                                otpInputRefs.current[i + 1]?.focus()
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace") {
                                const current = (field.state.value || "")
                                const chars = current.split("").slice(0, 6)
                                while (chars.length < 6) chars.push("")
                                if (chars[i]) {
                                  chars[i] = ""
                                  field.handleChange(chars.join(""))
                                } else if (i > 0) {
                                  otpInputRefs.current[i - 1]?.focus()
                                  chars[i - 1] = ""
                                  field.handleChange(chars.join(""))
                                }
                              } else if (e.key === "ArrowLeft" && i > 0) {
                                otpInputRefs.current[i - 1]?.focus()
                              } else if (e.key === "ArrowRight" && i < 5) {
                                otpInputRefs.current[i + 1]?.focus()
                              }
                            }}
                            onBlur={field.handleBlur}
                            onPaste={(e) => {
                              e.preventDefault()
                              const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
                              const chars = paste.split("")
                              while (chars.length < 6) chars.push("")
                              field.handleChange(chars.join(""))
                              const nextIndex = chars.findIndex((c) => c === "")
                              const focusIndex = nextIndex === -1 ? 5 : nextIndex
                              otpInputRefs.current[focusIndex]?.focus()
                            }}
                            className={clsx(
                              "h-12 w-12 rounded-md border border-[#ADADAD] bg-white/90 text-black/70 text-thin text-center text-xl font-semibold leading-10 transition-shadow focus:border-[#1976D2] focus:shadow-md",
                              isTouched && errors.length > 0 && "border-red-500"
                            )}
                          />
                        )
                      })}
                    </div>
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

            <div className="flex flex-row justify-between">
              <p className="text-xs text-muted-foreground">
              OTP expires in:{" "}
              <strong>
                {Math.floor(otpTimer / 60)}:
                {(otpTimer % 60).toString().padStart(2, "0")}
              </strong>
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
                    getFieldValue1("course"),
                    true
                  )
                    .then((response: any) => {
                      setIsSending(false)
                      setOtpTimer(60)
                      setOtpSent(true)
                      toast.success("New OTP sent!")
                    })
                    .catch((error) => {
                      setIsSending(false)
                      toast.error("Failed to resend OTP")
                    })
                }}
                className="text-sm text-[#BBA4FF] hover:underline"
              >
                Resend OTP
              </button>
            )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 mt-4 rounded-full border border-white/80 text-white/80 px-4 py-2 text-sm font-medium cursor-pointer hover:bg-primary/10 focus:outline-none"
              >
                Back
              </button>
              <Subscribe2 selector={(state) => ({ isValid: state.isValid, fieldMeta: state.fieldMeta })}>
                {({ isValid, fieldMeta }) => {
                  const otpTouched = !!(fieldMeta as any)["otp"]?.isTouched
                  const enable = isValid && otpTouched
                  return (
                    <button
                      type="submit"
                      className="flex-1 mx-auto mt-4 cursor-pointer rounded-full border border-white/20 from-primary to-primary/0 px-4 py-2 text-sm font-medium transition-all not-disabled:bg-linear-to-l not-disabled:text-white/90 not-disabled:hover:text-white not-disabled:hover:bg-primary not-disabled:hover:scale-102 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/0 disabled:text-white/50"
                      disabled={isVerifying || !enable}
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
                  )
                }}
              </Subscribe2>
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
              The following fields are optional. Click{" "}
              <strong>Complete Registration</strong> to finish.
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
                        "w-full rounded-lg border border-[#ADADAD] bg-white px-3 py-3 text-sm text-black/70 placeholder-[#808080] transition-all focus:bg-white focus:text-black focus:ring-2 focus:ring-[#1976D2] focus:outline-none",
                        isTouched &&
                          errors.length > 0 &&
                          "border-red-500 focus:ring-red-500"
                      )}
                      rows={4}
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
                  <div key={link.id} className="flex rounded-lg border-2 border-[#5555AA]/40 bg-[#3D3D6B] transition-all has-focus:border-primary has-focus:border-2">
                    <input
                      type="url"
                      placeholder="https://example.com/profile"
                      className="flex-1 rounded-lg pl-3 py-2 text-sm text-white/60 focus:text-white/90 placeholder-white/40 bg-transparent focus:outline-none"
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
                      className="rounded-lg p-2 text-white/50 hover:text-white/80"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                {socialLinksData.length < 5 && (
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
                )}
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
                      className="mb-2 w-full rounded-lg border border-[#ADADAD] bg-white/80 px-3 py-2 text-sm text-background/70 placeholder-[#808080] transition-all focus:ring-2 focus:ring-[#1976D2] focus:outline-none text-center"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Clear any previous errors when new file is selected
                          setUploadError(null)
                          
                          // Check file size (max 5MB)
                          const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
                          if (file.size > maxSizeInBytes) {
                            const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
                            setUploadError(
                              `File size (${fileSizeInMB}MB) exceeds the maximum allowed size of 5MB`
                            )
                            if (portfolioInputRef.current) {
                              portfolioInputRef.current.value = ""
                            }
                            field.handleChange("")
                            return
                          }

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
                              field.handleChange("")
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
                    {field.state.value && portfolioInputRef.current?.files?.[0] && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                        <div className="text-sm text-white/80">📄 {portfolioInputRef.current.files[0].name}</div>
                      </div>
                    )}
                  </div>
                )
              }}
            </Field3>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 mt-4 rounded-full border border-primary px-4 py-2 font-medium text-white/90 hover:bg-primary/10 focus:outline-none"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 mx-auto mt-4 cursor-pointer rounded-full border border-white/20 from-primary to-primary/0 px-4 py-2 text-sm font-medium transition-all not-disabled:bg-linear-to-l not-disabled:text-white/90 not-disabled:hover:text-white not-disabled:hover:bg-primary not-disabled:hover:scale-102 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-primary/0 disabled:text-white/50"
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
