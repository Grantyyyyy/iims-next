import { getChemicals } from "./actions"
import { ChemicalManager } from "./ChemicalManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"

export default async function LabtechChemicalsPage() {
    const { roles } = await requirePermission('view:equipment')
    const isDean = roles.includes('DEAN')
    const chemicals = await getChemicals()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Laboratory Chemicals</CardTitle>
                    <CardDescription>
                        Manage chemical inventory with FIFO tracking and expiry monitoring.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChemicalManager chemicals={chemicals} isReadOnly={isDean} />
                </CardContent>
            </Card>
        </div>
    )
}
