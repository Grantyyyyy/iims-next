import { getBorrowRecords, getDistributionRecords } from "@/actions/secretary"
import { RecordManager } from "./RecordManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SecretaryRecordsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | undefined }
}) {
    // Parse filters from URL search params
    const tab = searchParams.tab || 'borrows'

    // Borrow Filters
    const bName = searchParams.bName
    const bStatus = searchParams.bStatus
    const bFrom = searchParams.bFrom ? new Date(searchParams.bFrom) : undefined
    const bTo = searchParams.bTo ? new Date(searchParams.bTo) : undefined

    // Distribution Filters
    const dName = searchParams.dName
    const dFrom = searchParams.dFrom ? new Date(searchParams.dFrom) : undefined
    const dTo = searchParams.dTo ? new Date(searchParams.dTo) : undefined

    // Fetch data based on active tab to optimize load
    const borrowRecords = tab === 'borrows' ? await getBorrowRecords({
        borrowerName: bName,
        status: bStatus,
        dateFrom: bFrom,
        dateTo: bTo
    }) : []

    const distributionRecords = tab === 'distributions' ? await getDistributionRecords({
        recipientName: dName,
        dateFrom: dFrom,
        dateTo: dTo
    }) : []

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Tracking Records</CardTitle>
                    <CardDescription>
                        Track distributed consumables and borrowed non-consumable items.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={tab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="borrows">Borrow Records</TabsTrigger>
                            <TabsTrigger value="distributions">Distribution Records (Consumables)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="borrows">
                            <RecordManager type="BORROW" records={borrowRecords} />
                        </TabsContent>

                        <TabsContent value="distributions">
                            <RecordManager type="DISTRIBUTION" records={distributionRecords} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
