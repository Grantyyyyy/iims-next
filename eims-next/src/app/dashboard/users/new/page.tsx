import { UserForm } from '@/components/users/user-form'
import { getDepartments } from '@/app/actions/users'
import { requirePermission } from '@/lib/permissions'

export default async function NewUserPage() {
    await requirePermission('manage:users')
    const departments = await getDepartments()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Create User</h1>
                <p className="text-muted-foreground">
                    Fill in the details below to add a new member.
                </p>
            </div>

            <UserForm mode="create" departments={departments} />
        </div>
    )
}
