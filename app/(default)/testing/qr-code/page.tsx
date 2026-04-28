'use client'
import { ReactQRCode } from "@lglab/react-qr-code"
import React from "react"

const QRCode = () => {
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/connect?id=10012&type=user`
  return (
    <div className="mt-30 mb-10">
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
      />
    </div>
  )
}

export default QRCode
