'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    Search, 
    FilterX, 
    Copy, 
    ExternalLink, 
    ArrowRight, 
    RotateCcw,
    AlertCircle,
    Package
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { returnItem } from '@/actions/secretary'
import { cn } from '@/lib/utils'

interface InstanceTableProps {
    initialData: any
    categories: any[]
    filters: any
}

export function InstanceTable({ initialData, categories, filters }: InstanceTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [localSearch, setLocalSearch] = useState(filters.search || '')
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
    const [selectedInstance, setSelectedInstance] = useState<any>(null)
    const [returnDetails, setReturnDetails] = useState({
        conditionOnReturn: 'Good',
        notes: ''
    })
    const [isPending, setIsPending] = useState(false)

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            if (localSearch !== (filters.search || '')) {
                updateParams({ search: localSearch, page: '1' })
            }
        }, 500)
        return () => clearTimeout(t)
    }, [localSearch, filters.search])

    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'All') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const clearFilters = () => {
        setLocalSearch('')
        router.push(pathname)
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    const handleReturn = async () => {
        if (!selectedInstance || !selectedInstance.borrowRecords?.[0]) return

        setIsPending(true)
        const result = await returnItem(
            selectedInstance.borrowRecords[0].id, 
            returnDetails.conditionOnReturn, 
            returnDetails.notes
        )
        setIsPending(false)

        if (result.success) {
            toast.success('Item returned successfully')
            setIsReturnDialogOpen(false)
            setSelectedInstance(null)
            setReturnDetails({ conditionOnReturn: 'Good', notes: '' })
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to process return')
        }
    }

    const isPastUsefulLife = (purchaseDate: string | Date | null, usefulLife: number | null) => {
        if (!purchaseDate || usefulLife === null) return false
        const pDate = new Date(purchaseDate)
        const expiryDate = new Date(pDate.setFullYear(pDate.getFullYear() + usefulLife))
        return expiryDate < new Date()
    }

    const conditionOptions = ['All', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']
    const statusOptions = ['All', 'available', 'borrowed']

    const hasAnyFilter = filters.search || filters.condition || filters.status || filters.categoryId

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by item, S/N, or inventory no..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="pl-10 h-10 rounded-lg"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {hasAnyFilter && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive">
                                <FilterX className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 border-t pt-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</span>
                        <div className="flex bg-muted p-1 rounded-lg">
                            {conditionOptions.map((opt) => (
                                <Button
                                    key={opt}
                                    variant={ (filters.condition === opt || (!filters.condition && opt === 'All')) ? 'default' : 'ghost' }
                                    size="sm"
                                    onClick={() => updateParams({ condition: opt, page: '1' })}
                                    className={cn(
                                        "h-7 px-3 rounded-md text-xs transition-all",
                                        (filters.condition === opt || (!filters.condition && opt === 'All')) ? "shadow-sm" : "hover:bg-background/50"
                                    )}
                                >
                                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                        <div className="flex bg-muted p-1 rounded-lg">
                            {statusOptions.map((opt) => (
                                <Button
                                    key={opt}
                                    variant={ (filters.status === opt || (!filters.status && opt === 'All')) ? 'default' : 'ghost' }
                                    size="sm"
                                    onClick={() => updateParams({ status: opt, page: '1' })}
                                    className={cn(
                                        "h-7 px-3 rounded-md text-xs transition-all",
                                        (filters.status === opt || (!filters.status && opt === 'All')) ? "shadow-sm" : "hover:bg-background/50"
                                    )}
                                >
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
                        <Select
                            value={filters.categoryId?.toString() || "All"}
                            onValueChange={(v) => updateParams({ categoryId: v, page: '1' })}
                        >
                            <SelectTrigger className="h-9 rounded-lg">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Categories</SelectItem>
                                {categories.map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">Item Name</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold">Inventory No.</TableHead>
                            <TableHead className="font-semibold">Serial No.</TableHead>
                            <TableHead className="font-semibold">Condition</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Current Holder</TableHead>
                            <TableHead className="font-semibold">Unit Cost</TableHead>
                            <TableHead className="font-semibold">Purchase Date</TableHead>
                            <TableHead className="font-semibold">Useful Life</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.instances.map((inst: any) => {
                            const pastLife = isPastUsefulLife(inst.purchaseDate, inst.usefulLife)
                            const isBorrowed = inst.borrowRecords.length > 0
                            const currentBorrow = isBorrowed ? inst.borrowRecords[0] : null

                            return (
                                <TableRow 
                                    key={inst.id}
                                    className={cn(
                                        "transition-colors group",
                                        pastLife ? "bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/20" : "hover:bg-muted/50"
                                    )}
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link 
                                                href={`/secretary/items/${inst.itemId}`}
                                                className="font-medium text-primary hover:underline flex items-center gap-1"
                                            >
                                                {inst.item.name}
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                            <span className="text-xs text-muted-foreground">{inst.item.model || 'No model'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                                            {inst.item.category?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 font-mono text-xs">
                                            {inst.inventoryNumber}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleCopy(inst.inventoryNumber)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {inst.serialNumber || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            className={cn(
                                                "capitalize px-2 py-0.5 text-[10px] font-bold",
                                                inst.currentCondition?.toUpperCase() === 'GOOD' && "bg-green-500 hover:bg-green-600",
                                                inst.currentCondition?.toUpperCase() === 'FAIR' && "bg-yellow-500 hover:bg-yellow-600",
                                                inst.currentCondition?.toUpperCase() === 'POOR' && "bg-orange-500 hover:bg-orange-600",
                                                inst.currentCondition?.toUpperCase() === 'DAMAGED' && "bg-red-500 hover:bg-red-600"
                                            )}
                                        >
                                            {inst.currentCondition?.toLowerCase() || 'good'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-background",
                                                isBorrowed ? "bg-blue-500 ring-blue-500/20" : "bg-green-500 ring-green-500/20"
                                            )} />
                                            <span className="text-xs font-medium">
                                                {isBorrowed ? 'Borrowed' : 'Available'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isBorrowed ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium">
                                                    {currentBorrow.borrower 
                                                        ? `${currentBorrow.borrower.firstName || ''} ${currentBorrow.borrower.lastName || ''}`.trim() || 'No User'
                                                        : currentBorrow.customBorrower || 'Unknown'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">Since {new Date(currentBorrow.borrowDate).toLocaleDateString()}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">In Storage</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium">
                                        ₱{inst.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {inst.purchaseDate ? new Date(inst.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "text-xs",
                                                pastLife ? "text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1" : "text-muted-foreground"
                                            )}>
                                                {inst.usefulLife ? `${inst.usefulLife} yr(s)` : '—'}
                                                {pastLife && <AlertCircle className="h-3 w-3" />}
                                            </span>
                                            {pastLife && (
                                                <Badge variant="outline" className="text-[8px] h-4 px-1 border-orange-200 text-orange-600 bg-orange-50">Expired</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Link href={`/secretary/items/${inst.itemId}`}>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {isBorrowed && (
                                                <Dialog open={isReturnDialogOpen && selectedInstance?.id === inst.id} onOpenChange={(open) => {
                                                    if (!open) setSelectedInstance(null)
                                                    setIsReturnDialogOpen(open)
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-[10px] font-bold uppercase transition-all hover:bg-primary hover:text-white"
                                                            onClick={() => setSelectedInstance(inst)}
                                                        >
                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                            Return
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Process Return</DialogTitle>
                                                            <DialogDescription>
                                                                Returning <strong>{inst.item.name}</strong> from <strong>{currentBorrow.borrower ? `${currentBorrow.borrower.firstName} ${currentBorrow.borrower.lastName}` : currentBorrow.customBorrower || 'Staff'}</strong>.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Condition on Return</label>
                                                                <Select
                                                                    value={returnDetails.conditionOnReturn}
                                                                    onValueChange={(v) => setReturnDetails({ ...returnDetails, conditionOnReturn: v })}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Condition" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Good">Good</SelectItem>
                                                                        <SelectItem value="Fair">Fair</SelectItem>
                                                                        <SelectItem value="Damaged">Damaged</SelectItem>
                                                                        <SelectItem value="Lost">Lost</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Notes / Remarks</label>
                                                                <textarea
                                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                    placeholder="Describe any issues or notes..."
                                                                    rows={3}
                                                                    value={returnDetails.notes}
                                                                    onChange={(e) => setReturnDetails({ ...returnDetails, notes: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => setIsReturnDialogOpen(false)}
                                                                disabled={isPending}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={handleReturn} disabled={isPending}>
                                                                {isPending ? 'Processing...' : 'Complete Return'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {initialData.instances.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={11} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Package className="h-10 w-10 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground">No instances found matching the filters.</p>
                                        <Button variant="link" onClick={clearFilters}>Clear all filters</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2">
                <span className="text-sm text-muted-foreground">
                    Showing {initialData.instances.length > 0 ? (filters.page - 1) * 20 + 1 : 0} to {Math.min(filters.page * 20, initialData.total)} of {initialData.total} instances
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page <= 1}
                        onClick={() => updateParams({ page: (filters.page - 1).toString() })}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1.5 mx-2">
                        {Array.from({ length: Math.min(initialData.pages, 5) }).map((_, i) => {
                            const p = i + 1
                            return (
                                <Button
                                    key={p}
                                    variant={filters.page === p ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-8 w-8 text-xs"
                                    onClick={() => updateParams({ page: p.toString() })}
                                >
                                    {p}
                                </Button>
                            )
                        })}
                        {initialData.pages > 5 && <span className="text-muted-foreground mx-1">...</span>}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={filters.page >= initialData.pages}
                        onClick={() => updateParams({ page: (filters.page + 1).toString() })}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
