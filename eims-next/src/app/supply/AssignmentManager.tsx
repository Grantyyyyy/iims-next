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
import { ClipboardList, UserPlus, Droplets } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
    const [isDialogOpen, setIsDialogOpen] = useState(false)
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
            setIsDialogOpen(false)
            setFormData({ chemicalStockId: '', assigneeId: '', assignedVolume: 0, roomId: '' })
        } else {
            toast.error(result.error || 'Failed to create assignment')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Chemical Assignments</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            New Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Chemical Assignment</DialogTitle>
                            <DialogDescription>
                                Assign specific volumes of chemicals to personnel for long-term use.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Select
                                value={formData.chemicalStockId}
                                onValueChange={(v) => setFormData({ ...formData, chemicalStockId: v })}
                            >
                                <SelectTrigger>
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

                            <Select
                                value={formData.assigneeId}
                                onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                            >
                                <SelectTrigger>
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

                            <Input
                                type="number"
                                placeholder="Volume to Assign"
                                value={formData.assignedVolume}
                                onChange={(e) => setFormData({ ...formData, assignedVolume: parseFloat(e.target.value) })}
                            />

                            <Select
                                value={formData.roomId}
                                onValueChange={(v) => setFormData({ ...formData, roomId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Room (Optional)" />
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
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isPending || !formData.chemicalStockId || !formData.assigneeId}>
                                {isPending ? 'Processing...' : 'Assign Chemical'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
