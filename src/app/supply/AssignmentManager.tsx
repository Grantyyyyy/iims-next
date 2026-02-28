'use client'

import React, { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, UserPlus, Droplets, Check, X, Box, User, FlaskConical, MapPin } from 'lucide-react'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter, SheetTrigger
} from "@/components/ui/sheet"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createChemicalAssignment } from '@/actions/supply'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AssignmentManagerProps {
    assignments: any[]
    stocks: any[]
    users: any[]
    rooms: any[]
}

export function AssignmentManager({ assignments, stocks, users, rooms }: AssignmentManagerProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [formData, setFormData] = useState({
        chemicalStockId: '',
        assigneeId: '',
        assignedVolume: 0,
        roomId: ''
    })

    const handleCreate = async () => {
        if (!formData.chemicalStockId || !formData.assigneeId || formData.assignedVolume <= 0) return

        setIsPending(true)
        const result = await createChemicalAssignment({
            chemicalStockId: parseInt(formData.chemicalStockId),
            assigneeId: parseInt(formData.assigneeId),
            assignedVolume: formData.assignedVolume,
            roomId: formData.roomId ? parseInt(formData.roomId) : undefined
        })
        setIsPending(false)

        if (result.success) {
            toast.success('Assignment created successfully')
            setIsSheetOpen(false)
            setFormData({ chemicalStockId: '', assigneeId: '', assignedVolume: 0, roomId: '' })
        } else {
            toast.error(result.error || 'Failed to create assignment')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Chemical Assignments</h3>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button className="shadow-sm">
                            <UserPlus className="mr-2 h-4 w-4" />
                            New Assignment
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Create Chemical Assignment</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Assign volumes of chemicals to personnel.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <FlaskConical className="h-4 w-4 text-primary/70" />
                                    Chemical Stock
                                </label>
                                <Select
                                    value={formData.chemicalStockId}
                                    onValueChange={(v) => setFormData({ ...formData, chemicalStockId: v })}
                                >
                                    <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select Chemical Stock" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stocks.map(stock => (
                                            <SelectItem key={stock.id} value={stock.id.toString()}>
                                                {stock.chemical.name} (SN: {stock.inventoryNumber}) - {stock.volume} left
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <User className="h-4 w-4 text-primary/70" />
                                    Assignee
                                </label>
                                <Select
                                    value={formData.assigneeId}
                                    onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                                >
                                    <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select Assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Droplets className="h-4 w-4 text-primary/70" />
                                    Volume to Assign
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={formData.assignedVolume}
                                    onChange={(e) => setFormData({ ...formData, assignedVolume: parseFloat(e.target.value) })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <MapPin className="h-4 w-4 text-primary/70" />
                                    Room (Optional)
                                </label>
                                <Select
                                    value={formData.roomId}
                                    onValueChange={(v) => setFormData({ ...formData, roomId: v })}
                                >
                                    <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={room.id.toString()}>
                                                {room.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="px-6 h-11 shrink-0">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !formData.chemicalStockId || !formData.assigneeId}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Assign Chemical</>
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Chemical</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignments.map((ass) => (
                            <TableRow key={ass.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Droplets className="h-4 w-4 text-blue-500" />
                                        {ass.chemicalStock.chemical.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">SN: {ass.chemicalStock.inventoryNumber}</div>
                                </TableCell>
                                <TableCell>{ass.assignee.username}</TableCell>
                                <TableCell>{ass.assignedVolume} {ass.chemicalStock.chemical.unit}</TableCell>
                                <TableCell>{new Date(ass.processedDate).toLocaleDateString()}</TableCell>
                                <TableCell>{ass.room?.name || 'In Transit'}</TableCell>
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
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Assignment
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                <Trash2 className="mr-2 h-4 w-4" /> Revoke Assignment
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {assignments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                    No chemical assignments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
