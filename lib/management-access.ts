export type PagePermission = "view" | "edit" | "false"

export type PageAccessSection = Record<
  string,
  PagePermission | boolean | null | undefined
>

export type PageAccess = Partial<Record<"manage" | "data" | "company", PageAccessSection>>

export type ManagementSectionKey = keyof PageAccess

export type ManagementPageDefinition = {
  key: string
  title: string
  url: string
  accessKeys: string[]
  section: ManagementSectionKey
  iconKey: "dashboard" | "list" | "building" | "calendar" | "target" | "users" | "chart"
}

export type ManagementAccessMetadata = {
  role?: "user" | "admin" | null
  adminRole?: "superadmin" | "admin" | null
  pageAccess?: PageAccess | null
  isAdmin?: boolean
  assignedCompany?: string | null
  assignedCompanies?: Array<{ id: string; name: string }> | null
  companyName?: string | null
}

export function getAssignedCompanyIds(metadata: ManagementAccessMetadata | undefined): string[] {
  const list = metadata?.assignedCompanies
  if (Array.isArray(list) && list.length > 0) {
    return list.map((c) => String(c.id || "").trim()).filter(Boolean)
  }
  const single = String(metadata?.assignedCompany || "").trim()
  return single ? [single] : []
}

export function buildExplicitPageAccess(pageAccess: PageAccess | null | undefined): PageAccess {
  return managementPageSections.reduce((acc, section) => {
    const sectionAccess = pageAccess?.[section.key] || {}

    acc[section.key] = section.items.reduce((sectionMap, page) => {
      const permission = page.accessKeys
        .map((key) => sectionAccess[key])
        .find((value) => value === "view" || value === "edit")

      const normalizedPermission = (permission || false) as PagePermission | boolean

      page.accessKeys.forEach((key) => {
        sectionMap[key] = normalizedPermission
      })

      return sectionMap
    }, {} as PageAccessSection)

    return acc
  }, {} as PageAccess)
}

export const managementPageSections: Array<{
  key: ManagementSectionKey
  title: string
  items: ManagementPageDefinition[]
}> = [
  {
    key: "manage",
    title: "Manage",
    items: [
      {
        key: "dashboard",
        title: "Dashboard",
        url: "/admin/dashboard",
        accessKeys: ["/dashboard", "dashboard"],
        section: "manage",
        iconKey: "dashboard",
      },
      {
        key: "logo-loop",
        title: "Logo Loop",
        url: "/admin/logo-loop",
        accessKeys: ["/logo-loop", "logoloop", "logo-loop"],
        section: "manage",
        iconKey: "list",
      },
      {
        key: "company",
        title: "Companies",
        url: "/admin/company",
        accessKeys: ["/company", "/companies", "company", "companies"],
        section: "manage",
        iconKey: "building",
      },
      {
        key: "sessions",
        title: "Sessions",
        url: "/admin/sessions",
        accessKeys: ["/sessions", "sessions"],
        section: "manage",
        iconKey: "calendar",
      },
      {
        key: "missions",
        title: "Missions",
        url: "/admin/missions",
        accessKeys: ["/missions", "missions"],
        section: "manage",
        iconKey: "target",
      },
      {
        key: "user-missions",
        title: "User Missions",
        url: "/admin/user-missions",
        accessKeys: ["/user-missions", "user-missions"],
        section: "manage",
        iconKey: "target",
      },
      {
        key: "user-checkins",
        title: "User Check-ins",
        url: "/admin/user-checkins",
        accessKeys: ["/user-checkins", "user-checkins"],
        section: "manage",
        iconKey: "calendar",
      },
      {
        key: "users",
        title: "Users",
        url: "/admin/users",
        accessKeys: ["/users", "users"],
        section: "manage",
        iconKey: "users",
      },
      {
        key: "analytics",
        title: "Analytics",
        url: "/admin/analytics",
        accessKeys: ["/analytics", "analytics"],
        section: "manage",
        iconKey: "chart",
      },
    ],
  },
  {
    key: "data",
    title: "Data",
    items: [
      {
        key: "data-attendance",
        title: "Attendance",
        url: "/data/attendance",
        accessKeys: ["/data/attendance", "data/attendance"],
        section: "data",
        iconKey: "calendar",
      },
      {
        key: "data-missions",
        title: "Missions",
        url: "/data/missions",
        accessKeys: ["/data/missions", "data/missions"],
        section: "data",
        iconKey: "target",
      }
    ],
  },
  {
    key: "company",
    title: "Company",
    items: [
      {
        key: "company-dashboard",
        title: "Dashboard",
        url: "/company/dashboard",
        accessKeys: ["/company/dashboard", "company/dashboard"],
        section: "company",
        iconKey: "dashboard",
      },
      {
        key: "company-check-ins",
        title: "Check-ins",
        url: "/company/check-ins",
        accessKeys: ["/company/check-ins", "company/check-ins"],
        section: "company",
        iconKey: "calendar",
      },
    ],
  },
]

export const managePagePermissions =
  managementPageSections
    .find((section) => section.key === "manage")
    ?.items.map((page) => ({
      key: page.accessKeys[0] ?? page.url,
      label: page.title,
    })) ?? []

export function getManagementPageAccessState(
  metadata: ManagementAccessMetadata | undefined,
  section: ManagementSectionKey,
  pageKeys: string[]
) {
  const adminRole = metadata?.adminRole
  const pageAccess = metadata?.pageAccess

  if (adminRole === "superadmin") {
    return {
      canView: true,
      canEdit: true,
    }
  }

  if (section === "company" && adminRole === "admin" && String(metadata?.assignedCompany || "").trim()) {
    return {
      canView: true,
      canEdit: true,
    }
  }

  const sectionAccess = pageAccess?.[section]
  if (!sectionAccess) {
    return {
      canView: false,
      canEdit: false,
    }
  }

  const permission = pageKeys
    .map((key) => sectionAccess[key])
    .find((value) => value === "view" || value === "edit") as
    | PagePermission
    | undefined

  return {
    canView: permission === "view" || permission === "edit",
    canEdit: permission === "edit",
  }
}

export function hasAnyManagementPageAccess(pageAccess: PageAccess | undefined) {
  return managementPageSections.some((section) => {
    const sectionAccess = pageAccess?.[section.key]
    return sectionAccess
      ? section.items.some((page) =>
          hasPagePermission(sectionAccess, page.accessKeys)
        )
      : false
  })
}

export function hasPagePermission(
  access: PageAccessSection | undefined,
  pageKeys: string[],
  allowedValues: Array<"view" | "edit"> = ["view", "edit"]
) {
  const permission = pageKeys
    .map((key) => access?.[key])
    .find((value) => value !== undefined)

  return allowedValues.includes(permission as "view" | "edit")
}

function hasCompanyCheckInsFallback(access: PageAccessSection | undefined) {
  return false
}

function hasCompanyCheckInsAccess(access: PageAccessSection | undefined) {
  return (
    hasPagePermission(access, ["/company/check-ins", "company/check-ins"]) ||
    hasCompanyCheckInsFallback(access)
  )
}

export function getPageDefinition(pathname: string) {
  return managementPageSections
    .flatMap((section) => section.items)
    .find((page) => pathname === page.url || page.accessKeys.includes(pathname))
}

export function canAccessManagementPath(
  pathname: string,
  pageAccess: PageAccess | undefined,
  adminRole: "superadmin" | "admin" | null | undefined,
  assignedCompany?: string | null
) {
  const page = getPageDefinition(pathname)

  if (!page) {
    return true
  }

  if (adminRole === "superadmin") {
    return true
  }

  if (pathname.startsWith("/company/") && adminRole === "admin" && String(assignedCompany || "").trim()) {
    return true
  }

  const sectionAccess = pageAccess?.[page.section]
  if (!sectionAccess) {
    return false
  }

  if (pathname === "/company/check-ins") {
    return hasCompanyCheckInsAccess(sectionAccess)
  }

  return hasPagePermission(sectionAccess, page.accessKeys)
}

export function getDefaultManagementRoute(
  pageAccess: PageAccess | undefined,
  adminRole: "superadmin" | "admin" | null | undefined,
  assignedCompany?: string | null
) {
  const visibleSections = managementPageSections

  for (const section of visibleSections) {
    if (adminRole === "superadmin") {
      return section.items[0]?.url ?? "/"
    }

    if (section.key === "company" && adminRole === "admin" && String(assignedCompany || "").trim()) {
      return section.items[0]?.url ?? "/"
    }

    const sectionAccess = pageAccess?.[section.key]
    if (!sectionAccess) continue

    const firstAllowedPage = section.items.find((page) =>
      hasPagePermission(sectionAccess, page.accessKeys)
    )
    if (firstAllowedPage) {
      return firstAllowedPage.url
    }
  }

  return "/"
}

export function getVisibleManagementSections(
  pageAccess: PageAccess | undefined,
  adminRole: "superadmin" | "admin" | null | undefined
) {
  return managementPageSections
    .map((section) => {
      const sectionAccess = pageAccess?.[section.key]
      const items =
        adminRole === "superadmin"
          ? section.items
          : section.items.filter((page) =>
              page.url === "/company/check-ins"
                ? hasCompanyCheckInsAccess(sectionAccess)
                : hasPagePermission(sectionAccess, page.accessKeys)
            )

      return {
        ...section,
        items,
      }
    })
    .filter((section) => section.items.length > 0)
}
