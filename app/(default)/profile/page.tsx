"use client"
import { Button } from "@base-ui/react"
import { UserProfile, useUser } from "@clerk/nextjs"
import { ReactQRCode, ReactQRCodeRef } from "@lglab/react-qr-code"
import { QrCode } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export default function Profile() {
  const { user } = useUser()
  const QRRef = useRef<ReactQRCodeRef>(null)
  const [mongoUserId, setMongoUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMongoUserId = async () => {
      if (!user?.id) return
      try {
        const response = await fetch(
          `/api/getUserInCollection?user_id=${user.id}`
        )
        const data = await response.json()
        if (data.success && data.data?._id) {
          setMongoUserId(data.data.userId)
        }
      } catch (error) {
        console.error("Failed to fetch MongoDB user ID:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMongoUserId()
  }, [user?.id])

  const link = mongoUserId
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=${mongoUserId}&type=user`
    : ""

  const handleDownload = () => {
    QRRef.current?.download({
        name: "qr-code",
        format: "png",
        size: 2000,
      })
  }

  return (
    <div className="flex items-center justify-center w-full bg-linear-to-r from-purple-500/15 to-pink-500/15 pt-30 pb-4">
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
            <div className="flex flex-row items-center justify-between">
              <h1 className="font-bold">Your QR Code</h1>
              <button
                className="rounded bg-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownload}
                disabled={loading || !link}
              >
                Download
              </button>
            </div>
            <hr />
            <div className="mt-4 flex h-fit w-full shrink justify-center">
              {loading ? (
                <div className="flex h-96 items-center justify-center text-gray-500">
                  Loading QR code...
                </div>
              ) : (
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
                    src: "/images/ProspaceMinimalLogo-2.png",
                    height: 60,
                    width: 60,
                    excavate: true,
                  }}
                  value={link}
                  ref={QRRef}
                />
              )}
            </div>
          </div>
        </UserProfile.Page>
        <UserProfile.Page label="account" />
        <UserProfile.Page label="security" />
      </UserProfile>
    </div>
  )
}
