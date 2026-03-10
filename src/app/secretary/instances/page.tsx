import { Suspense } from "react"
import { requirePermission } from "@/lib/permissions"
import { getAllInstances } from "@/actions/instances"
import { getCategories } from "@/actions/secretary"
import { InstanceTable } from "./InstanceTable"
import { ExportCSVTrigger } from "./ExportCSVTrigger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

export default async function InstancesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { roles } = await requirePermission('view:items')
    const isDean = roles.includes('DEAN')
    const resolvedParams = await searchParams

    const filters = {
        search: resolvedParams.search as string,
        condition: resolvedParams.condition as 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED',
        status: resolvedParams.status as 'available' | 'borrowed',
        categoryId: resolvedParams.categoryId ? parseInt(resolvedParams.categoryId as string) : undefined,
        page: parseInt(resolvedParams.page as string || '1'),
        pageSize: 20
    }

    const [data, categories] = await Promise.all([
        getAllInstances(filters),
        getCategories()
    ])

    const { summaryCounts } = data

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/secretary/items">Secretary</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Instances</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center justify-between mt-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">All Instances</h1>
                        <p className="text-muted-foreground text-sm">
                            Complete audit of all physical non-consumable units
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-3 py-1.5 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
                            {summaryCounts.total} Total Units
                        </Badge>
                        <ExportCSVTrigger filters={filters} />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
                        <Package className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryCounts.total}</div>
                        <p className="text-xs text-muted-foreground text-blue-500 font-medium mt-1">Global count</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryCounts.available}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready to borrow</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryCounts.borrowed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently with holders</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Damaged/Poor</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryCounts.damaged}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-red-500/80">Needs attention</p>
                    </CardContent>
                </Card>
            </div>

            <Suspense fallback={<div>Loading instances...</div>}>
                <InstanceTable
                    initialData={data}
                    categories={categories}
                    filters={filters}
                    isReadOnly={isDean}
                />
            </Suspense>
        </div>
    )
}
