import { getUsers } from "@/actions/users"
import { UserListTable } from "./UserListTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function UsersListPage() {
    const users = await getUsers()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        View and manage users, their departments, and assigned roles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserListTable users={users} />
                </CardContent>
            </Card>
        </div>
    )
}
