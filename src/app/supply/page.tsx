import { getChemicalAssignments } from "@/actions/supply"
import { getChemicals } from "@/actions/labtech"
import { getUsers } from "@/actions/users"
import prisma from "@/lib/prisma"
import { AssignmentManager } from "./AssignmentManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SupplyPage() {
    const assignments = await getChemicalAssignments()

    // We need stocks specifically for assignments
    const stocks = await prisma.chemicalStock.findMany({
        include: { chemical: true },
        where: { volume: { gt: 0 } }
    })

    const users = await getUsers()
    const rooms = await prisma.room.findMany()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Supply Office - Chemical Distribution</CardTitle>
                    <CardDescription>
                        Manage and track long-term chemical assignments to departments and staff.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AssignmentManager
                        assignments={assignments}
                        stocks={stocks}
                        users={users}
                        rooms={rooms}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
