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
import { createDepartment } from '@/actions/users'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface DepartmentManagerProps {
    departments: any[]
}

export function DepartmentManager({ departments }: DepartmentManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newDeptName, setNewDeptName] = useState('')
    const [isPending, setIsPending] = useState(false)

    const handleCreate = async () => {
        if (!newDeptName) return

        setIsPending(true)
        const result = await createDepartment(newDeptName)
        setIsPending(false)

        if (result.success) {
            toast.success('Department created successfully')
            setNewDeptName('')
            setIsDialogOpen(false)
        } else {
            toast.error(result.error || 'Failed to create department')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Departments</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Department
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Department</DialogTitle>
                            <DialogDescription>
                                Enter the name of the new department to add to the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="e.g., Computer Science, Engineering"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isPending || !newDeptName}>
                                {isPending ? 'Creating...' : 'Create Department'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Department Name</TableHead>
                            <TableHead>User Count</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.map((dept) => (
                            <TableRow key={dept.id}>
                                <TableCell className="font-medium">{dept.name}</TableCell>
                                <TableCell>{dept._count.users}</TableCell>
                            </TableRow>
                        ))}
                        {departments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
