import { getEquipment, getDeletedEquipment } from "./actions"
import { getLabCategories } from "../categories/actions"
import { LabEquipmentManager } from "./LabEquipmentManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"

export default async function LabtechEquipmentPage() {
    const { roles } = await requirePermission('view:equipment')
    const isDean = roles.includes('DEAN')
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
                    <LabEquipmentManager equipment={equipment} categories={categories} deletedEquipment={deletedEquipment} isReadOnly={isDean} />
                </CardContent>
            </Card>
        </div>
    )
}
