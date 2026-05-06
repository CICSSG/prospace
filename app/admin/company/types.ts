export type SocialLink = {
  platform: string
  url: string
}

export type Company = {
  id: string
  imageUrl: string
  name: string
  logoUrl: string
  socialLinks: SocialLink[]
  companyEmail: string
  moderatorEmails: string[]
  description: string
  companyId?: number
}
