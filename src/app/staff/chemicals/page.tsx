import { requirePermission } from "@/lib/permissions"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function StaffChemicalsPage() {
    const { user } = await requirePermission('view:own-chemicals')

    const assignments = await prisma.chemicalAssignment.findMany({
        where: { assigneeId: user.id },
        include: {
            chemicalStock: { include: { chemical: true } },
            room: true,
        },
        orderBy: { processedDate: 'desc' },
    })

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>My Chemicals</CardTitle>
                    <CardDescription>
                        Chemicals assigned to you
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Chemical</TableHead>
                                <TableHead>Volume</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Assigned Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.length > 0 ? assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell className="font-medium">
                                        {assignment.chemicalStock.chemical.name}
                                    </TableCell>
                                    <TableCell>
                                        {assignment.assignedVolume} {assignment.chemicalStock.chemical.unit || ''}
                                    </TableCell>
                                    <TableCell>{assignment.room?.name || '—'}</TableCell>
                                    <TableCell>
                                        {assignment.processedDate
                                            ? new Date(assignment.processedDate).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        No chemical assignments found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
