"use client"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-provider"

export function SiteHeader() {
  const pathname = usePathname()
  const path = pathname.split("/")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        {path.map((segment, index) => {
          if (index <= 1) {
            return null
          }
          if (index === path.length - 1) {
            return (
              <span key={index} className="text-sm font-medium">
                {segment.charAt(0).toUpperCase() + segment.slice(1)}
              </span>
            )
          } else {
            return (
              <Link
                key={index}
                href={path.slice(0, index + 1).join("/")}
                className="cursor-pointer text-sm text-muted-foreground hover:text-primary-foreground hover:underline"
              >
                {segment.charAt(0).toUpperCase() + segment.slice(1)} {">"}
              </Link>
            )
          }
        })}
        <Separator
          orientation="vertical"
          className="mx-2 ml-auto h-4 data-vertical:self-auto"
        />
        <ThemeToggle />
      </div>
    </header>
  )
}
