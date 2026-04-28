import { EmailTemplate } from "@/components/email-template"
import React from "react"

const EmailPage = () => {
  return (
    <div className="mt-30 mb-10">
      <EmailTemplate
        title="Registration Successful"
        name="John Doe"
        content="You are now officially registered for ProSpace 2026: The DLSU-D Tech and Career Expo. Thank you for signing up with us!"
      />
    </div>
  )
}

export default EmailPage
