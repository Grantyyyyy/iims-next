import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission, getUserPrimaryRole } from "@/lib/permissions"
import { getDamagedItems, getLowStockItems } from "@/app/actions/reports"
import { DamagedItemsReport } from "@/components/reports/damaged-items-report"
import { LowStockReport } from "@/components/reports/low-stock-report"
import prisma from "@/lib/prisma"
import { AlertTriangle, PackageSearch } from "lucide-react"

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user, roles } = await requirePermission('view:reports')
    const primaryRole = getUserPrimaryRole(roles)
    const isDean = primaryRole === 'DEAN'
    const resolvedParams = await searchParams
    const activeTab = (resolvedParams.tab as string) || "damaged"

    // Initial data fetching
    const [damagedData, lowStock, categories] = await Promise.all([
        getDamagedItems({
            search: resolvedParams.search as string,
            categoryId: resolvedParams.category as string,
            valueFilter: resolvedParams.value as 'high' | 'low',
            page: parseInt(resolvedParams.page as string || '1'),
        }),
        getLowStockItems(),
        prisma.category.findMany({ select: { id: true, name: true } })
    ])

    return (
        <div className="flex flex-col gap-6 w-full px-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
                    <p className="text-muted-foreground">
                        Monitor inventory health, usage trends, and operational metrics.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inventory Reports</CardTitle>
                    <CardDescription>
                        Analysis of damaged items and low stock alerts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={activeTab} className="w-full space-y-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="damaged">
                                <AlertTriangle className="h-4 w-4 mr-2" /> 
                                Damaged Items ({damagedData.total})
                            </TabsTrigger>
                            <TabsTrigger value="lowstock">
                                <PackageSearch className="h-4 w-4 mr-2" /> 
                                Low Stock ({lowStock.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="damaged" className="outline-none space-y-4 pt-4">
                            <DamagedItemsReport 
                                data={damagedData} 
                                categories={categories} 
                                user={user} 
                                userRole={primaryRole}
                                isDean={isDean}
                            />
                        </TabsContent>

                        <TabsContent value="lowstock" className="outline-none space-y-4 pt-4">
                            <LowStockReport data={lowStock} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
