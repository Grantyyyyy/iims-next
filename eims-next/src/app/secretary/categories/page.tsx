import { getCategories } from "@/actions/secretary"
import { CategoryManager } from "./CategoryManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SecretaryCategoriesPage() {
    const categories = await getCategories()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Secretary Categories</CardTitle>
                    <CardDescription>
                        Manage categories for general items and administrative equipment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CategoryManager categories={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
