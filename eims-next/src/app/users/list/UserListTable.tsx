'use client'

import React, { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { updateUserRoles } from '@/actions/users'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

interface UserListTableProps {
    users: any[]
}

const AVAILABLE_ROLES = [
    'SUPERUSER', 'ADMIN', 'SECRETARY', 'LABTECH', 'ICTC', 'SUPPLY', 'DEAN', 'STAFF'
]

export function UserListTable({ users }: UserListTableProps) {
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [isPending, setIsPending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users
        const q = searchQuery.toLowerCase()
        return users.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.department?.name || '').toLowerCase().includes(q)
        )
    }, [users, searchQuery])

    const handleRoleUpdate = async () => {
        if (!selectedUser) return

        setIsPending(true)
        const result = await updateUserRoles(selectedUser.id, selectedRoles)
        setIsPending(false)

        if (result.success) {
            toast.success('Roles updated successfully')
            setSelectedUser(null)
        } else {
            toast.error(result.error || 'Failed to update roles')
        }
    }

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        )
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by username, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.department?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((ur: any) => (
                                            <Badge key={ur.id} variant="secondary">
                                                {ur.role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setSelectedRoles(user.roles.map((ur: any) => ur.role.name))
                                                }}
                                            >
                                                Edit Roles
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Roles for {user.username}</DialogTitle>
                                                <DialogDescription>
                                                    Select the roles for this user. Multiple roles are supported.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-2 py-4">
                                                {AVAILABLE_ROLES.map((role) => (
                                                    <div key={role} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`${user.id}-${role}`}
                                                            checked={selectedRoles.includes(role)}
                                                            onChange={() => toggleRole(role)}
                                                            className="h-4 w-4 rounded border-gray-300"
                                                        />
                                                        <label htmlFor={`${user.id}-${role}`} className="text-sm font-medium leading-none">
                                                            {role}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={handleRoleUpdate}
                                                    disabled={isPending}
                                                >
                                                    {isPending ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                    {searchQuery ? 'No users match your search.' : 'No users found.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
