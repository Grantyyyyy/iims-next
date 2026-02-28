import { Plus, Users, UserCheck, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTable } from '@/components/users/user-table'
import { getUsers, getDepartments } from '@/app/actions/users'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddUserDialog } from '@/components/users/add-user-dialog'

export default async function UsersPage() {
    const { user: currentUser } = await requirePermission('manage:users')
    const users = await getUsers()
    const departments = await getDepartments()

    const stats = {
        total: users.length,
        active: (users as any[]).filter(u => u.isActive).length,
        inactive: (users as any[]).filter(u => !u.isActive).length,
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage user accounts, roles, and system access.
                    </p>
                </div>
                <AddUserDialog departments={departments} currentUserId={(currentUser as any).id} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Across all departments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">Currently have access</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                        <UserMinus className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inactive}</div>
                        <p className="text-xs text-muted-foreground">Access disabled</p>
                    </CardContent>
                </Card>
            </div>

            <UserTable users={users} currentUserId={currentUser.id} departments={departments} />
        </div>
    )
}
