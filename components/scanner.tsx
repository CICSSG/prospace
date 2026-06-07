"use client"
import { useUser } from "@clerk/nextjs"
import { ReactQRCode } from "@lglab/react-qr-code"
import { Scanner } from "@yudiel/react-qr-scanner"
import { QrCode } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { sora } from "./prospace/fonts"

const scannerConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
  aspectRatio: 1,
}

export default function ScannerComponent() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)
  const [viewQR, setViewQR] = useState(false)
  const [mongoUserId, setMongoUserId] = useState<string | null>(null)

  useEffect(() => {
    const clerkUserId = user?.id ? String(user.id) : ""

    if (!clerkUserId) {
      setMongoUserId(null)
      return
    }

    const controller = new AbortController()

    async function loadMongoUserId() {
      try {
        const response = await fetch(
          `/api/getUserInCollection?user_id=${encodeURIComponent(clerkUserId)}`,
          { signal: controller.signal }
        )
        const data = await response.json()
        setMongoUserId(
          data?.data?.userId != null ? String(data.data.userId) : null
        )
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load Mongo user id for QR code", error)
          setMongoUserId(null)
        }
      }
    }

    loadMongoUserId()

    return () => controller.abort()
  }, [user?.id])

  const link = mongoUserId
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=${encodeURIComponent(mongoUserId)}&type=user`
    : ""

  if (!isSignedIn) {
    return null
  }

  const handleScan = (detectedCodes: any) => {
    const rawValue = detectedCodes?.[0]?.rawValue

    if (!rawValue) {
      return
    }

    setScannerOpen(false)
    setScannerMessage(null)
    // console.log("Detected codes:", detectedCodes)
    // detectedCodes is an array of IDetectedBarcode objects
    // detectedCodes.forEach((code: { format: any; rawValue: any }) => {
    //   console.log(`Format: ${code.format}, Value: ${code.rawValue}`)
    // })

    router.push(rawValue)
  }

  const handleError = (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Camera access was blocked or unavailable."

    setScannerMessage(
      message.includes("permission") || message.includes("secure context")
        ? "Allow camera access in iPhone Safari, then reopen the scanner. If you denied access earlier, enable Camera in Settings > Safari > Camera."
        : "Camera could not start on this device. Make sure you are using HTTPS and allow camera access in Safari."
    )
    console.error("Scanner error:", error)
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open QR scanner"
        onClick={() => {
          setScannerMessage(null)
          setScannerOpen(!scannerOpen)
        }}
        className="fixed right-4 bottom-4 z-100 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/80 active:scale-95"
      >
        <QrCode size={32} />
      </button>

      {scannerOpen ? (
        viewQR ? (
          <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/70 p-2">
            <button
              type="button"
              aria-label="Close QR scanner"
              onClick={() => {
                setViewQR(false)
              }}
              className="absolute top-4 right-4 z-101 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Hide QR Code
            </button>

            <div>
              {link ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="mb-5 max-w-sm text-center text-xs text-white/80">
                    Disclaimer: By showing this QR code, you consent to the
                    collection of your personal data strictly for job fair
                    purposes in compliance with the Data Privacy Act of 2012
                  </p>
                  <div className="mb-5 overflow-hidden rounded-xl">
                    <ReactQRCode
                      size={380}
                      marginSize={2}
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
                    />
                  </div>
                  <p
                    className={`text-center text-white/80 ${sora.className} tracking-[0.3rem]`}
                  >
                    {user?.fullName ?? "Your QR Code"}
                  </p>
                  <p
                    className={`text-center text-white/80 ${sora.className} tracking-[0.3rem]`}
                  >
                    {mongoUserId}
                  </p>
                </div>
              ) : mongoUserId ? (
                <div className="max-w-sm rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-center text-sm text-white/80 shadow-2xl backdrop-blur-sm">
                  Loading your QR code...
                </div>
              ) : (
                <div className="max-w-sm rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-center text-sm text-white/80 shadow-2xl backdrop-blur-sm">
                  There was an error generating your QR code. Please proceed to the helpdesk or email us at prospace@cicssg.com.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/70 p-2">
            <button
              type="button"
              aria-label="Close QR scanner"
              onClick={() => {
                setViewQR(true)
              }}
              className="absolute top-4 right-4 z-101 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              View QR Code
            </button>
            {scannerMessage && (
              <div className="absolute top-16 right-4 left-4 z-101 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm sm:top-4 sm:right-4 sm:left-auto sm:max-w-sm">
                {scannerMessage}
              </div>
            )}
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={scannerConstraints}
              components={{
                finder: true,
              }}
              sound={false}
            />
          </div>
        )
      ) : null}
    </>
  )
}
