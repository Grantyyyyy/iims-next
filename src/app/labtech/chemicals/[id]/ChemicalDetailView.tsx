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
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronLeft, Barcode, DollarSign, Calendar, Clock, Check, X, Package, Droplet, AlertTriangle, History, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { addChemicalBatch } from '../actions'
import { getChemicalUsageHistory } from '@/app/labtech/usage/actions'
import { getChemicalDistributionHistory } from '@/app/actions/labtech'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ScrollArea } from "@/components/ui/scroll-area"
import { convertToBaseUnit, determineBaseUnit } from '@/lib/unit-conversion'

interface ChemicalDetailViewProps {
    chemical: any
}

export function ChemicalDetailView({ chemical }: ChemicalDetailViewProps) {
    const router = useRouter()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [usageHistory, setUsageHistory] = useState<any[]>([])
    const [isLoadingUsage, setIsLoadingUsage] = useState(true)
    const [distributionHistory, setDistributionHistory] = useState<any[]>([])
    const [isLoadingDistributions, setIsLoadingDistributions] = useState(true)

    const [newBatch, setNewBatch] = useState({
        originalVolume: '',
        unitCost: '',
        unit: chemical.unit || '',
        purchaseDate: '',
        expiryDate: '',
        inventoryNumber: '',
        notes: ''
    })

    const baseUnit = chemical.unit ? determineBaseUnit(chemical.unit) : 'ML';
    const showPreview = newBatch.unit && newBatch.unit !== baseUnit && newBatch.originalVolume && !isNaN(parseFloat(newBatch.originalVolume));
    const previewVolume = showPreview ? convertToBaseUnit(parseFloat(newBatch.originalVolume), newBatch.unit) : 0;

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

    // Fetch distribution history on mount
    useEffect(() => {
        const fetchDistributionHistory = async () => {
            try {
                setIsLoadingDistributions(true)
                const history = await getChemicalDistributionHistory(chemical.id, 10)
                setDistributionHistory(history)
            } catch (error) {
                console.error('Failed to fetch distribution history:', error)
                toast.error('Failed to load distribution history')
            } finally {
                setIsLoadingDistributions(false)
            }
        }

        fetchDistributionHistory()
    }, [chemical.id])

    const handleAddBatch = async () => {
        if (!newBatch.originalVolume || !newBatch.unitCost || !newBatch.expiryDate || !newBatch.inventoryNumber || !newBatch.unit) {
            toast.error('All fields except purchase date and notes are required')
            return
        }

        setIsPending(true)
        const result = await addChemicalBatch({
            chemicalId: chemical.id,
            originalVolume: parseFloat(newBatch.originalVolume),
            unit: newBatch.unit,
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
                unit: chemical.unit || '',
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
                <div className="flex items-center gap-3">
                    <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <SheetTrigger asChild>
                            <Button className="h-10 px-5 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 border-none hover:shadow-lg transition-all active:scale-95 shadow-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Batch
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                            <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                                {/* Subtle Glow Effect */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                                <div className="relative z-10 text-left">
                                    <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Add Chemical Batch
                                    </SheetTitle>
                                    <SheetDescription className="text-sm font-medium mt-1">
                                        Register a new supply batch for <span className="text-foreground font-bold">{chemical.name}</span>.
                                    </SheetDescription>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 px-6 py-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Barcode className="h-3 w-3 text-primary/70" />
                                            Inventory Number
                                        </label>
                                        <Input
                                            placeholder="e.g. CHEM-HA-001"
                                            value={newBatch.inventoryNumber}
                                            onChange={(e) => setNewBatch({ ...newBatch, inventoryNumber: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Droplet className="h-3 w-3 text-primary/70" />
                                                Original Volume
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 2.5"
                                                value={newBatch.originalVolume}
                                                onChange={(e) => setNewBatch({ ...newBatch, originalVolume: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Package className="h-3 w-3 text-primary/70" />
                                                Unit
                                            </label>
                                            <Select
                                                value={newBatch.unit}
                                                onValueChange={(value) => setNewBatch({ ...newBatch, unit: value })}
                                            >
                                                <SelectTrigger className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300">
                                                    <SelectValue placeholder="Unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {baseUnit === 'ML' ? (
                                                        <>
                                                            <SelectItem value="ML">ML</SelectItem>
                                                            <SelectItem value="L">L</SelectItem>
                                                            <SelectItem value="GAL">GAL</SelectItem>
                                                        </>
                                                    ) : (
                                                        <SelectItem value="KG">KG</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {showPreview && (
                                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg ml-1">
                                            Will be stored as {previewVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseUnit}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <DollarSign className="h-3 w-3 text-primary/70" />
                                            Unit Cost
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 450.00"
                                            value={newBatch.unitCost}
                                            onChange={(e) => setNewBatch({ ...newBatch, unitCost: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary/70" />
                                                Purchase Date
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
                                                <AlertTriangle className="h-3 w-3 text-primary/70" />
                                                Expiry Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={newBatch.expiryDate}
                                                onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                                                className="h-11 rounded-xl bg-muted/20 focus:bg-background border-orange-200 focus:border-orange-500 transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Package className="h-3 w-3 text-primary/70" />
                                            Notes <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Input
                                            placeholder="Additional batch info..."
                                            value={newBatch.notes}
                                            onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
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
                                    onClick={handleAddBatch}
                                    disabled={isPending || !newBatch.originalVolume || !newBatch.unitCost || !newBatch.expiryDate || !newBatch.inventoryNumber}
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
                                            Add Batch
                                        </>
                                    )}
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>
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

            {/* Distribution History Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Droplet className="h-5 w-5 text-muted-foreground" />
                                Distribution History
                            </CardTitle>
                            <CardDescription>Recent chemical distributions to STAFF users</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingDistributions ? (
                        <div className="text-center py-6 text-muted-foreground">
                            Loading distribution history...
                        </div>
                    ) : distributionHistory.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No distribution records
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold text-foreground/80">Date</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Recipient</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Amount</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Subject</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Room</TableHead>
                                    <TableHead className="font-semibold text-foreground/80">Purpose</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {distributionHistory.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {format(new Date(record.date), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {record.recipientName}
                                        </TableCell>
                                        <TableCell>
                                            {record.amount.toFixed(2)} {record.unit}
                                        </TableCell>
                                        <TableCell>
                                            {record.subject}
                                        </TableCell>
                                        <TableCell>
                                            {record.room}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {record.purpose}
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
