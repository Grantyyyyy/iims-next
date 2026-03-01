'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter, SheetTrigger
} from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronLeft, Barcode, DollarSign, Calendar, Clock, Check, X, Package, Layers, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { addApparatusInstance, addApparatusBatch } from '../actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ScrollArea } from "@/components/ui/scroll-area"

interface ApparatusDetailViewProps {
    apparatus: any
}

export function ApparatusDetailView({ apparatus }: ApparatusDetailViewProps) {
    const router = useRouter()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const isConsumable = apparatus.apparatusType === 'Consumables'

    const [newInstance, setNewInstance] = useState({
        inventoryNumber: '',
        serialNumber: '',
        unitCost: '',
        purchaseDate: '',
        usefulLife: ''
    })

    const [newBatch, setNewBatch] = useState({
        originalQty: '',
        unitCost: '',
        purchaseDate: '',
        notes: ''
    })

    const handleAddInstance = async () => {
        if (!newInstance.inventoryNumber || !newInstance.unitCost) {
            toast.error('Inventory number and unit cost are required')
            return
        }

        setIsPending(true)
        const result = await addApparatusInstance({
            apparatusId: apparatus.id,
            inventoryNumber: newInstance.inventoryNumber,
            serialNumber: newInstance.serialNumber || undefined,
            unitCost: parseFloat(newInstance.unitCost),
            purchaseDate: newInstance.purchaseDate ? new Date(newInstance.purchaseDate) : undefined,
            usefulLife: newInstance.usefulLife ? parseInt(newInstance.usefulLife) : undefined
        })

        if (result.success) {
            toast.success('Instance added successfully')
            setNewInstance({
                inventoryNumber: '',
                serialNumber: '',
                unitCost: '',
                purchaseDate: '',
                usefulLife: ''
            })
            setIsAddOpen(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to add instance')
        }
        setIsPending(false)
    }

    const handleAddBatch = async () => {
        if (!newBatch.originalQty || !newBatch.unitCost) {
            toast.error('Quantity and unit cost are required')
            return
        }

        setIsPending(true)
        // Get user ID from session - for now using placeholder
        const result = await addApparatusBatch({
            apparatusId: apparatus.id,
            originalQty: parseInt(newBatch.originalQty),
            unitCost: parseFloat(newBatch.unitCost),
            purchaseDate: newBatch.purchaseDate ? new Date(newBatch.purchaseDate) : undefined,
            notes: newBatch.notes || undefined,
            userId: 1 // TODO: Get from session
        })

        if (result.success) {
            toast.success('Batch added successfully')
            setNewBatch({
                originalQty: '',
                unitCost: '',
                purchaseDate: '',
                notes: ''
            })
            setIsAddOpen(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to add batch')
        }
        setIsPending(false)
    }

    const getInstanceStatus = (instance: any) => {
        const activeBorrow = instance.labBorrowRecords?.find((b: any) => !b.returnDate)
        if (activeBorrow) {
            return { status: 'BORROWED', borrower: activeBorrow.borrower?.username || activeBorrow.studentName }
        }
        return { status: 'AVAILABLE', borrower: null }
    }

    const isExpired = (instance: any) => {
        if (!instance.purchaseDate || !instance.usefulLife) return false
        const purchaseDate = new Date(instance.purchaseDate)
        const expiryDate = new Date(purchaseDate.setFullYear(purchaseDate.getFullYear() + instance.usefulLife))
        return expiryDate < new Date()
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb / Back */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/labtech/apparatus">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Apparatus
                    </Link>
                </Button>
                <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <SheetTrigger asChild>
                        <Button className="h-10 px-5 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 border-none hover:shadow-lg transition-all active:scale-95 shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            {isConsumable ? 'Add Stock' : 'Add Instance'}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                        <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                            {/* Subtle Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                            <div className="relative z-10 text-left">
                                <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    {isConsumable ? 'Add Stock Batch' : 'Add Apparatus Instance'}
                                </SheetTitle>
                                <SheetDescription className="text-sm font-medium mt-1">
                                    Register {isConsumable ? 'a new batch' : 'a new instance'} of <span className="text-foreground font-bold">{apparatus.name}</span>.
                                </SheetDescription>
                            </div>
                        </SheetHeader>

                        <ScrollArea className="flex-1 px-6 py-8">
                            <div className="space-y-6">
                                {isConsumable ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Package className="h-3 w-3 text-primary/70" />
                                                Quantity
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 100"
                                                value={newBatch.originalQty}
                                                onChange={(e) => setNewBatch({ ...newBatch, originalQty: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <DollarSign className="h-3 w-3 text-primary/70" />
                                                Unit Cost
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 85"
                                                value={newBatch.unitCost}
                                                onChange={(e) => setNewBatch({ ...newBatch, unitCost: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary/70" />
                                                Purchase Date <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </label>
                                            <Input
                                                type="date"
                                                value={newBatch.purchaseDate}
                                                onChange={(e) => setNewBatch({ ...newBatch, purchaseDate: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Package className="h-3 w-3 text-primary/70" />
                                                Notes <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </label>
                                            <Input
                                                placeholder="Additional notes..."
                                                value={newBatch.notes}
                                                onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Barcode className="h-3 w-3 text-primary/70" />
                                                Inventory Number
                                            </label>
                                            <Input
                                                placeholder="e.g. LAB-BUR-001"
                                                value={newInstance.inventoryNumber}
                                                onChange={(e) => setNewInstance({ ...newInstance, inventoryNumber: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Barcode className="h-3 w-3 text-primary/70" />
                                                Serial Number <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </label>
                                            <Input
                                                placeholder="e.g. SN-BUR-001"
                                                value={newInstance.serialNumber}
                                                onChange={(e) => setNewInstance({ ...newInstance, serialNumber: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <DollarSign className="h-3 w-3 text-primary/70" />
                                                Unit Cost
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 450"
                                                value={newInstance.unitCost}
                                                onChange={(e) => setNewInstance({ ...newInstance, unitCost: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary/70" />
                                                Purchase Date <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </label>
                                            <Input
                                                type="date"
                                                value={newInstance.purchaseDate}
                                                onChange={(e) => setNewInstance({ ...newInstance, purchaseDate: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-primary/70" />
                                                Useful Life (Years) <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 5"
                                                value={newInstance.usefulLife}
                                                onChange={(e) => setNewInstance({ ...newInstance, usefulLife: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </ScrollArea>

                        <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddOpen(false)}
                                className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={isConsumable ? handleAddBatch : handleAddInstance}
                                disabled={isPending || (isConsumable
                                    ? !newBatch.originalQty || !newBatch.unitCost
                                    : !newInstance.inventoryNumber || !newInstance.unitCost
                                )}
                                className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        {isConsumable ? 'Add Batch' : 'Add Instance'}
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl flex items-center gap-2">
                                {isConsumable ? <Package className="h-6 w-6 text-muted-foreground" /> : <Layers className="h-6 w-6 text-muted-foreground" />}
                                {apparatus.name}
                            </CardTitle>
                            <CardDescription>
                                {apparatus.category ? apparatus.category.name : 'No Category'} &mdash; {apparatus.description || 'No description available'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={isConsumable ? 'secondary' : 'outline'}>{apparatus.apparatusType || 'Apparatus'}</Badge>
                            <Badge variant="default" className="text-base px-3 py-1">
                                {isConsumable ? (
                                    `${apparatus.batches?.reduce((sum: number, b: any) => sum + b.remainingQty, 0) || 0} units remaining`
                                ) : (
                                    `${apparatus.instances?.length || 0} instance${apparatus.instances?.length !== 1 ? 's' : ''}`
                                )}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Instances/Batches Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{isConsumable ? 'Stock Batches' : 'Apparatus Instances'}</CardTitle>
                    <CardDescription>
                        {isConsumable
                            ? 'Batch inventory ordered by purchase date (FIFO)'
                            : 'Individual units with tracking information'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isConsumable ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold text-foreground/80">Batch No.</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Purchase Date</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Original Qty</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Remaining</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Unit Cost</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Date Added</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apparatus.batches.map((batch: any) => (
                                    <TableRow key={batch.id} className={batch.remainingQty === 0 ? 'opacity-40' : ''}>
                                        <TableCell className="font-medium font-mono">{batch.batchNumber}</TableCell>
                                        <TableCell>
                                            {batch.purchaseDate ? format(new Date(batch.purchaseDate), 'MMM dd, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>{batch.originalQty}</TableCell>
                                        <TableCell>
                                            {batch.remainingQty === 0 ? (
                                                <Badge variant="destructive">Exhausted</Badge>
                                            ) : (
                                                <Badge variant="default">{batch.remainingQty}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>₱{batch.unitCost.toLocaleString()}</TableCell>
                                        <TableCell>{format(new Date(batch.addedAt), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{batch.notes || '—'}</TableCell>
                                    </TableRow>
                                ))}
                                {apparatus.batches.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                            No batches found. Add your first batch above.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold text-foreground/80">Inventory No.</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Serial No.</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Condition</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Current Holder</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Unit Cost</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Purchase Date</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Useful Life</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apparatus.instances.map((instance: any) => {
                                    const { status, borrower } = getInstanceStatus(instance)
                                    const expired = isExpired(instance)

                                    return (
                                        <TableRow key={instance.id} className={expired ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                                            <TableCell className="font-mono font-medium">{instance.inventoryNumber}</TableCell>
                                            <TableCell className="font-mono text-sm">{instance.serialNumber || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    instance.currentCondition === 'Good' ? 'default' :
                                                        instance.currentCondition === 'Fair' ? 'secondary' :
                                                            'destructive'
                                                }>{instance.currentCondition}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status === 'AVAILABLE' ? 'default' : 'secondary'}>
                                                    {status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{borrower || '-'}</TableCell>
                                            <TableCell>₱{instance.unitCost.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {instance.purchaseDate ? format(new Date(instance.purchaseDate), 'MMM dd, yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {instance.usefulLife ? (
                                                    <span className={expired ? 'text-orange-600 font-semibold' : ''}>
                                                        {instance.usefulLife} years {expired && '(Expired)'}
                                                    </span>
                                                ) : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {apparatus.instances.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                            No instances found. Add your first instance above.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
