import { getDeletedEquipment } from "../equipment/actions"
import { getDeletedApparatus } from "../apparatus/actions"
import { getDeletedChemicals } from "../chemicals/actions"
import LabtechBinManager from "./LabtechBinManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"

export default async function LabtechBinPage() {
    await requirePermission('manage:equipment')
    const [deletedEquipment, deletedApparatus, deletedChemicals] = await Promise.all([
        getDeletedEquipment(),
        getDeletedApparatus(),
        getDeletedChemicals()
    ])

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Lab Assets Bin</CardTitle>
                    <CardDescription>
                        Unified recovery center for deleted laboratory equipment, apparatus, and chemicals.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LabtechBinManager
                        deletedEquipment={deletedEquipment}
                        deletedApparatus={deletedApparatus}
                        deletedChemicals={deletedChemicals}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
