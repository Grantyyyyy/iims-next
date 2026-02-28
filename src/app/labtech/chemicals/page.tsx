import { getChemicals } from "@/actions/labtech"
import { ChemicalManager } from "./ChemicalManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LabChemicalsPage() {
    const chemicals = await getChemicals()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Chemicals & Reagents</CardTitle>
                    <CardDescription>
                        Monitor laboratory chemical stock levels, volume usage, and expiry tracking.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChemicalManager chemicals={chemicals} />
                </CardContent>
            </Card>
        </div>
    )
}
