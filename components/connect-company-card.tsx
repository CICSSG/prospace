"use client"

import Image from "next/image"

type CompanyConnection = {
  id?: string
  _id?: string
  name?: string
  imageUrl?: string
  logoUrl?: string
  description?: string
  companyEmail?: string
}

type ConnectCompanyCardProps = {
  company: CompanyConnection
  onClick: () => void
}

export default function ConnectCompanyCard({ company, onClick }: ConnectCompanyCardProps) {
  const displayName = company.name || "Unnamed Company"
  const primaryImage = company.logoUrl || company.imageUrl || "/images/ProspaceMinimalLogo-2.png"

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-row items-center gap-4 rounded-lg border border-white/50 bg-linear-to-r from-primary/20 p-4 text-left transition hover:border-white/80 hover:bg-primary/30"
    >
      <Image
        src={primaryImage}
        alt={displayName}
        width={50}
        height={50}
        className="rounded-full object-cover"
      />
      <div>
        <p>{displayName}</p>
        <p className="text-sm text-muted-foreground">
          {company.description || "No description provided"}
        </p>
        <p className="text-sm text-muted-foreground">
          {company.companyEmail || "No company email provided"}
        </p>
      </div>
    </button>
  )
}
