import { getChemicals } from "./actions"
import { ChemicalManager } from "./ChemicalManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LabtechChemicalsPage() {
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
                    <ChemicalManager chemicals={chemicals} />
                </CardContent>
            </Card>
        </div>
    )
}
