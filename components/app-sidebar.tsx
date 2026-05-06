"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
  Building2,
  CalendarDays,
  Target,
} from "lucide-react"
import Image from "next/image"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navigation: {
    title: "Manage",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: <LayoutDashboardIcon />,
      },
      {
        title: "Logo Loop",
        url: "/admin/logo-loop",
        icon: <ListIcon />,
      },
      {
        title: "Companies",
        url: "/admin/company",
        icon: <Building2 />,
      },
      {
        title: "Sessions",
        url: "/admin/sessions",
        icon: <CalendarDays />,
      },
      {
        title: "Missions",
        url: "/admin/missions",
        icon: <Target />,
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: <UsersIcon />,
      },
    ],
  },

  dataNavigation: {
    title: "Manage",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: <LayoutDashboardIcon />,
      },
      {
        title: "Sessions",
        url: "/admin/sessions",
        icon: <CalendarDays />,
      },
      {
        title: "Missions",
        url: "/admin/missions",
        icon: <Target />,
      },
    ],
  },

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: <FileIcon />,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userData?: any
}

export function AppSidebar({ userData, ...props }: AppSidebarProps) {
  // Get user role from Clerk publicMetadata
  const rawRole = userData?.publicMetadata?.role as string | undefined
  const userRole = (rawRole === "company" ? "data" : rawRole) as "admin" | "data" | null
  const adminRole = userData?.publicMetadata?.adminRole as "superadmin" | "admin" | null

  // Filter navigation based on role
  let navigationData = data.navigation
  
  if (userRole === "data") {
    navigationData = data.dataNavigation
  } else if (userRole === "admin" && adminRole !== "superadmin") {
    // Admin (non-super) cannot see Users
    navigationData = {
      ...data.navigation,
      items: data.navigation.items.filter((item) => item.title !== "Users"),
    }
  }

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
                src={"/images/ProspaceMinimalLogo.png"}
                alt={"Prospace Logo"}
                height={25}
                width={25}
                className="object-contain aspect-square"
              />
              <span className="text-base font-semibold">ProSpace</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain data={navigationData} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
