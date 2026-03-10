'use client'

import * as React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreHorizontal, Edit, Power, PowerOff, Search, Info } from 'lucide-react'
import { toggleUserStatus } from '@/app/actions/users'
import { toast } from 'sonner'
import { EditUserDialog } from './edit-user-dialog'
import { AddUserDialog } from '@/components/users/add-user-dialog'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

interface UserTableProps {
    users: any[]
    currentUserId: number
    departments: any[]
    isReadOnly?: boolean
}

const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
    SECRETARY: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    LABTECH: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    DEAN: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    STAFF: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
    ICTC: "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
    SUPPLY: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
}

export function UserTable({ users: initialUsers, currentUserId, departments, isReadOnly = false }: UserTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()
    const [users, setUsers] = React.useState(initialUsers)
    const [editingUser, setEditingUser] = React.useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

    React.useEffect(() => {
        setUsers(initialUsers)
    }, [initialUsers])

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        if (userId === currentUserId) {
            toast.error("You cannot deactivate yourself")
            return
        }

        const previousUsers = [...users]
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u))

        startTransition(async () => {
            try {
                const result = await toggleUserStatus(userId)
                if (result.error) {
                    toast.error(result.error)
                    setUsers(previousUsers)
                } else {
                    toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`)
                    router.refresh()
                }
            } catch (error) {
                toast.error("An unexpected error occurred")
                setUsers(previousUsers)
            }
        })
    }

    const [searchQuery, setSearchQuery] = React.useState('')

    const filteredUsers = React.useMemo(() => {
        return users.filter(user => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
            const email = (user.email || '').toLowerCase()
            const username = (user.username || '').toLowerCase()
            const term = searchQuery.toLowerCase()
            return fullName.includes(term) || email.includes(term) || username.includes(term)
        })
    }, [users, searchQuery])

    if (users.length === 0) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in duration-500 bg-card">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <MoreHorizontal className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No users found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    There are no users in records. Click "Add User" to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                        />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Full Name + Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined Date</TableHead>
                                {!isReadOnly && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => {
                                const primaryRole = user.roles?.[0]?.role?.name || 'STAFF'
                                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username

                                return (
                                    <TableRow key={user.id} className={cn(!user.isActive && "opacity-60", "hover:bg-muted/30 transition-colors")}>
                                        <TableCell>
                                            <Avatar>
                                                {user.profilePicUrl && <AvatarImage src={user.profilePicUrl} alt={fullName} />}
                                                <AvatarFallback>{fullName.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{fullName}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-semibold border", roleColors[primaryRole])}>
                                                {primaryRole}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{user.department?.name || '---'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? "default" : "secondary"} className={cn(user.isActive ? "bg-green-500 hover:bg-green-600" : "bg-slate-200 text-slate-600")}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </TableCell>
                                        {!isReadOnly && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setEditingUser(user)
                                                                setIsEditDialogOpen(true)
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                            className={cn("cursor-pointer", user.isActive ? "text-destructive" : "text-green-600")}
                                                            disabled={user.id === currentUserId}
                                                        >
                                                            {user.isActive ? (
                                                                <>
                                                                    <PowerOff className="mr-2 h-4 w-4" />
                                                                    Deactivate User
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    Activate User
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={isReadOnly ? 6 : 7} className="text-center py-6 text-muted-foreground">
                                        No users matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <EditUserDialog
                user={editingUser}
                departments={departments}
                currentUserId={currentUserId}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSuccess={() => {
                    setIsEditDialogOpen(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
