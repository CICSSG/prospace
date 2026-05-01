import React from "react"
import localFont from "next/font/local"
import Link from "next/link"

const moscaLaroke = localFont({
  src: "../../../mosca-laroke.regular.otf",
  display: "swap",
})

const SignupSuccess = () => {
  return (
    <div className="mt-30 mb-10">
      <div className="flex flex-col max-w-2xl rounded-2xl border-2 border-primary bg-primary/30 px-5 py-8 mx-2">
        <div className="flex flex-row items-center gap-2 mx-auto w-fit mb-10">
          <img
            src="/images/ProspaceMinimalLogo-2.png"
            alt="ProSpace Logo"
            className="h-10 w-10 animate-pulse rounded-full"
          />
          <h1
            className={
              moscaLaroke.className + " text-center text-2xl font-bold lg:text-3xl"
            }
          >
            reGISTrATIon SUCCeSSfUL!
          </h1>
          <img
            src="/images/ProspaceMinimalLogo-2.png"
            alt="ProSpace Logo"
            className="h-10 w-10 animate-pulse rounded-full"
          />
        </div>

        <p className="mt-4 text-center text-lg">
          Thank you for signing up for{" "}
          <span className={moscaLaroke.className}>ProSPACE 2026</span>: The
          DLSU-D Tech and Career Expo. We have sent a confirmation email to your
          registered email address. Please check your inbox for more details
          about the event.
        </p>
        <p className="mt-2 text-center text-lg">
          If you have any questions or need further assistance, feel free to
          contact us at{" "}
          <a href="mailto:prospace@cicssg.com" className="text-blue-500">
            prospace@cicssg.com
          </a>{" "}
          /{" "}
          <a href="mailto:cicssg@dlsud.edu.ph" className="text-blue-500">
            cicssg@dlsud.edu.ph
          </a>
        </p>
        <p className="text-center">
          or reach out to us on our{" "}
          <a
            href="https://www.facebook.com/dlsud.cicssg"
            target="_blank"
            className="text-blue-500"
          >
            Facebook page
          </a>
          .
        </p>

        <p className="mt-4 text-center text-sm text-gray-300">
          We look forward to seeing you at the event!
        </p>

         <Link href="/"  className="mt-4 bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded text-center">
           Back to Homepage
         </Link>

      </div>
    </div>
  )
}

export default SignupSuccess
