'use client'

import React, { useState, useEffect } from 'react'
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
import { Plus, ChevronLeft, Barcode, DollarSign, Calendar, Clock, Check, X, Package, Droplet, AlertTriangle, History } from 'lucide-react'
import Link from 'next/link'
import { addChemicalBatch } from '../actions'
import { getChemicalUsageHistory } from '@/app/labtech/usage/actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface ChemicalDetailViewProps {
    chemical: any
}

export function ChemicalDetailView({ chemical }: ChemicalDetailViewProps) {
    const router = useRouter()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [usageHistory, setUsageHistory] = useState<any[]>([])
    const [isLoadingUsage, setIsLoadingUsage] = useState(true)

    const [newBatch, setNewBatch] = useState({
        originalVolume: '',
        unitCost: '',
        purchaseDate: '',
        expiryDate: '',
        inventoryNumber: '',
        notes: ''
    })

    // Fetch usage history on mount
    useEffect(() => {
        const fetchUsageHistory = async () => {
            try {
                setIsLoadingUsage(true)
                const history = await getChemicalUsageHistory(chemical.id, 10)
                setUsageHistory(history)
            } catch (error) {
                console.error('Failed to fetch usage history:', error)
                toast.error('Failed to load usage history')
            } finally {
                setIsLoadingUsage(false)
            }
        }

        fetchUsageHistory()
    }, [chemical.id])

    const handleAddBatch = async () => {
        if (!newBatch.originalVolume || !newBatch.unitCost || !newBatch.expiryDate || !newBatch.inventoryNumber) {
            toast.error('All fields except purchase date and notes are required')
            return
        }

        setIsPending(true)
        const result = await addChemicalBatch({
            chemicalId: chemical.id,
            originalVolume: parseFloat(newBatch.originalVolume),
            unitCost: parseFloat(newBatch.unitCost),
            purchaseDate: newBatch.purchaseDate ? new Date(newBatch.purchaseDate) : undefined,
            expiryDate: new Date(newBatch.expiryDate),
            inventoryNumber: newBatch.inventoryNumber,
            notes: newBatch.notes || undefined,
            userId: 1 // TODO: Get from session
        })

        if (result.success) {
            toast.success('Batch added successfully')
            setNewBatch({
                originalVolume: '',
                unitCost: '',
                purchaseDate: '',
                expiryDate: '',
                inventoryNumber: '',
                notes: ''
            })
            setIsAddOpen(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to add batch')
        }
        setIsPending(false)
    }

    const getBatchStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="default" className="bg-green-500">Active</Badge>
            case 'EXPIRING':
                return <Badge variant="default" className="bg-orange-500">Expiring Soon</Badge>
            case 'EXPIRED':
                return <Badge variant="destructive">Expired</Badge>
            case 'EXHAUSTED':
                return <Badge variant="secondary">Exhausted</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb / Back */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/labtech/chemicals">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Chemicals
                    </Link>
                </Button>
                <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <SheetTrigger asChild>
                        <Button variant="default" className="shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Stock Batch
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Add Chemical Batch</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Register a new supply batch for {chemical.name}.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <Barcode className="h-4 w-4 text-primary/70" />
                                        Inventory Number
                                    </label>
                                    <Input
                                        placeholder="e.g. CHEM-HA-001"
                                        value={newBatch.inventoryNumber}
                                        onChange={(e) => setNewBatch({ ...newBatch, inventoryNumber: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <Droplet className="h-4 w-4 text-primary/70" />
                                        Original Volume ({chemical.unit})
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 2.5"
                                        value={newBatch.originalVolume}
                                        onChange={(e) => setNewBatch({ ...newBatch, originalVolume: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <DollarSign className="h-4 w-4 text-primary/70" />
                                        Unit Cost
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 450.00"
                                        value={newBatch.unitCost}
                                        onChange={(e) => setNewBatch({ ...newBatch, unitCost: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                            <Calendar className="h-4 w-4 text-primary/70" />
                                            Purchase Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={newBatch.purchaseDate}
                                            onChange={(e) => setNewBatch({ ...newBatch, purchaseDate: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                            <AlertTriangle className="h-4 w-4 text-primary/70" />
                                            Expiry Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={newBatch.expiryDate}
                                            onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                                            className="h-11 border-orange-200 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <Package className="h-4 w-4 text-primary/70" />
                                        Notes <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                    </label>
                                    <Input
                                        placeholder="Additional batch info..."
                                        value={newBatch.notes}
                                        onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="px-6 h-11 shrink-0">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleAddBatch}
                                    disabled={isPending || !newBatch.originalVolume || !newBatch.unitCost || !newBatch.expiryDate || !newBatch.inventoryNumber}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Add Batch</>
                                    )}
                                </Button>
                            </div>
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
                                <Droplet className="h-6 w-6 text-muted-foreground" />
                                {chemical.name}
                            </CardTitle>
                            <CardDescription>
                                Chemical Reagent &mdash; {chemical.description || 'No description available'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">Chemicals</Badge>
                            <Badge variant="default" className="text-base px-3 py-1">
                                {chemical.volume?.toFixed(2)} {chemical.unit || 'Units'} remaining
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Batches Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Chemical Batches</CardTitle>
                    <CardDescription>Track chemical stock by purchase batch and expiry</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-semibold text-foreground/80">Batch No.</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Inventory No.</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Purchase Date</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Expiry Date</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Remaining</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Unit Cost</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Added By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {chemical.batches.map((batch: any) => (
                                <TableRow key={batch.id} className={batch.status === 'EXPIRED' || batch.status === 'EXHAUSTED' ? 'opacity-40' : ''}>
                                    <TableCell className="font-medium font-mono">{batch.batchNumber}</TableCell>
                                    <TableCell>{batch.inventoryNumber}</TableCell>
                                    <TableCell>
                                        {batch.purchaseDate ? format(new Date(batch.purchaseDate), 'MMM dd, yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={batch.status === 'EXPIRING' ? 'text-orange-600 font-semibold' : batch.status === 'EXPIRED' ? 'text-destructive font-semibold' : ''}>
                                            {batch.expiryDate ? format(new Date(batch.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {batch.remainingVolume.toFixed(2)} / {batch.originalVolume.toFixed(2)} {chemical.unit}
                                    </TableCell>
                                    <TableCell>₱{batch.unitCost.toLocaleString()}</TableCell>
                                    <TableCell>{getBatchStatusBadge(batch.status)}</TableCell>
                                    <TableCell>{batch.addedBy?.username || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                            {chemical.batches.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                        No batches found. Add your first stock batch above.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Usage History Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                Usage History
                            </CardTitle>
                            <CardDescription>Recent chemical usage records</CardDescription>
                        </div>
                        {usageHistory.length > 0 && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/labtech/usage?search=${encodeURIComponent(chemical.name)}`}>
                                    View All Usage
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingUsage ? (
                        <div className="text-center py-6 text-muted-foreground">
                            Loading usage history...
                        </div>
                    ) : usageHistory.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No usage records
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold text-foreground/80">Date Used</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Quantity Used</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Used By</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Subject Code</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Room Name</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Purpose</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageHistory.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {format(new Date(record.dateUsed), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            {record.quantityUsed.toFixed(2)} {record.unit || chemical.unit}
                                        </TableCell>
                                        <TableCell>
                                            {record.usedBy 
                                                ? `${record.usedBy.firstName || ''} ${record.usedBy.lastName || ''}`.trim() || record.usedBy.username
                                                : 'Internal'}
                                        </TableCell>
                                        <TableCell>
                                            {record.subject?.code || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {record.room?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {record.purpose || 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
