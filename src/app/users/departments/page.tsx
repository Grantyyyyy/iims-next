import { getDepartments } from "@/actions/users"
import { DepartmentManager } from "./DepartmentManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DepartmentsPage() {
    const departments = await getDepartments()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Departments Management</CardTitle>
                    <CardDescription>
                        Manage university departments and view personnel distribution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DepartmentManager departments={departments} />
                </CardContent>
            </Card>
        </div>
    )
}
