"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  ClipboardList,
  FileText,
  Beaker,
  Package,
  SquareTerminal,
  Users,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Permission } from "@/lib/permissions"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  permission?: Permission
  items?: {
    title: string
    url: string
  }[]
}

const allNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SquareTerminal,
  },
  {
    title: "Users",
    url: "/dashboard/users",
    icon: Users,
    permission: "manage:users",
    items: [
      { title: "Users List", url: "/dashboard/users" },
      { title: "Departments", url: "/users/departments" },
    ],
  },
  {
    title: "Room",
    url: "/dashboard/rooms",
    icon: Warehouse,
    permission: "manage:rooms",
    items: [
      { title: "Room Management", url: "/dashboard/rooms" },
    ],
  },
  {
    title: "Secretary",
    url: "/secretary",
    icon: BookOpen,
    permission: "manage:items",
    items: [
      { title: "Inventory", url: "/secretary/items" },
      { title: "Instances", url: "/secretary/instances" },
      { title: "Categories", url: "/secretary/categories" },
      { title: "Item Distribution", url: "/secretary/distribute" },
      { title: "Records", url: "/secretary/records" },
    ],
  },
  {
    title: "Labtech",
    url: "/labtech",
    icon: Bot,
    permission: "manage:equipment",
    items: [
      { title: "Equipment", url: "/labtech/equipment" },
      { title: "Apparatus", url: "/labtech/apparatus" },
      { title: "Chemicals", url: "/labtech/chemicals" },
      { title: "Categories", url: "/labtech/categories" },
    ],
  },
  {
    title: "Requests",
    url: "/staff",
    icon: ClipboardList,
    permission: "approve:requests",
    items: [
      { title: "Transfer", url: "/staff" },
      { title: "Replace", url: "/staff" },
      { title: "Dispose", url: "/staff" },
    ],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
    permission: "view:reports",
  },
]

const staffNavItems: NavItem[] = [
  {
    title: "My Borrows",
    url: "/staff/borrows",
    icon: Package,
    permission: "view:own-borrows",
  },
  {
    title: "My Chemicals",
    url: "/staff/chemicals",
    icon: Beaker,
    permission: "view:own-chemicals",
  },
  {
    title: "My Requests",
    url: "/staff/requests",
    icon: ClipboardList,
    permission: "submit:requests",
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
  userRoles?: string[]
}

function hasPermissionClient(roles: string[], permission: Permission): boolean {
  const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN: [
      "manage:users", "manage:departments", "manage:items", "manage:equipment",
      "manage:chemicals", "borrow:items", "borrow:equipment", "use:chemicals",
      "approve:requests", "submit:requests", "view:reports", "view:own-borrows",
      "view:own-chemicals", "manage:rooms",
    ],
    SECRETARY: ["manage:items", "borrow:items", "view:reports"],
    LABTECH: ["manage:equipment", "manage:chemicals", "borrow:equipment", "use:chemicals", "view:reports"],
    DEAN: ["view:reports"],
    STAFF: ["submit:requests", "view:own-borrows", "view:own-chemicals"],
    ICTC: [],
    SUPPLY: [],
  }

  return roles.some((roleName) => {
    const perms = ROLE_PERMISSIONS[roleName]
    return perms?.includes(permission) ?? false
  })
}

export function AppSidebar({ user, userRoles = [], ...props }: AppSidebarProps) {
  const displayUser = user || {
    name: "User",
    email: "user@eims.local",
    avatar: "",
  }

  const rolePriority = ["ADMIN", "SECRETARY", "LABTECH", "DEAN", "STAFF", "ICTC", "SUPPLY"]
  const primaryRole = rolePriority.find((r) => userRoles.includes(r)) || userRoles[0] || "STAFF"

  const isApprover = hasPermissionClient(userRoles, "approve:requests")
  const isStaffOnly =
    hasPermissionClient(userRoles, "view:own-borrows") &&
    !hasPermissionClient(userRoles, "manage:items") &&
    !hasPermissionClient(userRoles, "manage:equipment") &&
    !hasPermissionClient(userRoles, "approve:requests")

  const filteredNavMain = allNavItems.filter((item) => {
    if (!item.permission) return true
    if (item.permission === "approve:requests") return isApprover
    return hasPermissionClient(userRoles, item.permission)
  })

  const staffFiltered = staffNavItems.filter((item) => {
    if (!item.permission) return true
    if (isStaffOnly || hasPermissionClient(userRoles, item.permission)) return true
    return false
  })

  const showStaffSection = isStaffOnly || primaryRole === "ADMIN"
  const finalNavMain = showStaffSection
    ? [...filteredNavMain, ...staffFiltered]
    : filteredNavMain

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">IIMS</span>
                  <span className="truncate text-xs">Equipment & Inventory</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={finalNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} role={primaryRole} />
      </SidebarFooter>
    </Sidebar>
  )
}
