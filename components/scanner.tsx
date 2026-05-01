"use client"
import { useUser } from "@clerk/nextjs"
import { ReactQRCode } from "@lglab/react-qr-code"
import { Scanner } from "@yudiel/react-qr-scanner"
import { QrCode, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=${user?.id}&type=user`

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
    detectedCodes.forEach((code: { format: any; rawValue: any }) => {
      console.log(`Format: ${code.format}, Value: ${code.rawValue}`)
    })

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

            <div className="rounded-xl overflow-hidden">
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
