'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sheet, SheetContent, SheetDescription, SheetFooter,
    SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { addConsumableStock } from '@/app/actions/secretary'
import { addItemInstance } from '@/actions/secretary'
import { toast } from 'sonner'
import { Plus, Package, ListPlus, Check, X, Loader2, Barcode, Calendar, DollarSign, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddInventoryButtonProps {
    itemId: number
    instanceId: number
    itemType: string     // 'Consumables' | 'Non-Consumables'
    itemName: string
    isReadOnly?: boolean
}

export function AddInventoryButton({ itemId, instanceId, itemType, itemName, isReadOnly = false }: AddInventoryButtonProps) {
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
        <Sheet open={open} onOpenChange={setOpen}>
            {!isReadOnly && (
                <SheetTrigger asChild>
                    <Button className="h-10 px-5 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 border-none hover:shadow-lg transition-all active:scale-95 shadow-sm">
                        {isConsumable
                            ? <><Package className="mr-2 h-4 w-4" />Add Stock</>
                            : <><ListPlus className="mr-2 h-4 w-4" />Add Instance</>
                        }
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                    {/* Subtle Glow Effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                    <div className="relative z-10 text-left">
                        <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent line-clamp-1">
                            {isConsumable ? 'Add Stock Batch' : 'Add Instance'} — {itemName}
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium mt-1">
                            {isConsumable
                                ? 'Add a new stock batch (FIFO ordering applied automatically).'
                                : 'Register a new physical unit for this item.'}
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-8">
                    <div className="space-y-6">
                        {isConsumable && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Package className="h-3 w-3 text-primary/70" />
                                    Quantity *
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Quantity"
                                    value={form.quantity || ''}
                                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                                    className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-primary/70" />
                                Unit Cost (₱)
                            </label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="0.00"
                                value={form.unitCost || ''}
                                onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-primary/70" />
                                Purchase Date
                            </label>
                            <Input
                                type="date"
                                value={form.purchaseDate}
                                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                            />
                        </div>

                        {!isConsumable && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <Barcode className="h-3 w-3 text-primary/70" />
                                        Inventory Number *
                                    </label>
                                    <Input
                                        placeholder="e.g. INV-2024-001"
                                        value={form.inventoryNumber}
                                        onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <Barcode className="h-3 w-3 text-primary/70" />
                                        Serial Number
                                    </label>
                                    <Input
                                        placeholder="Optional"
                                        value={form.serialNumber}
                                        onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                    />
                                </div>
                            </>
                        )}

                        {isConsumable && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-primary/70" />
                                    Notes
                                </label>
                                <Input
                                    placeholder="Optional notes"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isDisabled}
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
                                Save Inventory
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
