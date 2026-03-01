import { getTransferRequests, getReplaceRequests, getDisposeRequests } from "@/actions/requests"
import { getReceivedChemicals } from "@/actions/user"
import { RequestBoard } from "./RequestBoard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Droplet } from "lucide-react"
import { format } from "date-fns"

export default async function StaffPage() {
    const transfers = await getTransferRequests()
    const replaces = await getReplaceRequests()
    const disposals = await getDisposeRequests()
    const receivedChemicals = await getReceivedChemicals(10)

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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-muted-foreground" />
                        Received Chemicals
                    </CardTitle>
                    <CardDescription>
                        Chemicals distributed to you from the laboratory
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {receivedChemicals.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No chemicals received yet
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold text-foreground/80">Chemical</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Amount</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Date Received</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Purpose</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receivedChemicals.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-bold text-foreground">{record.chemicalName}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {record.amount.toFixed(2)} {record.unit}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(record.date), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{record.purpose}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
