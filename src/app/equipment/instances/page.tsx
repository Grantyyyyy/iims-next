import { Suspense } from "react"
import { getAllLabInstances } from "@/actions/labtech"
import { Beaker, Package, AlertCircle, ClipboardCheck, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InstancesTable } from "./components/InstancesTable"
import { InstancesFilter } from "./components/InstancesFilter"
import { SummaryStats } from "./components/SummaryStats"
import { Metadata } from "next"
import { requirePermission } from "@/lib/permissions"

export const metadata: Metadata = {
    title: "Lab Instances Audit | IIMS",
    description: "Unified view of all physical lab equipment and apparatus instances.",
}

interface PageProps {
    searchParams: {
        search?: string
        type?: 'Equipment' | 'Apparatus'
        condition?: string
        status?: 'Available' | 'Borrowed' | 'Overdue'
        categoryId?: string
        page?: string
    }
}

export default async function LabInstancesPage({ searchParams }: PageProps) {
    await requirePermission("view:equipment")
    const filters = {
        search: searchParams.search,
        type: searchParams.type,
        condition: searchParams.condition,
        status: searchParams.status,
        categoryId: searchParams.categoryId ? parseInt(searchParams.categoryId) : undefined,
        page: searchParams.page ? parseInt(searchParams.page) : 1,
        pageSize: 20
    }

    const { instances, total, pages, stats } = await getAllLabInstances(filters)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Instances Audit
                    </h2>
                    <p className="text-muted-foreground">
                        Unified inventory tracking for equipment and non-consumable apparatus.
                    </p>
                </div>
            </div>

            <SummaryStats stats={stats} />

            <div className="grid gap-6">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Inventory List
                            </CardTitle>
                            <InstancesFilter currentFilters={filters} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading instances...</div>}>
                            <InstancesTable
                                instances={instances}
                                total={total}
                                pages={pages}
                                currentPage={filters.page}
                            />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
