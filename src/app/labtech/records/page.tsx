import { getLabBorrowRecords, getChemicalUsageRecords, getDistributionRecords } from "./actions"
import { LabRecordManager } from "./LabRecordManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LabtechRecordsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | undefined }
}) {
    const tab = searchParams.tab || 'borrows'

    // Borrow Filters
    const bSearch = searchParams.bSearch
    const bStatus = searchParams.bStatus
    const bType = searchParams.bType
    const bFrom = searchParams.bFrom ? new Date(searchParams.bFrom) : undefined
    const bTo = searchParams.bTo ? new Date(searchParams.bTo) : undefined

    // Chemical Usage Filters
    const cSearch = searchParams.cSearch
    const cFrom = searchParams.cFrom ? new Date(searchParams.cFrom) : undefined
    const cTo = searchParams.cTo ? new Date(searchParams.cTo) : undefined

    // Distribution Filters
    const dSearch = searchParams.dSearch
    const dFrom = searchParams.dFrom ? new Date(searchParams.dFrom) : undefined
    const dTo = searchParams.dTo ? new Date(searchParams.dTo) : undefined

    const borrowRecords = tab === 'borrows' ? await getLabBorrowRecords({
        search: bSearch,
        status: bStatus,
        borrowerType: bType,
        dateFrom: bFrom,
        dateTo: bTo
    }) : []

    const chemicalUsageRecords = tab === 'chemicals' ? await getChemicalUsageRecords({
        search: cSearch,
        dateFrom: cFrom,
        dateTo: cTo
    }) : []

    const distributionRecords = tab === 'distributions' ? await getDistributionRecords({
        search: dSearch,
        dateFrom: dFrom,
        dateTo: dTo
    }) : []

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Laboratory Records</CardTitle>
                    <CardDescription>
                        Track equipment/apparatus borrows, chemical usage, and chemical distributions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={tab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="borrows">Borrow Records</TabsTrigger>
                            <TabsTrigger value="chemicals">Chemical Usage</TabsTrigger>
                            <TabsTrigger value="distributions">Chemical Distribution</TabsTrigger>
                        </TabsList>

                        <TabsContent value="borrows">
                            <LabRecordManager type="BORROW" records={borrowRecords} />
                        </TabsContent>

                        <TabsContent value="chemicals">
                            <LabRecordManager type="CHEMICAL" records={chemicalUsageRecords} />
                        </TabsContent>

                        <TabsContent value="distributions">
                            <LabRecordManager type="DISTRIBUTION" records={distributionRecords} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
