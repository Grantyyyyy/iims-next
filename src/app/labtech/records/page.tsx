import { getLabBorrowRecords, getChemicalUsageRecords } from "./actions"
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

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Laboratory Records</CardTitle>
                    <CardDescription>
                        Track equipment/apparatus borrows and chemical usage records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={tab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="borrows">Borrow Records</TabsTrigger>
                            <TabsTrigger value="chemicals">Chemical Usage</TabsTrigger>
                        </TabsList>

                        <TabsContent value="borrows">
                            <LabRecordManager type="BORROW" records={borrowRecords} />
                        </TabsContent>

                        <TabsContent value="chemicals">
                            <LabRecordManager type="CHEMICAL" records={chemicalUsageRecords} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
