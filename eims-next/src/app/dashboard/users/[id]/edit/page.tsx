import { UserForm } from '@/components/users/user-form'
import { getDepartments, getUserById } from '@/app/actions/users'
import { requirePermission } from '@/lib/permissions'
import { notFound } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const { user: currentUser } = await requirePermission('manage:users')
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) notFound()

    const user = await getUserById(userId)
    if (!user) notFound()

    const departments = await getDepartments()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
                <p className="text-muted-foreground">
                    Update account details and permissions for {user.firstName} {user.lastName}.
                </p>
            </div>

            <Card className="mx-auto w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <UserForm
                        mode="edit"
                        initialData={user}
                        departments={departments}
                        currentUserId={currentUser.id}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
