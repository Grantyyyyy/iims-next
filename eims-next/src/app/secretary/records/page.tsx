import { getBorrowRecords } from "@/actions/secretary"
import { RecordManager } from "./RecordManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SecretaryRecordsPage() {
    const records = await getBorrowRecords()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Borrowing & Return Records</CardTitle>
                    <CardDescription>
                        Track equipment movement and process returns for administrative items.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecordManager records={records} />
                </CardContent>
            </Card>
        </div>
    )
}
