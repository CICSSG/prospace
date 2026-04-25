"use client"

import { UserButton } from "@clerk/nextjs"
import { Link, TargetIcon, UserRoundPlus } from "lucide-react"

export default function UserButtonClerk() {
  return (
    <UserButton
    
    userProfileMode="navigation"
    userProfileUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/profile`}
      appearance={{
        options: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Link
          href="/connections"
          label="Connections"
          labelIcon={<UserRoundPlus size={16} />}
        />
        <UserButton.Link
          href="/missions"
          label="Missions"
          labelIcon={<TargetIcon size={16} />}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
