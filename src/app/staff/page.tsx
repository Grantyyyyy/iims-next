import { getTransferRequests, getReplaceRequests, getDisposeRequests } from "@/actions/requests"
import { RequestBoard } from "./RequestBoard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StaffPage() {
    const transfers = await getTransferRequests()
    const replaces = await getReplaceRequests()
    const disposals = await getDisposeRequests()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Staff Asset Requests</CardTitle>
                    <CardDescription>
                        Track and manage item transfers, replacements, and disposal requests from faculty and staff.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RequestBoard
                        transfers={transfers}
                        replaces={replaces}
                        disposals={disposals}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
