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
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter, SheetTrigger
} from "@/components/ui/sheet"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateUserRoles } from '@/actions/users'
import { toast } from 'sonner'
import { Search, Pencil, Shield, Check, X, User, MoreHorizontal } from 'lucide-react'

interface UserListTableProps {
    users: any[]
}

const AVAILABLE_ROLES = [
    'SUPERUSER', 'ADMIN', 'SECRETARY', 'LABTECH', 'ICTC', 'SUPPLY', 'DEAN', 'STAFF'
]

export function UserListTable({ users }: UserListTableProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
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
            setIsEditOpen(false)
            setSelectedUser(null)
        } else {
            toast.error(result.error || 'Failed to update roles')
        }
    }

    const openEdit = (user: any) => {
        setSelectedUser(user)
        setSelectedRoles(user.roles.map((ur: any) => ur.role.name))
        setIsEditOpen(true)
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
                                <TableCell className="font-medium">
                                    <button
                                        onClick={() => openEdit(user)}
                                        className="hover:underline text-foreground hover:text-primary transition-colors text-left"
                                    >
                                        {user.username}
                                    </button>
                                </TableCell>
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => openEdit(user)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Roles
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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

            {/* Edit Roles Sheet */}
            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                    <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                        <SheetTitle className="text-2xl font-bold tracking-tight">Edit User Roles</SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground">
                            Update roles for <strong>{selectedUser?.username}</strong>.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <Shield className="h-4 w-4 text-primary/70" />
                                Available Roles
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {AVAILABLE_ROLES.map((role) => (
                                    <div
                                        key={role}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                            selectedRoles.includes(role)
                                                ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                                                : 'bg-card border-border hover:border-primary/20'
                                        }`}
                                        onClick={() => toggleRole(role)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-md ${selectedRoles.includes(role) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium">{role}</span>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                                            selectedRoles.includes(role)
                                                ? 'bg-primary border-primary text-primary-foreground'
                                                : 'border-muted-foreground/30'
                                        }`}>
                                            {selectedRoles.includes(role) && <Check className="h-3 w-3" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <SheetFooter className="pt-6 border-t bg-muted/10">
                        <div className="flex w-full justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="px-6 h-11 shrink-0">
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button
                                onClick={handleRoleUpdate}
                                disabled={isPending}
                                className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                            >
                                {isPending ? 'Processing...' : (
                                    <><Check className="mr-2 h-4 w-4" /> Save Changes</>
                                )}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
