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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createItem, addItemInstance } from '@/actions/secretary'
import { toast } from 'sonner'
import { Plus, ListPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ItemManagerProps {
    items: any[]
    categories: any[]
}

export function ItemManager({ items, categories }: ItemManagerProps) {
    // For Creating New Item
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        model: '',
        itemType: 'Non-Consumables',
        categoryId: ''
    })

    // For Adding Instance
    const [isInstanceDialogOpen, setIsInstanceDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [newInstance, setNewInstance] = useState({
        unitCost: 0,
        quantity: 1,
        serialNumber: '',
        inventoryNumber: '',
        currentCondition: 'Good'
    })

    const [isPending, setIsPending] = useState(false)

    const handleCreateItem = async () => {
        if (!newItem.name || !newItem.categoryId) return

        setIsPending(true)
        const result = await createItem({
            ...newItem,
            categoryId: parseInt(newItem.categoryId)
        })
        setIsPending(true)

        if (result.success) {
            toast.success('Item created successfully')
            setNewItem({ name: '', description: '', model: '', itemType: 'Non-Consumables', categoryId: '' })
            setIsItemDialogOpen(false)
        } else {
            toast.error(result.error || 'Failed to create item')
        }
        setIsPending(false)
    }

    const handleAddInstance = async () => {
        if (!selectedItem) return

        setIsPending(true)
        const result = await addItemInstance({
            itemId: selectedItem.id,
            ...newInstance
        })
        setIsPending(false)

        if (result.success) {
            toast.success('Inventory updated')
            setNewInstance({ unitCost: 0, quantity: 1, serialNumber: '', inventoryNumber: '', currentCondition: 'Good' })
            setIsInstanceDialogOpen(false)
            setSelectedItem(null)
        } else {
            toast.error(result.error || 'Failed to add instance')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Secretary Items</h3>
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Item</DialogTitle>
                            <DialogDescription>
                                Add a new base item to the secretary inventory.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="Item Name"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            />
                            <Input
                                placeholder="Model (Optional)"
                                value={newItem.model}
                                onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                            />
                            <Select
                                value={newItem.categoryId}
                                onValueChange={(v) => setNewItem({ ...newItem, categoryId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={newItem.itemType}
                                onValueChange={(v) => setNewItem({ ...newItem, itemType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Item Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Non-Consumables">Non-Consumables</SelectItem>
                                    <SelectItem value="Consumables">Consumables</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateItem} disabled={isPending || !newItem.name || !newItem.categoryId}>
                                {isPending ? 'Creating...' : 'Create Item'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Total Qty</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.category?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{item.itemType}</Badge>
                                </TableCell>
                                <TableCell>{item.model || 'N/A'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                    <Dialog open={isInstanceDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                                        if (!open) setSelectedItem(null)
                                        setIsInstanceDialogOpen(open)
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <ListPlus className="mr-2 h-4 w-4" />
                                                Add Qty
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add Inventory for {item.name}</DialogTitle>
                                                <DialogDescription>
                                                    Enter details for the new batch or instance.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Quantity"
                                                        value={newInstance.quantity}
                                                        onChange={(e) => setNewInstance({ ...newInstance, quantity: parseInt(e.target.value) })}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Unit Cost"
                                                        value={newInstance.unitCost}
                                                        onChange={(e) => setNewInstance({ ...newInstance, unitCost: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <Input
                                                    placeholder="Inventory Number (Optional)"
                                                    value={newInstance.inventoryNumber}
                                                    onChange={(e) => setNewInstance({ ...newInstance, inventoryNumber: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Serial Number (Optional)"
                                                    value={newInstance.serialNumber}
                                                    onChange={(e) => setNewInstance({ ...newInstance, serialNumber: e.target.value })}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleAddInstance} disabled={isPending}>
                                                    {isPending ? 'Updating...' : 'Update Inventory'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
