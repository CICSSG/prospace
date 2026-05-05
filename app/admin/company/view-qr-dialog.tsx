"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Company } from "./types"
import { ReactQRCode, ReactQRCodeRef } from "@lglab/react-qr-code"
import { useRef } from "react"

type ViewQRDialogProps = {
  company: Company | null
  onOpenChange: (open: boolean) => void
}

export default function ViewQRDialog({
  company,
  onOpenChange,
}: ViewQRDialogProps) {
  const QRRef = useRef<ReactQRCodeRef>(null)
  const qrLink = company?.companyId
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=${company.companyId}&type=company`
    : ""

  const handleDownload = () => {
    QRRef.current?.download({
      name: `company-${company?.name}`,
      format: "png",
      size: 2000,
    })
  }

  return (
    <Dialog open={!!company} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="max-w-md bg-primary/40">
        <DialogHeader>
          <DialogTitle>Company QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm font-medium">{company?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {qrLink}
            </p>
          </div>

          <div className="flex justify-center">
            <ReactQRCode
              size={300}
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
                height: 40,
                width: 40,
                excavate: true,
              }}
              value={qrLink}
              ref={QRRef}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Download
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
