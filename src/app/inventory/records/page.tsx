import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"
import { getBorrowRecords, getDistributionRecords } from "@/actions/secretary"
import { RecordManager } from "./RecordManager"
import { ClipboardList, Share2, Loader2 } from "lucide-react"

export default async function RecordsPage() {
    const { roles } = await requirePermission('view:records')
    const isDean = roles.includes('DEAN')

    const [borrows, distributions] = await Promise.all([
        getBorrowRecords(),
        getDistributionRecords()
    ])

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Secretary Records
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track all item movements, borrowing history, and distributions.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-0 pt-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Movement History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Tabs defaultValue="borrows" className="w-full space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="borrows" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Borrows
                            </TabsTrigger>
                            <TabsTrigger value="distributions" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">
                                <Share2 className="h-4 w-4 mr-2" />
                                Distributions
                            </TabsTrigger>
                        </TabsList>

                        <Suspense fallback={
                            <div className="h-[400px] flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            </div>
                        }>
                            <TabsContent value="borrows" className="mt-0 outline-none focus-visible:ring-0">
                                <RecordManager
                                    type="BORROW"
                                    records={borrows}
                                    isReadOnly={isDean}
                                />
                            </TabsContent>
                            <TabsContent value="distributions" className="mt-0 outline-none focus-visible:ring-0">
                                <RecordManager
                                    type="DISTRIBUTION"
                                    records={distributions}
                                    isReadOnly={isDean}
                                />
                            </TabsContent>
                        </Suspense>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
