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
import { Search, Pencil, Shield, Check, X, User, MoreHorizontal, Loader2 } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

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
                <SheetContent className="sm:max-w-lg w-full flex flex-col p-0 border-l shadow-2xl">
                    <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                        {/* Subtle Glow Effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                        <div className="relative z-10 text-left">
                            <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Edit User Roles
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium mt-1">
                                Update roles for <strong>{selectedUser?.username}</strong>
                            </SheetDescription>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6 py-6">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    <Shield className="h-3 w-3 text-primary/70" />
                                    Available Roles
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {AVAILABLE_ROLES.map((role) => (
                                        <div
                                            key={role}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${selectedRoles.includes(role)
                                                ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                                                : 'bg-card border-border/50 hover:border-primary/20'
                                                }`}
                                            onClick={() => toggleRole(role)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-lg transition-colors ${selectedRoles.includes(role) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold tracking-tight">{role}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">{role === 'SUPERUSER' ? 'Full System Access' : 'Standard Access'}</span>
                                                </div>
                                            </div>
                                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedRoles.includes(role)
                                                ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                                                : 'border-muted-foreground/20'
                                                }`}>
                                                {selectedRoles.includes(role) && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRoleUpdate}
                            disabled={isPending}
                            className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
