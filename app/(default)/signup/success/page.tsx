import React from "react"
import { moscaLaroke } from "@/components/prospace/fonts"
import Link from "next/link"
import { Mail } from "lucide-react"

const SignupSuccess = () => {
  return (
    <div className="mt-30 mb-10">
      <div className="mx-2 flex max-w-xl flex-col rounded-2xl border-2 border-white/50 bg-linear-to-r from-primary/30 px-5 py-8">
        <div className="mx-auto mb-10 flex w-fit flex-row items-center gap-5">
          <img
            src="/images/ProspaceMinimalLogo.png"
            alt="ProSpace Logo"
            className="h-fit w-16 animate-pulse rounded-full"
          />
          <h1
            className={
              moscaLaroke.className +
              " text-center text-2xl font-bold uppercase lg:text-3xl"
            }
          >
            rEGISTrATIon<br />SUCCeSSfUL!
          </h1>
          <img
            src="/images/ProspaceMinimalLogo.png"
            alt="ProSpace Logo"
            className="h-fit w-16 animate-pulse rounded-full"
          />
        </div>

        <p className="mt-4 text-center text-lg">
          Thank you for signing up for{" "}
          <span className={moscaLaroke.className}>ProSPACE 2026</span>
          <span className="font-semibold">
            : The DLSU-D Tech and Career Expo
          </span>
          . We have sent a confirmation email to your registered email address.
          Please check your inbox for more details about the event.
        </p>
        <p className="mt-2 text-center text-lg">
          If you have any questions or need further assistance, feel free to
          contact us at
        </p>

        <div className="flex flex-col items-center gap-2 *:font-thin mt-2">
          <a
            href="mailto:prospace@cicssg.com"
            className="mx-auto flex flex-row items-center gap-1 rounded-full border border-white px-3 py-1 text-white"
          >
            <Mail size={16} /> prospace@cicssg.com
          </a>
          <a
            href="mailto:cicssg@dlsud.edu.ph"
            className="mx-auto flex flex-row items-center gap-1 rounded-full border border-white px-4 py-1 text-white"
          >
            <Mail size={16} /> cicssg@dlsud.edu.ph
          </a>
        </div>

        <p className="text-center mt-4">
          or reach out to us on our{" "}
          <a
            href="https://www.facebook.com/dlsud.cicssg"
            target="_blank"
            className="text-[#BBA4FF]"
          >
            Facebook page
          </a>
          .
        </p>

        <p className="mt-4 text-center text-sm text-gray-300">
          We look forward to seeing you at the event!
        </p>

        <Link
          href="/"
          className="bg-linear-to-r to-primary/60 mt-4 rounded-full border border-white/50 px-4 py-2 text-center font-bold text-white transition-all hover:bg-primary/80"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  )
}

export default SignupSuccess
