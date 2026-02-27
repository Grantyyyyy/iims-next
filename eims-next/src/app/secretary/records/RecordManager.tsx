'use client'

import React, { useState } from 'react'
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
import { returnItem } from '@/actions/secretary'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface RecordManagerProps {
    records: any[]
}

export function RecordManager({ records }: RecordManagerProps) {
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [returnDetails, setReturnDetails] = useState({
        conditionOnReturn: 'Good',
        notes: ''
    })
    const [isPending, setIsPending] = useState(false)

    const handleReturn = async () => {
        if (!selectedRecord) return

        setIsPending(true)
        const result = await returnItem(selectedRecord.id, returnDetails.conditionOnReturn, returnDetails.notes)
        setIsPending(false)

        if (result.success) {
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Borrower</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Borrow Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                    {record.itemInstance.item.name}
                                    <div className="text-xs text-muted-foreground">
                                        SN: {record.itemInstance.serialNumber || 'N/A'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {record.borrower?.username || record.customBorrower || 'Unknown'}
                                </TableCell>
                                <TableCell>{record.quantity}</TableCell>
                                <TableCell>{new Date(record.borrowDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {record.returnRecord ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            Returned
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">Borrowed</Badge>
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
                                                    <DialogTitle>Process Return for {record.itemInstance.item.name}</DialogTitle>
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
                            </TableRow>
                        ))}
                        {records.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    No borrow records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
