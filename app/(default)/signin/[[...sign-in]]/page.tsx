"use client"
import { motion } from "framer-motion"
import { sendOTP, verifyOTP, completeSignup } from "@/app/actions"
import { UploadImageToBlobStorage } from "@/app/(management)/admin/actions"
import { useForm } from "@tanstack/react-form"
import clsx from "clsx"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { permanentRedirect, RedirectType } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ClipLoader } from "react-spinners"
import { toast } from "sonner"
import z from "zod"
import { X } from "lucide-react"
import { moscaLaroke, sora } from "@/components/prospace/fonts"
import Image from "next/image"
import { Jacquard_12 } from "next/font/google";
import { SignIn } from "@clerk/nextjs";

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
    // email: z.union(
    //   [dlsudEmailValidator, dlsuEmailValidator],
    //   "Must be a valid email of any DLSU branch"
    // ),
    email: z.email("Must be a valid email address"),
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
          if (!response.success) {
            toast.error(
              response.error || "Failed to send OTP. Please try again."
            )
            return
          }

          // Check if there's a nextStep (existing tempUser found)
          if (response.data?.nextStep) {
            toast.success(response.data.message)
            setStep(response.data.nextStep)
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

  const {
    Field: Field2,
    Subscribe: Subscribe2,
    handleSubmit: handleSubmit2,
  } = useForm({
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
        .then((response: any) => {
          setIsVerifying(false)
          if (!response.success) {
            toast.error(response.error || "Failed to verify OTP")
            return
          }

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
        .then((response: any) => {
          setIsCompleting(false)
          if (!response.success) {
            toast.error(
              response.error || "Registration failed. Please try again."
            )
            return
          }

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
    <div className="h-screen w-full overflow-y-clip p-6">
      <div className="absolute w-[97vw] animate-pulse select-none animate-duration-4000 animate-ease-in-out animate-infinite">
        <motion.div className="absolute top-65 left-10 z-10 select-none lg:left-20 2xl:top-70 2xl:left-40">
          <Image
            src={"/images/HeroStarTopLeft.png"}
            alt={"Hero Star Top Left"}
            width={45}
            height={45}
            className="rotate-15 animate-spin animate-duration-8000 animate-infinite lg:size-20"
          />
        </motion.div>
        <motion.div className="absolute top-35 right-10 select-none lg:right-30 2xl:top-40 2xl:right-40">
          <Image
            src={"/images/HeroStarTopRight.png"}
            alt={"Hero Star Top Right"}
            width={40}
            height={40}
            className="rotate-30 animate-spin select-none animate-duration-25000 animate-infinite lg:size-40"
          />
        </motion.div>
        <motion.div className="absolute bottom-25 left-15 select-none lg:bottom-25 lg:left-20 2xl:bottom-30 2xl:left-80">
          <Image
            src={"/images/HeroStarBottom.png"}
            alt={"Hero Star Bottom"}
            width={60}
            height={60}
            className="animate-spin select-none animate-duration-100000 animate-infinite animate-reverse lg:size-60"
          />
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 h-full items-center justify-center z-10 relative lg:mx-auto">
        <div className="hidden lg:block">
          <div className="relative z-10 mx-15 flex flex-col items-center justify-center gap-8">
            <div className="relative">
              <Image
              src={"/images/Prospace-DLSU-D.png"}
              width={520}
              height={128}
              alt="ProSpace"
              className="z-2"
            />
            <Image
              src={"/images/Prospace-DLSU-D.png"}
              width={520}
              height={128}
              alt="ProSpace"
              className="blur absolute top-0 left-0 z-1 opacity-80"
            />
            </div>

            <p
              className={`text-light max-w-2xl text-center text-lg tracking-[0.3rem] text-white/80`}
            >
              Explore sessions, connect with partners, and start your
              professional journey.
            </p>
          </div>

          <div className="relative z-10 mx-10 mt-15 flex flex-col items-center justify-center gap-4 space-y-5">
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 lg:gap-8">
              <Image
                src={"/images/Footer DLSUD.png"}
                width={120}
                height={50}
                alt="DLSUD Logo"
                className="w-fit object-contain"
              />
              <Image
                src={"/images/Footer AARO.png"}
                width={120}
                height={50}
                alt="AARO Logo"
                className="w-fit object-contain"
              />
              <Image
                src={"/images/Footer CICSSG.png"}
                width={120}
                height={50}
                alt="CICSSG Logo"
                className="w-fit object-contain"
              />
              <Image
                src={"/images/Footer Impact.png"}
                width={120}
                height={50}
                alt="Impact Logo"
                className="w-fit object-contain"
              />
              <Image
                src={"/images/Footer Prospace.png"}
                width={120}
                height={50}
                alt="Prospace Logo"
                className="w-fit object-contain"
              />
            </div>

            <p className={`font-light text-center tracking-[0.15em] text-white ${sora.className}`}>
              &copy; {new Date().getFullYear()} DLSU-D CICSSG. All rights
              reserved.
            </p>
          </div>
        </div>

        {/* FORM */}
        {/* <div className="mx-auto w-full max-w-md rounded-lg border-2 border-white/70 bg-linear-to-r from-primary/22 p-6 shadow-2xl">
          <SignIn 
          signUpUrl="/signup"/>
        </div> */}
         <div className="mx-auto w-full max-w-md">
          <SignIn 
          signUpUrl="/signup"
            forceRedirectUrl="/"/>
        </div>
      </div>

      <footer className="relative -m-6 min-h-[45vh] w-screen overflow-x-clip bg-[#05091D] bg-linear-to-t -mt-100 pt-15 pb-10">
        <Image
          src={"/images/HalfCircle.png"}
          width={2520}
          height={1000}
          alt="Half Circle Background"
          className="absolute -top-4/6 left-1/2 w-[calc(150vw)] -translate-x-1/2 opacity-80 select-none lg:-top-full"
        />
        <div className="absolute -top-1/2 left-1/2 h-[calc(110%)] w-[calc(100vw+30%)] -translate-x-1/2 rounded-[50%] bg-[#BCA4FF]/20 blur-[100px]" />
        <div className="absolute bottom-10 z-1 h-full w-full overflow-clip">
          <Image
            src={"/images/FooterBuildingsBG.png"}
            width={1920}
            height={400}
            alt="Footer Background"
            className="z-1 h-[calc(110%)] w-full object-cover object-top opacity-30 select-none"
          />
          <div className="absolute -bottom-1/2 left-1/2 z-5 h-[calc(110%)] w-[calc(100vw+50%)] -translate-x-1/2 rounded-[50%] bg-[#05091D] blur-[50px]" />
        </div>
      </footer>
    </div>
  )
}

export default SignUpPage
