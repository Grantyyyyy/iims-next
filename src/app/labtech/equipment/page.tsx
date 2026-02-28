import { getLabEquipment } from "@/actions/labtech"
import { LabEquipmentManager } from "./LabEquipmentManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LabEquipmentPage() {
    const equipment = await getLabEquipment()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Lab Equipment Inventory</CardTitle>
                    <CardDescription>
                        Track scientific instruments, microscopes, and specialized laboratory hardware.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LabEquipmentManager equipment={equipment} />
                </CardContent>
            </Card>
        </div>
    )
}
