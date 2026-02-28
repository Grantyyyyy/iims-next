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
import { requirePermission } from "@/lib/permissions"
import { ShoppingCart, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SecretaryLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, roles } = await requirePermission('manage:items')
    const sidebarUser = {
        name: user.username,
        email: user.email,
        avatar: user.profilePicUrl || '/avatars/user.jpg',
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
                                    <BreadcrumbPage>Secretary Module</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4 flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="hidden sm:flex border-primary/20 hover:border-primary/50 gap-2">
                            <Link href="/secretary/distribute">
                                <Plus className="h-4 w-4" />
                                <span>Distribute Items</span>
                            </Link>
                        </Button>
                        <Button asChild size="icon" variant="ghost" className="sm:hidden">
                            <Link href="/secretary/distribute">
                                <ShoppingCart className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
