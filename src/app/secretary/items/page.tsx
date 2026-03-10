import { getItems, getCategories, getDeletedItems } from "@/actions/secretary"
import { ItemManager } from "./ItemManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"

export default async function SecretaryItemsPage() {
    const { roles } = await requirePermission('view:items')
    const isDean = roles.includes('DEAN')
    const items = await getItems()
    const categories = await getCategories()
    const deletedItems = await getDeletedItems()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Secretary Inventory</CardTitle>
                    <CardDescription>
                        Manage general inventory, equipment models, and stock levels.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ItemManager items={items} categories={categories} deletedItems={deletedItems} isReadOnly={isDean} />
                </CardContent>
            </Card>
        </div>
    )
}
