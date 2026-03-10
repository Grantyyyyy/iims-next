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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Search,
    Filter,
    X,
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Trash2,
    Copy,
    ExternalLink,
    ArrowRight,
    RotateCcw,
    AlertCircle,
    Package,
    Check,
    Loader2,
    Clock,
    User,
    ClipboardList,
    FilterX
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { returnItem } from '@/actions/secretary'
import { cn } from '@/lib/utils'

interface InstanceTableProps {
    initialData: any
    categories: any[]
    filters: any
    isReadOnly?: boolean
}

export function InstanceTable({ initialData, categories, filters, isReadOnly = false }: InstanceTableProps) {
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
            <div className="flex flex-col gap-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by item, S/N, or inventory no..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="pl-10 h-10 rounded-lg bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {hasAnyFilter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            >
                                <FilterX className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 border-t pt-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Condition</span>
                        <div className="flex bg-muted p-1 rounded-lg">
                            {conditionOptions.map((opt) => (
                                <Button
                                    key={opt}
                                    variant={(filters.condition === opt || (!filters.condition && opt === 'All')) ? 'default' : 'ghost'}
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
                                    variant={(filters.status === opt || (!filters.status && opt === 'All')) ? 'default' : 'ghost'}
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

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                {[
                                    { label: 'Item & Category', className: 'font-semibold' },
                                    { label: 'Identification', className: 'font-semibold' },
                                    { label: 'Condition', className: 'font-semibold' },
                                    { label: 'Status & Holder', className: 'font-semibold' },
                                    { label: 'Acquisition', className: 'font-semibold text-center' },
                                    { label: 'Actions', className: 'text-right font-semibold' },
                                ].map((col) => (
                                    <TableHead key={col.label} className={col.className}>
                                        {col.label}
                                    </TableHead>
                                ))}
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
                                            <div className="flex flex-col gap-0.5">
                                                <Link
                                                    href={`/secretary/items/${inst.itemId}`}
                                                    className="font-medium text-primary hover:underline flex items-center gap-1 group/link"
                                                >
                                                    {inst.item.name}
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </Link>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{inst.item.model || 'No model'}</span>
                                                    <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal border-primary/20 bg-primary/5 text-primary">
                                                        {inst.item.category?.name}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
                                                    {inst.inventoryNumber}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleCopy(inst.inventoryNumber)}
                                                    >
                                                        <Copy className="h-2.5 w-2.5" />
                                                    </Button>
                                                </div>
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    S/N: {inst.serialNumber || '—'}
                                                </span>
                                            </div>
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
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-background",
                                                        isBorrowed ? "bg-blue-500 ring-blue-500/20" : "bg-green-500 ring-green-500/20"
                                                    )} />
                                                    <span className="text-xs font-medium">
                                                        {isBorrowed ? 'Borrowed' : 'Available'}
                                                    </span>
                                                </div>
                                                {isBorrowed ? (
                                                    <div className="flex flex-col pl-3.5 border-l-2 border-muted">
                                                        <span className="text-xs font-medium">
                                                            {currentBorrow.borrower
                                                                ? `${currentBorrow.borrower.firstName || ''} ${currentBorrow.borrower.lastName || ''}`.trim() || 'No User'
                                                                : currentBorrow.customBorrower || 'Unknown'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">Since {new Date(currentBorrow.borrowDate).toLocaleDateString()}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic pl-3.5">In Storage</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-center text-center gap-1">
                                                <span className="text-xs font-semibold text-primary">
                                                    ₱{inst.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {inst.purchaseDate ? new Date(inst.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No Date'}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className={cn(
                                                        "text-[10px]",
                                                        pastLife ? "text-orange-600 dark:text-orange-400 font-bold" : "text-muted-foreground"
                                                    )}>
                                                        {inst.usefulLife ? `${inst.usefulLife}y` : '—'}
                                                    </span>
                                                    {pastLife && <AlertCircle className="h-3 w-3 text-orange-500" />}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Link href={`/secretary/items/${inst.itemId}`}>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {!isReadOnly && isBorrowed && (
                                                    <Sheet open={isReturnDialogOpen && selectedInstance?.id === inst.id} onOpenChange={(open) => {
                                                        if (!open) setSelectedInstance(null)
                                                        setIsReturnDialogOpen(open)
                                                    }}>
                                                        <SheetTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-[10px] font-bold uppercase transition-all hover:bg-primary hover:text-white rounded-lg px-3"
                                                                onClick={() => setSelectedInstance(inst)}
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                                Return
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                                                            <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                                                                {/* Subtle Glow Effect */}
                                                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                                                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                                                                <div className="relative z-10 text-left">
                                                                    <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                                                        Process Return
                                                                    </SheetTitle>
                                                                    <SheetDescription className="text-sm font-medium mt-1">
                                                                        Returning <span className="text-foreground font-bold">{inst.item.name}</span> from <span className="text-foreground font-bold">{currentBorrow.borrower ? `${currentBorrow.borrower.firstName} ${currentBorrow.borrower.lastName}` : currentBorrow.customBorrower || 'Staff'}</span>.
                                                                    </SheetDescription>
                                                                </div>
                                                            </SheetHeader>

                                                            <ScrollArea className="flex-1 px-6 py-8">
                                                                <div className="space-y-6">
                                                                    {/* Info Card */}
                                                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                                                <User className="h-5 w-5 text-primary" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Borrower</span>
                                                                                <span className="font-semibold text-sm">
                                                                                    {currentBorrow.borrower ? `${currentBorrow.borrower.firstName} ${currentBorrow.borrower.lastName}` : currentBorrow.customBorrower || 'Staff/External'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                                                <Clock className="h-5 w-5 text-primary" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Borrowed Since</span>
                                                                                <span className="font-semibold text-sm">
                                                                                    {format(new Date(currentBorrow.borrowDate), 'PPP')}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                                            <ClipboardList className="h-3 w-3 text-primary/70" />
                                                                            Condition on Return
                                                                        </label>
                                                                        <Select
                                                                            value={returnDetails.conditionOnReturn}
                                                                            onValueChange={(v) => setReturnDetails({ ...returnDetails, conditionOnReturn: v })}
                                                                        >
                                                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all duration-300">
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
                                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                                            <AlertCircle className="h-3 w-3 text-primary/70" />
                                                                            Notes / Remarks
                                                                        </label>
                                                                        <textarea
                                                                            className="w-full min-h-[120px] rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm focus-visible:outline-none focus:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300 resize-none"
                                                                            placeholder="Describe any issues, findings, or special notes..."
                                                                            value={returnDetails.notes}
                                                                            onChange={(e) => setReturnDetails({ ...returnDetails, notes: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </ScrollArea>

                                                            <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setIsReturnDialogOpen(false)}
                                                                    disabled={isPending}
                                                                    className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleReturn}
                                                                    disabled={isPending}
                                                                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[170px]"
                                                                >
                                                                    {isPending ? (
                                                                        <>
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Check className="h-4 w-4" />
                                                                            Complete Return
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </SheetFooter>
                                                        </SheetContent>
                                                    </Sheet>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {initialData.instances.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
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
        </div>
    )
}
