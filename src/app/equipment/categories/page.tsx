import { getLabCategories } from "./actions"
import { LabCategoryManager } from "./LabCategoryManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requirePermission } from "@/lib/permissions"

export default async function LabtechCategoriesPage() {
    const { roles } = await requirePermission('view:equipment')
    const isDean = roles.includes('DEAN')
    const categories = await getLabCategories()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Lab Categories</CardTitle>
                    <CardDescription>
                        Manage categories for laboratory equipment and apparatus.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LabCategoryManager categories={categories} isReadOnly={isDean} />
                </CardContent>
            </Card>
        </div>
    )
}
