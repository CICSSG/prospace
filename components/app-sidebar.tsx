
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Building2, CalendarDays, LayoutDashboardIcon, ListIcon, Target, UsersIcon } from "lucide-react"
import Image from "next/image"
import {
  getVisibleManagementSections,
  type ManagementPageDefinition,
  type PageAccess,
} from "@/lib/management-access"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userData?: any
}

const iconByKey = {
  dashboard: <LayoutDashboardIcon />,
  list: <ListIcon />,
  building: <Building2 />,
  calendar: <CalendarDays />,
  target: <Target />,
  users: <UsersIcon />,
} satisfies Record<ManagementPageDefinition["iconKey"], React.ReactNode>

export function AppSidebar({ userData, ...props }: AppSidebarProps) {
  const adminRole = userData?.publicMetadata?.adminRole as "superadmin" | "admin" | null
  const pageAccess = userData?.publicMetadata?.pageAccess as PageAccess | undefined

  const visibleSections = getVisibleManagementSections(pageAccess, adminRole)
  const sectionsWithIcons = visibleSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      icon: iconByKey[item.iconKey],
    })),
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/admin/dashboard" />}
            >
              <Image
                src="/images/ProspaceMinimalLogo.png"
                alt="Prospace Logo"
                height={25}
                width={25}
              />
              <span className="text-base font-semibold">ProSpace</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sectionsWithIcons.map((section) => (
          <NavMain key={section.key} data={section} />
        ))}
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
