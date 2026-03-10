"use client"

import * as React from "react"
import {
  ClipboardList,
  FileText,
  Package,
  SquareTerminal,
  Users,
  ShoppingCart,
  Beaker,
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
    icon?: LucideIcon
    permission?: Permission
    items?: {
      title: string
      url: string
      icon?: LucideIcon
      permission?: Permission
    }[]
  }[]
}

export interface NavGroup {
  title: string
  permission?: Permission
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Platform",
    items: [
      {
        title: "Analytics",
        url: "/dashboard",
        icon: SquareTerminal,
        items: [
          { title: "Overview", url: "/dashboard", icon: SquareTerminal },
          { title: "Reports", url: "/dashboard/reports", icon: FileText, permission: "view:reports" },
        ],
      },
      {
        title: "Administration",
        url: "/dashboard/users",
        icon: Users,
        permission: "view:users",
        items: [
          {
            title: "Users",
            url: "/dashboard/users",
            items: [
              { title: "Users List", url: "/dashboard/users" },
              { title: "Departments", url: "/users/departments" },
            ],
          },
          {
            title: "Rooms",
            url: "/dashboard/rooms",
            permission: "view:rooms",
            items: [
              { title: "Management", url: "/dashboard/rooms" },
            ],
          },
        ],
      },
      {
        title: "Approvals",
        url: "/staff",
        icon: ShoppingCart,
        permission: "approve:requests",
        items: [
          {
            title: "Requests",
            url: "/staff",
            items: [
              { title: "Transfer", url: "/staff" },
              { title: "Replace", url: "/staff" },
              { title: "Dispose", url: "/staff" },
            ],
          },
        ],
      },
    ]
  },
  {
    title: "Secretary",
    permission: "view:items",
    items: [
      {
        title: "Inventory",
        url: "/secretary/items",
        icon: Package,
        items: [
          { title: "Items", url: "/secretary/items" },
          { title: "All Instances", url: "/secretary/instances" },
          { title: "Categories", url: "/secretary/categories" },
        ],
      },
      {
        title: "Activities",
        url: "/secretary/distribute",
        icon: ClipboardList,
        items: [
          { title: "Distribute", url: "/secretary/distribute", permission: "manage:items" },
          { title: "Records", url: "/secretary/records" },
          { title: "Bin", url: "/secretary/bin", permission: "manage:items" },
        ],
      },
    ],
  },
  {
    title: "Lab Technician",
    permission: "view:equipment",
    items: [
      {
        title: "Inventory",
        url: "/labtech/equipment",
        icon: Beaker,
        items: [
          { title: "All Instances", url: "/labtech/instances" },
          { title: "Equipment", url: "/labtech/equipment" },
          { title: "Apparatus", url: "/labtech/apparatus" },
          { title: "Chemicals", url: "/labtech/chemicals" },
          { title: "Categories", url: "/labtech/categories" },
        ],
      },
      {
        title: "Activities",
        url: "/labtech/borrow",
        icon: ClipboardList,
        items: [
          { title: "Usage Tracking", url: "/labtech/usage" },
          { title: "Borrow Items", url: "/labtech/borrow", permission: "manage:equipment" },
          { title: "Records", url: "/labtech/records" },
          { title: "Bin", url: "/labtech/bin", permission: "manage:equipment" },
        ],
      },
    ],
  },
]

const staffNavItems: NavItem[] = [
  {
    title: "My Items",
    url: "/dashboard/staff",
    icon: Package,
    items: [
      {
        title: "My Borrows",
        url: "/dashboard/staff/borrows",
        permission: "view:own-borrows",
      },
      {
        title: "My Lab Borrows",
        url: "/dashboard/staff/lab-borrows",
        permission: "view:own-borrows",
      },
      {
        title: "My Chemicals",
        url: "/dashboard/staff/chemicals",
        permission: "view:own-chemicals",
      },
    ],
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
      'manage:users', 'manage:departments', 'manage:items', 'manage:equipment',
      'manage:chemicals', 'borrow:items', 'borrow:equipment', 'use:chemicals',
      'approve:requests', 'submit:requests', 'view:reports', 'view:own-borrows',
      'view:own-chemicals', 'manage:rooms', 'view:users', 'view:items',
      'view:equipment', 'view:chemicals', 'view:records', 'export:data',
      'print:reports', 'view:rooms', 'view:departments',
    ],
    SECRETARY: [
      'manage:items', 'borrow:items', 'view:reports', 'view:items',
      'view:records', 'export:data', 'print:reports',
    ],
    LABTECH: [
      'manage:equipment', 'manage:chemicals', 'borrow:equipment',
      'use:chemicals', 'view:reports', 'view:equipment', 'view:chemicals',
      'view:records', 'export:data',
    ],
    DEAN: [
      'view:reports', 'view:users', 'view:items', 'view:equipment',
      'view:chemicals', 'view:records', 'export:data', 'view:rooms',
      'view:departments',
    ],
    STAFF: [
      'submit:requests', 'view:own-borrows', 'view:own-chemicals',
    ],
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

  const filteredGroups = navGroups.map((group) => {
    // If user lacks group-level permission, hide the whole group
    if (group.permission && !hasPermissionClient(userRoles, group.permission)) {
      return null
    }

    // Filter items within the group
    const filteredItems = group.items.map((item) => {
      if (item.permission && !hasPermissionClient(userRoles, item.permission)) {
        return null
      }
      if (item.permission === "approve:requests" && !isApprover) {
        return null
      }

      // Also filter nested sub-items by their individual permissions
      if (item.items) {
        const filteredSubItems = item.items.filter((sub) => {
          if (!sub.permission) return true
          return hasPermissionClient(userRoles, sub.permission)
        })
        return { ...item, items: filteredSubItems }
      }

      return item
    }).filter(Boolean) as NavItem[]

    if (filteredItems.length === 0) return null

    return { ...group, items: filteredItems }
  }).filter(Boolean) as NavGroup[]

  const staffFiltered = staffNavItems.map((item) => {
    const filteredSubs = item.items?.filter((sub) => {
      if (!sub.permission) return true
      if (isStaffOnly || hasPermissionClient(userRoles, sub.permission)) return true
      return false
    })

    if (!filteredSubs?.length) return null
    return { ...item, items: filteredSubs }
  }).filter(Boolean) as NavItem[]

  // Append staff items into a "Personal" group if applicable
  const showStaffSection = isStaffOnly || primaryRole === "ADMIN"
  if (showStaffSection && staffFiltered.length > 0) {
    filteredGroups.push({
      title: "Personal",
      items: staffFiltered
    })
  }

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
        {filteredGroups.map((group) => (
          <NavMain key={group.title} title={group.title} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={displayUser}
          role={primaryRole}
          profileUrl={primaryRole === "STAFF" ? "/dashboard/staff/profile" : "/dashboard/profile"}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
