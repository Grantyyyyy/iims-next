import { getLabCategories } from "./actions"
import { LabCategoryManager } from "./LabCategoryManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LabtechCategoriesPage() {
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
                    <LabCategoryManager categories={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
