import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { requireAuth, getUserPrimaryRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function StaffDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, roles } = await requireAuth()

    // Only STAFF role may access these pages
    const primaryRole = getUserPrimaryRole(roles)
    if (primaryRole !== "STAFF") {
        redirect("/dashboard")
    }

    const sidebarUser = {
        name: user.username,
        email: user.email,
        avatar: user.profilePicUrl || "/avatars/user.jpg",
    }

    return (
        <SidebarProvider>
            <AppSidebar user={sidebarUser} userRoles={roles} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard">Dashboard</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Staff Dashboard</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
