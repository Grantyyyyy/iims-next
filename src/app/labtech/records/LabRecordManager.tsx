'use client'

import React, { useState } from 'react'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Download, MoreHorizontal, RotateCcw, FileText, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { processLabReturn } from './actions'
import { toast } from 'sonner'

interface LabRecordManagerProps {
    type: 'BORROW' | 'CHEMICAL'
    records: any[]
}

export function LabRecordManager({ type, records }: LabRecordManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isReturnOpen, setIsReturnOpen] = useState(false)
    const [returningRecord, setReturningRecord] = useState<any>(null)
    const [returnCondition, setReturnCondition] = useState('Good')
    const [returnNotes, setReturnNotes] = useState('')
    const [isPending, setIsPending] = useState(false)

    const openReturn = (record: any) => {
        setReturningRecord(record)
        setReturnCondition('Good')
        setReturnNotes('')
        setIsReturnOpen(true)
    }

    const handleReturn = async () => {
        if (!returningRecord) return
        setIsPending(true)
        const result = await processLabReturn(returningRecord.id, {
            conditionOnReturn: returnCondition,
            notes: returnNotes || undefined
        })
        if (result.success) {
            toast.success('Item returned successfully')
            setIsReturnOpen(false)
        } else {
            toast.error(result.error || 'Failed to process return')
        }
        setIsPending(false)
    }

    const getStatus = (record: any) => {
        if (record.returnDate) return 'RETURNED'
        if (record.dueDate && new Date(record.dueDate) < new Date()) return 'OVERDUE'
        return 'BORROWED'
    }

    const filteredRecords = React.useMemo(() => {
        if (type !== 'BORROW') return []
        if (!searchTerm) return records
        const term = searchTerm.toLowerCase()
        return records.filter(r => {
            const item = r.equipmentInstance?.equipment?.name || r.apparatusInstance?.apparatus?.name || ''
            const inv = r.equipmentInstance?.inventoryNumber || r.apparatusInstance?.inventoryNumber || ''
            const borrower = r.borrower?.username || r.studentName || ''
            return item.toLowerCase().includes(term) || inv.toLowerCase().includes(term) || borrower.toLowerCase().includes(term)
        })
    }, [records, searchTerm, type])

    const filteredChemicalRecords = React.useMemo(() => {
        if (type !== 'CHEMICAL') return []
        if (!searchTerm) return records
        const term = searchTerm.toLowerCase()
        return records.filter(r => {
            const chem = r.chemicalBatch?.chemical?.name || ''
            const user = r.usedBy?.username || r.recordedBy?.username || ''
            return chem.toLowerCase().includes(term) || user.toLowerCase().includes(term)
        })
    }, [records, searchTerm, type])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'BORROWED':
                return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">Borrowed</Badge>
            case 'RETURNED':
                return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Returned</Badge>
            case 'OVERDUE':
                return <Badge variant="destructive" className="animate-pulse">Overdue</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (type === 'BORROW') {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search borrower or inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-foreground/80">Item</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Inventory No.</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Borrower</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Type</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Borrow Date</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Due Date</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                                <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.map((record) => {
                                const status = getStatus(record)
                                const item = record.equipmentInstance?.equipment || record.apparatusInstance?.apparatus
                                const inventoryNo = record.equipmentInstance?.inventoryNumber || record.apparatusInstance?.inventoryNumber
                                const borrowerName = record.borrower?.username || record.studentName
                                const borrowerType = record.borrower ? 'Staff' : 'Student'

                                return (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium text-foreground">{item?.name || 'N/A'}</TableCell>
                                        <TableCell className="font-mono text-xs">{inventoryNo}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{borrowerName}</span>
                                                {record.studentCourse && (
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                        {record.studentCourse} • {record.studentYearLevel}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={borrowerType === 'Staff' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 'border-zinc-200 text-zinc-700 bg-zinc-50'}>
                                                {borrowerType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(record.borrowDate), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-muted-foreground">{record.dueDate ? format(new Date(record.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                        <TableCell>{getStatusBadge(status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {status !== 'RETURNED' && (
                                                        <DropdownMenuItem onClick={() => openReturn(record)} className="cursor-pointer">
                                                            <RotateCcw className="mr-2 h-4 w-4" /> Process Return
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <FileText className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {records.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                        No borrow records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Return Sheet */}
                <Sheet open={isReturnOpen} onOpenChange={setIsReturnOpen}>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Process Return</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Record the return of this item and update its condition.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/90">Condition on Return</label>
                                    <Select value={returnCondition} onValueChange={setReturnCondition}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Good">Good</SelectItem>
                                            <SelectItem value="Fair">Fair</SelectItem>
                                            <SelectItem value="Poor">Poor</SelectItem>
                                            <SelectItem value="Damaged">Damaged</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/90">Notes (Optional)</label>
                                    <Input
                                        placeholder="Any additional notes..."
                                        value={returnNotes}
                                        onChange={(e) => setReturnNotes(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsReturnOpen(false)} className="px-6 h-11">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleReturn}
                                    disabled={isPending}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Confirm Return</>
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        )
    }

    // Chemical Usage Records

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chemical or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground/80">Chemical</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Qty Used</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Subject</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Room</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Used By</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Recorded By</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredChemicalRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-bold text-foreground">{record.chemicalBatch?.chemical?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                                        {record.quantityUsed} {record.unit || ''}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{record.subject?.name || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground font-medium">{record.room?.name || 'N/A'}</TableCell>
                                <TableCell className="font-medium">{record.usedBy?.username || 'Internal'}</TableCell>
                                <TableCell>{record.recordedBy?.username || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{format(new Date(record.dateUsed), 'MMM dd, yyyy')}</TableCell>
                            </TableRow>
                        ))}
                        {filteredChemicalRecords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                    No chemical usage records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
