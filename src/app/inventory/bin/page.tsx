import { getDeletedItems } from "@/actions/secretary"
import SecretaryBinManager from "./SecretaryBinManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"

export default async function SecretaryBinPage() {
    await requirePermission('manage:items')
    const deletedItems = await getDeletedItems()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Bin</CardTitle>
                    <CardDescription>
                        Recovery center for deleted inventory items. Items listed here can be restored or permanently removed from the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SecretaryBinManager deletedItems={deletedItems} />
                </CardContent>
            </Card>
        </div>
    )
}
