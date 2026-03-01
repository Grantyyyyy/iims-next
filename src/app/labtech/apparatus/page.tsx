import { getApparatus, getDeletedApparatus } from "./actions"
import { getLabCategories } from "../categories/actions"
import { LabApparatusManager } from "./LabApparatusManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LabtechApparatusPage() {
    const apparatus = await getApparatus()
    const categories = await getLabCategories()
    const deletedApparatus = await getDeletedApparatus()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Laboratory Apparatus</CardTitle>
                    <CardDescription>
                        Manage lab apparatus - both consumable and non-consumable types.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LabApparatusManager apparatus={apparatus} categories={categories} deletedApparatus={deletedApparatus} />
                </CardContent>
            </Card>
        </div>
    )
}
