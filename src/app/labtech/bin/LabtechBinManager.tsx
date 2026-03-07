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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { restoreEquipment, permanentlyDeleteEquipment } from '../equipment/actions'
import { restoreApparatus, permanentlyDeleteApparatus } from '../apparatus/actions'
import { restoreChemical, permanentlyDeleteChemical } from '../chemicals/actions'
import { toast } from 'sonner'
import { Input } from "@/components/ui/input"
import { Trash2, RotateCcw, AlertTriangle, Trash, FileText, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LabtechBinManagerProps {
    deletedEquipment: any[]
    deletedApparatus: any[]
    deletedChemicals: any[]
}

export default function LabtechBinManager({
    deletedEquipment,
    deletedApparatus,
    deletedChemicals
}: LabtechBinManagerProps) {
    const [isPending, setIsPending] = useState(false)
    const [binAction, setBinAction] = useState<{ type: 'equipment' | 'apparatus' | 'chemical', item: any } | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const filterItems = (items: any[]) => {
        if (!searchTerm) return items
        const term = searchTerm.toLowerCase()
        return items.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.category?.name?.toLowerCase().includes(term) ||
            item.apparatusType?.toLowerCase().includes(term)
        )
    }

    const filteredEquipment = React.useMemo(() => filterItems(deletedEquipment), [deletedEquipment, searchTerm])
    const filteredApparatus = React.useMemo(() => filterItems(deletedApparatus), [deletedApparatus, searchTerm])
    const filteredChemicals = React.useMemo(() => filterItems(deletedChemicals), [deletedChemicals, searchTerm])

    const handleRestore = async (type: 'equipment' | 'apparatus' | 'chemical', item: any) => {
        setIsPending(true)
        let result
        if (type === 'equipment') result = await restoreEquipment(item.id)
        else if (type === 'apparatus') result = await restoreApparatus(item.id)
        else result = await restoreChemical(item.id)

        if (result.success) {
            toast.success(`"${item.name}" restored`)
        } else {
            toast.error(result.error || 'Failed to restore')
        }
        setIsPending(false)
    }

    const handlePermanentDelete = async () => {
        if (!binAction) return
        setIsPending(true)
        const { type, item } = binAction
        let result
        if (type === 'equipment') result = await permanentlyDeleteEquipment(item.id)
        else if (type === 'apparatus') result = await permanentlyDeleteApparatus(item.id)
        else result = await permanentlyDeleteChemical(item.id)

        if (result.success) {
            toast.success(`"${item.name}" permanently deleted`)
            setBinAction(null)
        } else {
            toast.error(result.error || 'Failed to permanently delete')
        }
        setIsPending(false)
    }

    const EmptyState = ({ title }: { title: string }) => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Trash className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h4 className="font-medium text-foreground">{title} is empty</h4>
            <p className="text-muted-foreground text-sm mt-1">Deleted items will appear here.</p>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Toolbar Layer */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search deleted items, categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                    />
                </div>
            </div>

            <Tabs defaultValue="equipment" className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="equipment">Equipment ({filteredEquipment.length})</TabsTrigger>
                    <TabsTrigger value="apparatus">Apparatus ({filteredApparatus.length})</TabsTrigger>
                    <TabsTrigger value="chemicals">Chemicals ({filteredChemicals.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="equipment" className="mt-4">
                    {filteredEquipment.length === 0 ? <EmptyState title="Equipment Bin" /> : (
                        <BinTable
                            items={filteredEquipment}
                            type="equipment"
                            onRestore={(item: any) => handleRestore('equipment', item)}
                            onDelete={(item: any) => setBinAction({ type: 'equipment', item })}
                            isPending={isPending}
                        />
                    )}
                </TabsContent>

                <TabsContent value="apparatus" className="mt-4">
                    {filteredApparatus.length === 0 ? <EmptyState title="Apparatus Bin" /> : (
                        <BinTable
                            items={filteredApparatus}
                            type="apparatus"
                            onRestore={(item: any) => handleRestore('apparatus', item)}
                            onDelete={(item: any) => setBinAction({ type: 'apparatus', item })}
                            isPending={isPending}
                        />
                    )}
                </TabsContent>

                <TabsContent value="chemicals" className="mt-4">
                    {filteredChemicals.length === 0 ? <EmptyState title="Chemicals Bin" /> : (
                        <BinTable
                            items={filteredChemicals}
                            type="chemical"
                            onRestore={(item: any) => handleRestore('chemical', item)}
                            onDelete={(item: any) => setBinAction({ type: 'chemical', item })}
                            isPending={isPending}
                        />
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={!!binAction} onOpenChange={() => setBinAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Permanently Delete
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{binAction?.item?.name}</strong> and all its related records. This action <strong>cannot be undone</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBinAction(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handlePermanentDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function BinTable({ items, type, onRestore, onDelete, isPending }: any) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground/80">Name</TableHead>
                        <TableHead className="font-semibold text-foreground/80">Files</TableHead>
                        <TableHead className="font-semibold text-foreground/80">Category/Type</TableHead>
                        <TableHead className="font-semibold text-foreground/80">Deleted At</TableHead>
                        <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item: any) => (
                        <TableRow key={item.id} className="group">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                                {(item.instances?.some((inst: any) => inst.barcodeUrl) ||
                                    item.batches?.some((batch: any) => batch.inventoryNumber)) && (
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 gap-1.5">
                                            <FileText className="h-3 w-3" />
                                            <span className="text-[10px] font-bold">FILE</span>
                                        </Badge>
                                    )}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {item.category && <Badge variant="outline">{item.category.name}</Badge>}
                                    {item.apparatusType && <Badge variant="secondary">{item.apparatusType}</Badge>}
                                    {type === 'chemical' && <Badge variant="secondary">Chemical</Badge>}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRestore(item)}
                                        disabled={isPending}
                                        className="h-8 px-3 rounded-lg text-xs hover:bg-primary/10 hover:text-primary"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                        Restore
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDelete(item)}
                                        disabled={isPending}
                                        className="h-8 px-3 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
