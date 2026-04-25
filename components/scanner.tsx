"use client"
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
  const router = useRouter()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)

  const handleScan = (detectedCodes: any) => {
    const rawValue = detectedCodes?.[0]?.rawValue

    if (!rawValue) {
      return
    }

    setScannerOpen(false)
    setScannerMessage(null)
    console.log("Detected codes:", detectedCodes)
    // detectedCodes is an array of IDetectedBarcode objects
    detectedCodes.forEach((code: { format: any; rawValue: any }) => {
      console.log(`Format: ${code.format}, Value: ${code.rawValue}`)
    })

    router.push(rawValue)

  }

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Camera access was blocked or unavailable."

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

      {scannerOpen && (
        <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/70 p-4">
          <button
            type="button"
            aria-label="Close QR scanner"
            onClick={() => {
              setScannerOpen(false)
              setScannerMessage(null)
            }}
            className="absolute right-4 top-4 z-101 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <X size={20} />
          </button>
          {scannerMessage && (
            <div className="absolute left-4 right-4 top-16 z-101 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm sm:left-auto sm:right-4 sm:top-4 sm:max-w-sm">
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
      )}
    </>
  )
}
