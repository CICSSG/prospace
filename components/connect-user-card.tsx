"use client"

import Image from "next/image"

type UserConnection = {
  id?: string
  _id?: string
  fullName?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  course?: string
  school?: string
  email?: string
}

type ConnectUserCardProps = {
  user: UserConnection
  onClick: () => void
}

export default function ConnectUserCard({ user, onClick }: ConnectUserCardProps) {
  const displayName =
    user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed User"

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-row items-center gap-4 rounded-lg border border-white/50 bg-linear-to-r from-primary/20 p-4 text-left transition hover:border-white/80 hover:bg-primary/30"
    >
      <Image
        src={user.profileImageUrl || "/images/ProspaceMinimalLogo-2.png"}
        alt={displayName}
        width={50}
        height={50}
        className="rounded-full"
      />
      <div>
        <p>{displayName}</p>
        <p className="text-sm text-muted-foreground">
          {user.course || user.email || "No course provided"}
        </p>
        <p className="text-sm text-muted-foreground">
          {user.school || user.email || "No school provided"}
        </p>
      </div>
    </button>
  )
}
