import { getEquipment, getDeletedEquipment } from "./actions"
import { getLabCategories } from "../categories/actions"
import { LabEquipmentManager } from "./LabEquipmentManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LabtechEquipmentPage() {
    const equipment = await getEquipment()
    const categories = await getLabCategories()
    const deletedEquipment = await getDeletedEquipment()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Laboratory Equipment</CardTitle>
                    <CardDescription>
                        Manage high-value lab machines and equipment with individual tracking.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LabEquipmentManager equipment={equipment} categories={categories} deletedEquipment={deletedEquipment} />
                </CardContent>
            </Card>
        </div>
    )
}
