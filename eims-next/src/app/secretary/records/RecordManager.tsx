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
import { Download, Search, FilterX } from 'lucide-react'

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
                                className="pl-9 bg-background h-9"
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
                                                <Dialog open={isReturnDialogOpen && selectedRecord?.id === record.id} onOpenChange={(open) => {
                                                    if (!open) setSelectedRecord(null)
                                                    setIsReturnDialogOpen(open)
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedRecord(record)}
                                                        >
                                                            Process Return
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Process Return for {record.itemInstance?.item?.name}</DialogTitle>
                                                            <DialogDescription>
                                                                Confirm the item condition and add optional notes.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
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
                                                            <textarea
                                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                placeholder="Notes/Remarks"
                                                                rows={3}
                                                                value={returnDetails.notes}
                                                                onChange={(e) => setReturnDetails({ ...returnDetails, notes: e.target.value })}
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={handleReturn} disabled={isPending}>
                                                                {isPending ? 'Processing...' : 'Mark as Returned'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
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
