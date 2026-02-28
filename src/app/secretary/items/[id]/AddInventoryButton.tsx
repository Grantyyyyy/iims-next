'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { addConsumableStock } from '@/app/actions/secretary'
import { addItemInstance } from '@/actions/secretary'
import { toast } from 'sonner'
import { Plus, Package, ListPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddInventoryButtonProps {
    itemId: number
    instanceId: number   // first instance id (consumables always have 1 master instance)
    itemType: string     // 'Consumables' | 'Non-Consumables'
    itemName: string
}

export function AddInventoryButton({ itemId, instanceId, itemType, itemName }: AddInventoryButtonProps) {
    const router = useRouter()
    const isConsumable = itemType === 'Consumables'
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const [form, setForm] = useState({
        quantity: 1,
        unitCost: 0,
        purchaseDate: '',
        serialNumber: '',
        inventoryNumber: '',
        currentCondition: 'Good',
        notes: '',
    })

    const reset = () => setForm({
        quantity: 1, unitCost: 0, purchaseDate: '', serialNumber: '',
        inventoryNumber: '', currentCondition: 'Good', notes: '',
    })

    const handleSubmit = async () => {
        setIsPending(true)
        let result: { success?: boolean; error?: string } | undefined

        if (isConsumable) {
            result = await addConsumableStock({
                itemId,
                itemInstanceId: instanceId,
                quantity: form.quantity,
                unitCost: form.unitCost,
                purchaseDate: form.purchaseDate || null,
                notes: form.notes || null,
            })
        } else {
            if (!form.inventoryNumber) {
                toast.error('Inventory number is required')
                setIsPending(false)
                return
            }
            result = await addItemInstance({
                itemId,
                unitCost: form.unitCost,
                quantity: 1,
                serialNumber: form.serialNumber || undefined,
                inventoryNumber: form.inventoryNumber,
                currentCondition: form.currentCondition,
                purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : undefined,
            })
        }

        if (result?.success) {
            toast.success(isConsumable ? 'Stock batch added' : 'Instance added')
            reset()
            setOpen(false)
            router.refresh()
        } else {
            toast.error(result?.error || 'Failed to add inventory')
        }
        setIsPending(false)
    }

    const isDisabled = isPending || (
        isConsumable
            ? form.quantity <= 0
            : !form.inventoryNumber
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    {isConsumable
                        ? <><Package className="mr-2 h-4 w-4" />Add Stock</>
                        : <><ListPlus className="mr-2 h-4 w-4" />Add Instance</>
                    }
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isConsumable ? 'Add Stock Batch' : 'Add Instance'} — {itemName}
                    </DialogTitle>
                    <DialogDescription>
                        {isConsumable
                            ? 'Add a new stock batch (FIFO ordering applied automatically).'
                            : 'Register a new physical unit for this item.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {isConsumable && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Quantity *</label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Quantity"
                                value={form.quantity || ''}
                                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium mb-1 block">Unit Cost (₱)</label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={form.unitCost || ''}
                            onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Purchase Date</label>
                        <Input
                            type="date"
                            value={form.purchaseDate}
                            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                        />
                    </div>

                    {!isConsumable && (
                        <>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Inventory Number *</label>
                                <Input
                                    placeholder="e.g. INV-2024-001"
                                    value={form.inventoryNumber}
                                    onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Serial Number</label>
                                <Input
                                    placeholder="Optional"
                                    value={form.serialNumber}
                                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {isConsumable && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Notes</label>
                            <Input
                                placeholder="Optional notes"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isDisabled}>
                        {isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
