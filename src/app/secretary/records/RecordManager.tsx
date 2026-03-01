'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { returnItem } from '@/actions/secretary'
import { toast } from 'sonner'
import { Download, Search, FilterX, Loader2, Check, X, ClipboardList, Info } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface RecordManagerProps {
    type: 'BORROW' | 'DISTRIBUTION'
    records: any[]
}

const ITEMS_PER_PAGE = 15

export function RecordManager({ type, records }: RecordManagerProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // URL State Extractors
    const currentTab = searchParams.get('tab') || 'borrows'

    // Determine which prefix to use based on type
    const prefix = type === 'BORROW' ? 'b' : 'd'
    const nameParam = searchParams.get(`${prefix}Name`) || ''
    const statusParam = searchParams.get(`${prefix}Status`) || 'All'
    const fromParam = searchParams.get(`${prefix}From`) || ''
    const toParam = searchParams.get(`${prefix}To`) || ''
    const pageParam = parseInt(searchParams.get(`${prefix}Page`) || '1', 10)

    // Local state for debounced inputs
    const [localName, setLocalName] = useState(nameParam)

    // UI State
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [returnDetails, setReturnDetails] = useState({
        conditionOnReturn: 'Good',
        notes: ''
    })
    const [isPending, setIsPending] = useState(false)

    // Debounce name search
    useEffect(() => {
        const t = setTimeout(() => {
            if (localName !== nameParam) {
                updateParams({ [`${prefix}Name`]: localName, [`${prefix}Page`]: '1' })
            }
        }, 500)
        return () => clearTimeout(t)
    }, [localName, nameParam, prefix])

    // Helper to update URL params
    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())

        // Ensure tab is set when interacting
        if (!params.has('tab')) {
            params.set('tab', currentTab)
        }

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const clearFilters = () => {
        setLocalName('')
        updateParams({
            [`${prefix}Name`]: null,
            [`${prefix}Status`]: null,
            [`${prefix}From`]: null,
            [`${prefix}To`]: null,
            [`${prefix}Page`]: '1'
        })
    }

    // Pagination Logic
    const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE)
    const paginatedRecords = useMemo(() => {
        const start = (pageParam - 1) * ITEMS_PER_PAGE
        return records.slice(start, start + ITEMS_PER_PAGE)
    }, [records, pageParam])

    const exportToCSV = () => {
        if (records.length === 0) return

        let csvContent = "data:text/csv;charset=utf-8,"

        if (type === 'BORROW') {
            csvContent += "Item,S/N,Borrower,Quantity,Room,Borrow Date,Due Date,Status\n"
            records.forEach(record => {
                const row = [
                    `"${record.itemInstance?.item?.name || ''}"`,
                    `"${record.itemInstance?.serialNumber || ''}"`,
                    `"${record.borrower?.firstName || ''} ${record.borrower?.lastName || ''}"`,
                    record.quantity,
                    `"${record.room?.name || ''}"`,
                    new Date(record.borrowDate).toLocaleDateString(),
                    record.duration ? new Date(new Date(record.borrowDate).getTime() + record.duration * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A',
                    record.returnRecord ? 'Returned' : 'Borrowed'
                ].join(",")
                csvContent += row + "\n"
            })
        } else {
            csvContent += "Item,Recipient,Distributed By,Quantity,Room,Purpose,Distributed At\n"
            records.forEach(record => {
                const row = [
                    `"${record.itemInstance?.item?.name || ''}"`,
                    `"${record.recipient?.firstName || ''} ${record.recipient?.lastName || ''}"`,
                    `"${record.distributedBy?.firstName || ''} ${record.distributedBy?.lastName || ''}"`,
                    record.quantity,
                    `"${record.room?.name || ''}"`,
                    `"${record.purpose || ''}"`,
                    new Date(record.distributedAt).toLocaleDateString()
                ].join(",")
                csvContent += row + "\n"
            })
        }

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `${type.toLowerCase()}_records_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleReturn = async () => {
        if (!selectedRecord) return

        setIsPending(true)
        const result = await returnItem(selectedRecord.id, returnDetails.conditionOnReturn, returnDetails.notes)
        setIsPending(false)

        if (result.success) {
            // Optimistic UI update could be added here, but revalidatePath in server action will refresh
            toast.success('Item returned successfully')
            setIsReturnDialogOpen(false)
            setSelectedRecord(null)
            setReturnDetails({ conditionOnReturn: 'Good', notes: '' })
        } else {
            toast.error(result.error || 'Failed to process return')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex flex-wrap items-end gap-3 flex-1">
                    <div className="space-y-1.5 flex-1 min-w-[200px] max-w-sm">
                        <label className="text-xs font-medium text-muted-foreground">Search {type === 'BORROW' ? 'Borrower' : 'Recipient'}</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                className="pl-9 bg-background h-10 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 w-[140px]">
                        <label className="text-xs font-medium text-muted-foreground">From</label>
                        <Input
                            type="date"
                            className="bg-background h-9"
                            value={fromParam}
                            onChange={(e) => updateParams({ [`${prefix}From`]: e.target.value, [`${prefix}Page`]: '1' })}
                        />
                    </div>

                    <div className="space-y-1.5 w-[140px]">
                        <label className="text-xs font-medium text-muted-foreground">To</label>
                        <Input
                            type="date"
                            className="bg-background h-9"
                            value={toParam}
                            onChange={(e) => updateParams({ [`${prefix}To`]: e.target.value, [`${prefix}Page`]: '1' })}
                        />
                    </div>

                    {type === 'BORROW' && (
                        <div className="space-y-1.5 w-[140px]">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <Select
                                value={statusParam}
                                onValueChange={(v) => updateParams({ [`${prefix}Status`]: v, [`${prefix}Page`]: '1' })}
                            >
                                <SelectTrigger className="bg-background h-9">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Returned">Returned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(nameParam || fromParam || toParam || (statusParam !== 'All' && type === 'BORROW')) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground mt-auto">
                            <FilterX className="h-4 w-4 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground shrink-0 border-r pr-3 mr-1">
                        {records.length} total
                    </div>
                    <Button variant="outline" size="sm" onClick={exportToCSV} disabled={records.length === 0} className="h-9">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        {type === 'BORROW' ? (
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Borrower</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Borrow Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Distributed By</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {paginatedRecords.map((record) => (
                            <TableRow key={record.id}>
                                {type === 'BORROW' ? (
                                    <>
                                        <TableCell className="font-medium">
                                            {record.itemInstance?.item?.name}
                                            <div className="text-xs text-muted-foreground">
                                                SN: {record.itemInstance?.serialNumber || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{record.borrower?.firstName} {record.borrower?.lastName}</span>
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">ID: {record.borrower?.customId}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.room?.name || '—'}</TableCell>
                                        <TableCell>{new Date(record.borrowDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {record.returnRecord ? (
                                                <Badge variant="secondary" className="bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 border-green-200">
                                                    Returned
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">
                                                    Active
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!record.returnRecord && (
                                                <Sheet open={isReturnDialogOpen && selectedRecord?.id === record.id} onOpenChange={(open) => {
                                                    if (!open) setSelectedRecord(null)
                                                    setIsReturnDialogOpen(open)
                                                }}>
                                                    <SheetTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedRecord(record)}
                                                            className="rounded-lg h-8 px-3 font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all active:scale-95"
                                                        >
                                                            Process Return
                                                        </Button>
                                                    </SheetTrigger>
                                                    <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                                                        <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                                                            {/* Subtle Glow Effect */}
                                                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                                                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                                                            <div className="relative z-10 text-left">
                                                                <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                                                    Process Return
                                                                </SheetTitle>
                                                                <SheetDescription className="text-sm font-medium mt-1">
                                                                    Complete the return process for <span className="text-foreground font-bold">{record.itemInstance?.item?.name}</span>
                                                                </SheetDescription>
                                                            </div>
                                                        </SheetHeader>

                                                        <ScrollArea className="flex-1 px-6 py-8">
                                                            <div className="space-y-6">
                                                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                                                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                                                        <Info className="h-3.5 w-3.5" />
                                                                        Item Details
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">Serial Number</p>
                                                                            <p className="font-mono font-medium">{record.itemInstance?.serialNumber || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">Borrower</p>
                                                                            <p className="font-medium">{record.borrower?.firstName} {record.borrower?.lastName}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4 pt-2">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                                            <ClipboardList className="h-3 w-3 text-primary/70" />
                                                                            Condition on Return
                                                                        </label>
                                                                        <Select
                                                                            value={returnDetails.conditionOnReturn}
                                                                            onValueChange={(v) => setReturnDetails({ ...returnDetails, conditionOnReturn: v })}
                                                                        >
                                                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all">
                                                                                <SelectValue placeholder="Select Condition" />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="rounded-xl border-border/50">
                                                                                <SelectItem value="Good">Good</SelectItem>
                                                                                <SelectItem value="Fair">Fair</SelectItem>
                                                                                <SelectItem value="Damaged">Damaged</SelectItem>
                                                                                <SelectItem value="Lost">Lost</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                                                            Notes & Remarks
                                                                        </label>
                                                                        <Textarea
                                                                            className="min-h-[120px] rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all resize-none p-4"
                                                                            placeholder="Add any specific notes about the item's condition or return details..."
                                                                            value={returnDetails.notes}
                                                                            onChange={(e) => setReturnDetails({ ...returnDetails, notes: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </ScrollArea>

                                                        <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setIsReturnDialogOpen(false)}
                                                                className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                onClick={handleReturn}
                                                                disabled={isPending}
                                                                className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[160px]"
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
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        {/* DISTRIBUTION RECORD VIEW */}
                                        <TableCell className="font-medium">
                                            {record.itemInstance?.item?.name}
                                        </TableCell>
                                        <TableCell>{record.quantity}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{record.recipient?.firstName} {record.recipient?.lastName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.room?.name || '—'}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={record.purpose}>{record.purpose || '—'}</TableCell>
                                        <TableCell>
                                            {record.distributedBy?.firstName} {record.distributedBy?.lastName}
                                        </TableCell>
                                        <TableCell>{new Date(record.distributedAt).toLocaleDateString()}</TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                        {paginatedRecords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={type === 'BORROW' ? 7 : 7} className="text-center py-12 text-muted-foreground">
                                    No records found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-end pt-2">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pageParam <= 1}
                                    onClick={() => updateParams({ [`${prefix}Page`]: (pageParam - 1).toString() })}
                                >
                                    Previous
                                </Button>
                            </PaginationItem>

                            <PaginationItem className="mx-2 text-sm text-muted-foreground flex items-center">
                                Page {pageParam} of {totalPages}
                            </PaginationItem>

                            <PaginationItem>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pageParam >= totalPages}
                                    onClick={() => updateParams({ [`${prefix}Page`]: (pageParam + 1).toString() })}
                                >
                                    Next
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}
