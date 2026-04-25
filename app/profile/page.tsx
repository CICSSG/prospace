
"use client"
import { Button } from "@base-ui/react"
import { UserProfile, useUser } from "@clerk/nextjs"
import { ReactQRCode, ReactQRCodeRef } from "@lglab/react-qr-code"
import { QrCode } from "lucide-react"
import { useRef } from "react"

export default function Profile() {
  const { user } = useUser()
  console.log("User data:", user) // Log the user object to verify its structure and content
  const QRRef = useRef<ReactQRCodeRef>(null)
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=${user?.id}&type=user`

  const handleDownload = () => {
    if (QRRef.current) {
      QRRef.current.download({name: `${user?.fullName}-qr-code.png`, format: "png", size: 2000})
    }
  }

  return (
    <div className="pt-30 pb-4 bg-linear-to-r from-purple-500/15 to-pink-500/15 w-full h-screen flex items-center justify-center">
      <UserProfile
        appearance={{
          options: {
            unsafe_disableDevelopmentModeWarnings: true,
          },
        }}
        routing="hash"
      >
        <UserProfile.Page
          label="QR Code"
          labelIcon={<QrCode size={16} />}
          url="/qr"
        >
          <div className="flex h-fit flex-col gap-2 overflow-hidden">
            {/* Link: {link} */}
            <div className="flex flex-row justify-between items-center">
              <h1 className="font-bold">Your QR Code</h1>
              <button className="bg-primary px-2 py-1 rounded" onClick={handleDownload}>
                Download
              </button>
            </div>
            <hr />
            <div className="flex shrink w-full h-fit mt-4 justify-center">
                <ReactQRCode
              size={480}
                marginSize={3}
                background={"white"}
                gradient={{
                  type: "linear",
                  stops: [
                    { color: "#5c41c7", offset: "0" },
                    { color: "#702056", offset: "100%" },
                  ],
                  rotation: 60,
                }}
                dataModulesSettings={{
                  style: "star",
                }}
                finderPatternOuterSettings={{
                  style: "inpoint-sm",
                }}
                finderPatternInnerSettings={{
                  style: "rounded",
                }}
                imageSettings={{
                  src: "/images/CICSSG.png",
                  height: 60,
                  width: 60,
                  excavate: true,
                }}
                value={link}
                ref={QRRef}
              />
            </div>
          </div>
        </UserProfile.Page>
        <UserProfile.Page label="account" />
    <UserProfile.Page label="security" />
      </UserProfile>
    </div>
  )
}
