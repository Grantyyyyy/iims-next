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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ClipboardList, Info } from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Download, MoreHorizontal, RotateCcw, FileText, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { processLabReturn } from './actions'
import { toast } from 'sonner'
import { User, BookOpen, MapPin } from 'lucide-react'

interface LabRecordManagerProps {
    type: 'BORROW' | 'CHEMICAL' | 'DISTRIBUTION'
    records: any[]
    isReadOnly?: boolean
}

export function LabRecordManager({ type, records, isReadOnly = false }: LabRecordManagerProps) {
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

    const itemLabel = returningRecord?.equipmentInstance ? 'Equipment' : 'Apparatus'
    const itemName = returningRecord?.equipmentInstance?.equipment?.name || returningRecord?.apparatusInstance?.apparatus?.name || 'N/A'
    const inventoryNo = returningRecord?.equipmentInstance?.inventoryNumber || returningRecord?.apparatusInstance?.inventoryNumber || 'N/A'
    const borrowerName = returningRecord?.borrower?.username || returningRecord?.studentName || 'N/A'

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

    const handleExport = () => {
        if (!records || records.length === 0) return

        let csvContent = "data:text/csv;charset=utf-8,"
        const filename = `lab_${type.toLowerCase()}_records_${format(new Date(), 'yyyy-MM-dd')}.csv`

        if (type === 'BORROW') {
            csvContent += "Item,Inventory No,Borrower,Type,Borrow Date,Due Date,Status\n"
            records.forEach(r => {
                const item = r.equipmentInstance?.equipment?.name || r.apparatusInstance?.apparatus?.name || 'N/A'
                const inv = r.equipmentInstance?.inventoryNumber || r.apparatusInstance?.inventoryNumber || 'N/A'
                const borrower = r.borrower?.username || r.studentName || 'N/A'
                const bType = r.borrower ? 'Staff' : 'Student'
                const status = getStatus(r)
                const row = [
                    `"${item}"`,
                    `"${inv}"`,
                    `"${borrower}"`,
                    bType,
                    format(new Date(r.borrowDate), 'yyyy-MM-dd'),
                    r.dueDate ? format(new Date(r.dueDate), 'yyyy-MM-dd') : 'N/A',
                    status
                ].join(",")
                csvContent += row + "\n"
            })
        } else if (type === 'CHEMICAL') {
            csvContent += "Chemical,Batch,Amount,Room,Used By,Recorded By,Date\n"
            records.forEach(r => {
                const chem = r.chemicalBatch?.chemical?.name || 'N/A'
                const batch = r.chemicalBatch?.batchNumber || 'N/A'
                const amount = `${r.quantityUsed} ${r.unit}`
                const room = r.room?.name || 'N/A'
                const usedBy = r.usedBy?.username || 'Internal'
                const recordedBy = r.recordedBy?.username || 'N/A'
                const row = [
                    `"${chem}"`,
                    `"${batch}"`,
                    `"${amount}"`,
                    `"${room}"`,
                    `"${usedBy}"`,
                    `"${recordedBy}"`,
                    format(new Date(r.dateUsed), 'yyyy-MM-dd')
                ].join(",")
                csvContent += row + "\n"
            })
        } else if (type === 'DISTRIBUTION') {
            csvContent += "Chemical,Recipient,Amount,Subject,Room,Purpose,Date\n"
            records.forEach(r => {
                const chem = r.chemicalBatch?.chemical?.name || 'N/A'
                const recipient = r.recipient ? `${r.recipient.firstName || ''} ${r.recipient.lastName || ''}`.trim() || r.recipient.username : 'N/A'
                const amount = `${(r.distributedAmount || r.quantityUsed).toFixed(2)} ${r.distributedUnit || r.unit || 'ML'}`
                const subject = r.subject?.code || 'N/A'
                const room = r.room?.name || 'N/A'
                const purpose = r.purpose || 'N/A'
                const row = [
                    `"${chem}"`,
                    `"${recipient}"`,
                    `"${amount}"`,
                    `"${subject}"`,
                    `"${room}"`,
                    `"${purpose}"`,
                    format(new Date(r.dateUsed), 'yyyy-MM-dd HH:mm')
                ].join(",")
                csvContent += row + "\n"
            })
        }

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const groupedDistributions = React.useMemo(() => {
        if (type !== 'DISTRIBUTION') return { groups: [], ungrouped: [] }

        const filtered = !searchTerm ? records : records.filter(r => {
            const chem = r.chemicalBatch?.chemical?.name || ''
            const recipient = `${r.recipient?.firstName || ''} ${r.recipient?.lastName || ''}`.trim() || r.recipient?.username || ''
            const purpose = r.purpose || ''
            return chem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                purpose.toLowerCase().includes(searchTerm.toLowerCase())
        })

        const groups: { [key: string]: any[] } = {}
        const ungrouped: any[] = []

        filtered.forEach(r => {
            if (r.sessionId) {
                if (!groups[r.sessionId]) groups[r.sessionId] = []
                groups[r.sessionId].push(r)
            } else {
                ungrouped.push(r)
            }
        })

        const groupList = Object.entries(groups).map(([id, items]) => ({
            id,
            items,
            date: items[0].dateUsed,
            recipient: items[0].recipient,
            room: items[0].room,
            subject: items[0].subject,
            purpose: items[0].purpose
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return { groups: groupList, ungrouped }
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search borrower or inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
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
                                                    {!isReadOnly && status !== 'RETURNED' && (
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
                                    Record the return of this item and update its condition.
                                </SheetDescription>
                            </div>
                        </SheetHeader>

                        <ScrollArea className="flex-1 px-6 py-8">
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                        <Info className="h-3.5 w-3.5" />
                                        Return Summary
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">{itemLabel}</p>
                                            <p className="font-bold text-foreground">{itemName}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">Inventory No.</p>
                                            <p className="font-mono font-medium">{inventoryNo}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">Borrower</p>
                                            <p className="font-medium">{borrowerName}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <ClipboardList className="h-3 w-3 text-primary/70" />
                                            Condition on Return
                                        </label>
                                        <Select value={returnCondition} onValueChange={setReturnCondition}>
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Good">Good</SelectItem>
                                                <SelectItem value="Fair">Fair</SelectItem>
                                                <SelectItem value="Poor">Poor</SelectItem>
                                                <SelectItem value="Damaged">Damaged</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-primary/70" />
                                            Notes (Optional)
                                        </label>
                                        <Input
                                            placeholder="Any additional notes..."
                                            value={returnNotes}
                                            onChange={(e) => setReturnNotes(e.target.value)}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                            <Button
                                variant="outline"
                                onClick={() => setIsReturnOpen(false)}
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
                                        Confirm Return
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        )
    }

    // Chemical Usage Records

    if (type === 'CHEMICAL') {
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
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
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

    // Distribution Records

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chemical or recipient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden text-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground/80">Chemical</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Recipient</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Amount</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Subject</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Room</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Purpose</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Render Grouped Sessions */}
                        {groupedDistributions.groups.map((group) => (
                            <React.Fragment key={group.id}>
                                <TableRow className="bg-muted/30 border-y-2 border-primary/10">
                                    <TableCell colSpan={7} className="py-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3">
                                                    SESSION: {group.items.length} ITEM{group.items.length !== 1 ? 'S' : ''}
                                                </Badge>
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                                                    <User className="h-3 w-3" />
                                                    {group.recipient ? `${group.recipient.firstName || ''} ${group.recipient.lastName || ''}`.trim() || group.recipient.username : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                                                    <BookOpen className="h-3 w-3" />
                                                    {group.subject?.code || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                                                    <MapPin className="h-3 w-3" />
                                                    {group.room?.name || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-medium text-muted-foreground">
                                                {format(new Date(group.date), 'MMM dd, yyyy HH:mm')}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {group.items.map((record) => (
                                    <TableRow key={record.id} className="border-l-4 border-l-primary/30">
                                        <TableCell className="font-bold text-foreground pl-6">
                                            {record.chemicalBatch?.chemical?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs italic">
                                            - (Session) -
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {(record.distributedAmount || record.quantityUsed).toFixed(2)} {record.distributedUnit || record.unit || 'ML'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-[10px]">
                                            {record.subject?.code || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-medium text-xs">
                                            {record.room?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-xs italic text-muted-foreground">
                                            {record.purpose || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {format(new Date(record.dateUsed), 'HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}

                        {/* Render Ungrouped Records */}
                        {groupedDistributions.ungrouped.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-bold text-foreground">{record.chemicalBatch?.chemical?.name || 'N/A'}</TableCell>
                                <TableCell className="font-medium">
                                    {record.recipient
                                        ? `${record.recipient.firstName || ''} ${record.recipient.lastName || ''}`.trim() || record.recipient.username
                                        : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {(record.distributedAmount || record.quantityUsed).toFixed(2)} {record.distributedUnit || record.unit || 'ML'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{record.subject?.code || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground font-medium">{record.room?.name || 'N/A'}</TableCell>
                                <TableCell className="max-w-xs truncate">{record.purpose || 'N/A'}</TableCell>
                                <TableCell className="text-muted-foreground">{format(new Date(record.dateUsed), 'MMM dd, yyyy HH:mm')}</TableCell>
                            </TableRow>
                        ))}

                        {groupedDistributions.groups.length === 0 && groupedDistributions.ungrouped.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Info className="h-8 w-8 text-muted-foreground/30" />
                                        <p>No distribution records found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
