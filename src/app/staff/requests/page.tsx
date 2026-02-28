import { requirePermission } from "@/lib/permissions"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

function getStatusBadgeVariant(status: string) {
    switch (status) {
        case 'APPROVED':
            return 'secondary' as const
        case 'REJECTED':
        case 'ASSIGNEE_REJECTED':
            return 'destructive' as const
        default:
            return 'outline' as const
    }
}

function getStatusClass(status: string) {
    switch (status) {
        case 'APPROVED':
            return 'bg-green-100 text-green-800'
        case 'REJECTED':
        case 'ASSIGNEE_REJECTED':
            return ''
        default:
            return ''
    }
}

export default async function StaffRequestsPage() {
    const { user } = await requirePermission('submit:requests')

    const [transfers, replaces, disposals] = await Promise.all([
        prisma.transferRequest.findMany({
            where: { requestedById: user.id },
            include: {
                itemInstance: { include: { item: true } },
                newAssignee: true,
                newLocation: true,
                processedBy: true,
            },
            orderBy: { requestedDate: 'desc' },
        }),
        prisma.replaceRequest.findMany({
            where: { requestedById: user.id },
            include: {
                itemInstance: { include: { item: true } },
                replacementItem: { include: { item: true } },
                processedBy: true,
            },
            orderBy: { requestedDate: 'desc' },
        }),
        prisma.disposeRequest.findMany({
            where: { requestedById: user.id },
            include: {
                itemInstance: { include: { item: true } },
                processedBy: true,
            },
            orderBy: { requestedDate: 'desc' },
        }),
    ])

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>My Requests</CardTitle>
                    <CardDescription>
                        Track your transfer, replacement, and disposal requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="transfer">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="transfer">Transfer ({transfers.length})</TabsTrigger>
                            <TabsTrigger value="replace">Replace ({replaces.length})</TabsTrigger>
                            <TabsTrigger value="dispose">Dispose ({disposals.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="transfer">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>New Assignee</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.length > 0 ? transfers.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.itemInstance.item.name}</TableCell>
                                            <TableCell>{req.newAssignee.username}</TableCell>
                                            <TableCell>{req.newLocation.name}</TableCell>
                                            <TableCell>{new Date(req.requestedDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getStatusBadgeVariant(req.status)}
                                                    className={getStatusClass(req.status)}
                                                >
                                                    {req.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No transfer requests.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="replace">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {replaces.length > 0 ? replaces.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.itemInstance.item.name}</TableCell>
                                            <TableCell>{req.replacementReason || '—'}</TableCell>
                                            <TableCell>{new Date(req.requestedDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getStatusBadgeVariant(req.status)}
                                                    className={getStatusClass(req.status)}
                                                >
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No replacement requests.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="dispose">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {disposals.length > 0 ? disposals.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.itemInstance.item.name}</TableCell>
                                            <TableCell>{req.disposalReason || '—'}</TableCell>
                                            <TableCell>{new Date(req.requestedDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getStatusBadgeVariant(req.status)}
                                                    className={getStatusClass(req.status)}
                                                >
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No disposal requests.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
