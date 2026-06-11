export type MissionLink = {
  title: string
  link: string
}

export type Mission = {
  id: string
  missionTitle: string
  description?: string
  completionMethod?: "qr-scanning" | "help-desk" | "sign-up"
  requiredSignups?: number | null
  isRequired?: boolean
  links?: MissionLink[]
  missionLinks?: string[]
  missionLink?: string
  categoryId?: string
  categoryName?: string
}

export type MissionCategory = {
  id: string
  categoryName: string
  createdAt: string
  updatedAt: string
}
