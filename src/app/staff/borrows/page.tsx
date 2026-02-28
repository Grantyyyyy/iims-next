import { requirePermission } from "@/lib/permissions"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffTable } from "./StaffTable"

export default async function StaffBorrowsPage() {
    const { user } = await requirePermission('view:own-borrows')

    const borrows = await prisma.borrowRecord.findMany({
        where: { borrowerId: user.id },
        include: {
            itemInstance: { include: { item: true } },
            room: true,
            returnRecord: true,
        },
        orderBy: { borrowDate: 'desc' },
    })

    const distributions = await prisma.distributionRecord.findMany({
        where: { recipientId: user.id },
        include: {
            itemInstance: { include: { item: true } },
            room: true,
            distributedBy: true,
        },
        orderBy: { distributedAt: 'desc' },
    })

    const activeBorrowsCount = borrows.filter(b => !b.returnRecord).length

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>My Inventory</CardTitle>
                    <CardDescription>
                        All items you have borrowed or received.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="borrows" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="borrows" className="relative">
                                Borrowed Items
                                {activeBorrowsCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-5 h-5 flex items-center justify-center rounded-full text-xs">
                                        {activeBorrowsCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="distributions">
                                Received Items
                                {distributions.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 min-w-5 h-5 flex items-center justify-center rounded-full text-xs">
                                        {distributions.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="borrows">
                            <StaffTable type="BORROW" records={borrows} />
                        </TabsContent>

                        <TabsContent value="distributions">
                            <StaffTable type="DISTRIBUTION" records={distributions} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
