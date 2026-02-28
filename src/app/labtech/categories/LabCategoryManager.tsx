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
import { createLabCategory } from '@/actions/labtech'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface LabCategoryManagerProps {
    categories: any[]
}

export function LabCategoryManager({ categories }: LabCategoryManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [isPending, setIsPending] = useState(false)

    const handleCreate = async () => {
        if (!newCatName) return

        setIsPending(true)
        const result = await createLabCategory(newCatName)
        setIsPending(false)

        if (result.success) {
            toast.success('Lab category created successfully')
            setNewCatName('')
            setIsDialogOpen(false)
        } else {
            toast.error(result.error || 'Failed to create category')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lab Categories</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Lab Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Lab Category</DialogTitle>
                            <DialogDescription>
                                Enter the name of the new category for lab equipment and apparatus.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="e.g., Glassware, Electronics, Precision Instruments"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isPending || !newCatName}>
                                {isPending ? 'Creating...' : 'Create Category'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead>Equipment Count</TableHead>
                            <TableHead>Apparatus Count</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell className="font-medium">{cat.name}</TableCell>
                                <TableCell>{cat._count.equipments}</TableCell>
                                <TableCell>{cat._count.apparatus}</TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No lab categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
