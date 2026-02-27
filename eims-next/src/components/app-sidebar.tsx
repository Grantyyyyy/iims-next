"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Package,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Secretary Module",
      url: "/secretary",
      icon: BookOpen,
      items: [
        {
          title: "Items",
          url: "/secretary/items",
        },
        {
          title: "Categories",
          url: "/secretary/categories",
        },
        {
          title: "Borrow/Return",
          url: "/secretary/records",
        },
      ],
    },
    {
      title: "Labtech Module",
      url: "/labtech",
      icon: Bot,
      items: [
        {
          title: "Equipment",
          url: "/labtech/equipment",
        },
        {
          title: "Chemicals",
          url: "/labtech/chemicals",
        },
        {
          title: "Apparatus",
          url: "/labtech/apparatus",
        },
        {
          title: "Categories",
          url: "/labtech/categories",
        },
      ],
    },
    {
      title: "Users Module",
      url: "/users",
      icon: Users,
      items: [
        {
          title: "Staff & Students",
          url: "/users/list",
        },
        {
          title: "Departments",
          url: "/users/departments",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
  ],
  projects: [
    {
      name: "Supply Office",
      url: "/supply",
      icon: Frame,
    },
    {
      name: "Staff Requests",
      url: "/staff",
      icon: PieChart,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const displayUser = user || {
    name: "User",
    email: "user@eims.local",
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">EIMS</span>
                  <span className="truncate text-xs">Equipment & Inventory</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
