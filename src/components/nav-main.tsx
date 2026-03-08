"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavMainSubItem[]
}

export interface NavMainSubItem {
  title: string
  url: string
  icon?: LucideIcon
  items?: NavMainSubSubItem[]
}

export interface NavMainSubSubItem {
  title: string
  url: string
  icon?: LucideIcon
}

export function NavMain({
  title,
  items,
}: {
  title?: string
  items: NavMainItem[]
}) {
  const pathname = usePathname()

  const isItemActive = (item: NavMainItem) => {
    if (item.isActive || item.url === pathname) return true
    return item.items?.some((sub: NavMainSubItem) =>
      pathname.startsWith(sub.url) ||
      sub.items?.some((subSub: NavMainSubSubItem) => pathname.startsWith(subSub.url))
    )
  }

  // Initialize openItem state based on current pathname immediately
  const [openItem, setOpenItem] = React.useState<string | null>(() => {
    const activeItem = items.find(isItemActive)
    return activeItem ? activeItem.title : null
  })

  // Handle manual toggling
  const handleOpenChange = (title: string, open: boolean) => {
    if (open) {
      setOpenItem(title)
    } else if (openItem === title) {
      setOpenItem(null)
    }
  }

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = !!item.items?.length
          const active = isItemActive(item)

          return (
            <Collapsible
              key={item.title}
              open={openItem === item.title}
              onOpenChange={(open) => handleOpenChange(item.title, open)}
            >
              <SidebarMenuItem className="group/collapsible">
                {hasSubItems ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={active}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}

                {hasSubItems && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem: NavMainSubItem) => {
                        const hasSubSubItems = !!subItem.items?.length
                        const isSubItemActive = pathname === subItem.url || subItem.items?.some((sub: NavMainSubSubItem) => pathname.startsWith(sub.url))

                        if (hasSubSubItems) {
                          return (
                            <Collapsible key={subItem.title} defaultOpen={isSubItemActive}>
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton isActive={isSubItemActive}>
                                    <span>{subItem.title}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {subItem.items?.map((subSubItem: NavMainSubSubItem) => (
                                      <SidebarMenuSubItem key={subSubItem.title}>
                                        <SidebarMenuSubButton asChild isActive={pathname === subSubItem.url}>
                                          <Link href={subSubItem.url}>
                                            {subSubItem.icon && <subSubItem.icon className="h-4 w-4" />}
                                            <span>{subSubItem.title}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuSubItem>
                            </Collapsible>
                          )
                        }

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
