'use client'

import React, { useState } from 'react'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { restoreItem, permanentlyDeleteItem } from '@/actions/secretary'
import { toast } from 'sonner'
import { Input } from "@/components/ui/input"
import { Trash2, RotateCcw, AlertTriangle, Trash, FileText, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface SecretaryBinManagerProps {
    deletedItems: any[]
}

export default function SecretaryBinManager({ deletedItems }: SecretaryBinManagerProps) {
    const [isPending, setIsPending] = useState(false)
    const [binAction, setBinAction] = useState<{ type: 'permanent', item: any } | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredItems = React.useMemo(() => {
        if (!searchTerm) return deletedItems
        const term = searchTerm.toLowerCase()
        return deletedItems.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.category?.name?.toLowerCase().includes(term)
        )
    }, [deletedItems, searchTerm])

    const handleRestore = async (item: any) => {
        setIsPending(true)
        const result = await restoreItem(item.id)
        if (result.success) {
            toast.success(`"${item.name}" restored`)
        } else {
            toast.error(result.error || 'Failed to restore')
        }
        setIsPending(false)
    }

    const handlePermanentDelete = async (item: any) => {
        setIsPending(true)
        const result = await permanentlyDeleteItem(item.id)
        if (result.success) {
            toast.success(`"${item.name}" permanently deleted`)
            setBinAction(null)
        } else {
            toast.error(result.error || 'Failed to permanently delete')
        }
        setIsPending(false)
    }

    if (deletedItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <Trash className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Bin is empty</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                    Any items you delete from the inventory will appear here for recovery or permanent removal.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Toolbar Layer */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search deleted items or categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        asChild
                        className="h-11 px-4 rounded-xl hover:bg-muted/80 transition-all"
                    >
                        <Link href="/secretary/items">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Inventory
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground/80">Item Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80 text-center w-24">Files</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Category</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Type</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Deleted At</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.map((item) => (
                            <TableRow key={item.id} className="group">
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">
                                    {item.instances?.some((inst: any) => inst.barcodeUrl) && (
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 gap-1.5">
                                            <FileText className="h-3 w-3" />
                                            <span className="text-[10px] font-bold">FILE</span>
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>{item.category?.name || 'N/A'}</TableCell>
                                <TableCell><Badge variant="outline">{item.itemType}</Badge></TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRestore(item)}
                                            disabled={isPending}
                                            className="h-8 px-3 rounded-lg text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                            Restore
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBinAction({ type: 'permanent', item })}
                                            disabled={isPending}
                                            className="h-8 px-3 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No items found matching your search.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!binAction} onOpenChange={() => setBinAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Permanently Delete
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{binAction?.item?.name}</strong> and all its instances. This action <strong>cannot be undone</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBinAction(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => binAction && handlePermanentDelete(binAction.item)} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
