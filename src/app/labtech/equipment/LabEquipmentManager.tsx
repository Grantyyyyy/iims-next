'use client'

import React, { useState, useMemo } from 'react'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter, SheetTrigger
} from "@/components/ui/sheet"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Pagination, PaginationContent, PaginationEllipsis,
    PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createEquipment, updateEquipment, deleteEquipment, restoreEquipment, permanentlyDeleteEquipment } from './actions'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Tag, Barcode, Layers, Check, X, MoreHorizontal, Microscope, Loader2, Trash, RotateCcw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from 'next/link'

interface LabEquipmentManagerProps {
    equipment: any[]
    categories: any[]
    deletedEquipment?: any[]
}

const ITEMS_PER_PAGE = 10

export function LabEquipmentManager({ equipment, categories, deletedEquipment = [] }: LabEquipmentManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isPending, setIsPending] = useState(false)

    // Create
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newEquipment, setNewEquipment] = useState({ name: '', model: '', description: '', categoryId: '' })

    // Edit
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingEquipment, setEditingEquipment] = useState<any>(null)
    const [editForm, setEditForm] = useState({ name: '', model: '', description: '', categoryId: '' })

    // Delete
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deletingEquipment, setDeletingEquipment] = useState<any>(null)

    // Bin
    const [isBinOpen, setIsBinOpen] = useState(false)
    const [binAction, setBinAction] = useState<{ type: 'restore' | 'permanent', item: any } | null>(null)

    const filteredEquipment = useMemo(() => {
        if (!searchTerm) return equipment
        const term = searchTerm.toLowerCase()
        return equipment.filter(eq =>
            eq.name.toLowerCase().includes(term) ||
            eq.model?.toLowerCase().includes(term) ||
            eq.category?.name?.toLowerCase().includes(term)
        )
    }, [equipment, searchTerm])

    const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE)
    const paginatedEquipment = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredEquipment.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredEquipment, currentPage])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleCreate = async () => {
        if (!newEquipment.name) return
        setIsPending(true)
        const result = await createEquipment({
            name: newEquipment.name,
            model: newEquipment.model || undefined,
            description: newEquipment.description || undefined,
            categoryId: newEquipment.categoryId ? parseInt(newEquipment.categoryId) : undefined
        })
        if (result.success) {
            toast.success('Equipment created')
            setNewEquipment({ name: '', model: '', description: '', categoryId: '' })
            setIsCreateOpen(false)
        } else {
            toast.error(result.error || 'Failed to create equipment')
        }
        setIsPending(false)
    }

    // Edit handlers
    const openEdit = (eq: any) => {
        setEditingEquipment(eq)
        setEditForm({
            name: eq.name,
            model: eq.model || '',
            description: eq.description || '',
            categoryId: eq.categoryId ? String(eq.categoryId) : ''
        })
        setIsEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingEquipment || !editForm.name) return
        setIsPending(true)
        const result = await updateEquipment(editingEquipment.id, {
            name: editForm.name,
            model: editForm.model || undefined,
            description: editForm.description || undefined,
            categoryId: editForm.categoryId ? parseInt(editForm.categoryId) : undefined
        })
        if (result.success) {
            toast.success('Equipment updated')
            setIsEditOpen(false)
        } else {
            toast.error(result.error || 'Failed to update')
        }
        setIsPending(false)
    }

    // Delete handlers
    const openDelete = (eq: any) => {
        setDeletingEquipment(eq)
        setIsDeleteOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingEquipment) return
        setIsPending(true)
        const result = await deleteEquipment(deletingEquipment.id)
        if (result.success) {
            toast.success('Equipment moved to bin')
            setIsDeleteOpen(false)
        } else {
            toast.error(result.error || 'Failed to delete equipment')
        }
        setIsPending(false)
    }

    // Bin handlers
    const handleRestore = async (eq: any) => {
        setIsPending(true)
        const result = await restoreEquipment(eq.id)
        if (result.success) {
            toast.success(`"${eq.name}" restored`)
        } else {
            toast.error(result.error || 'Failed to restore')
        }
        setIsPending(false)
        setBinAction(null)
    }

    const handlePermanentDelete = async (eq: any) => {
        setIsPending(true)
        const result = await permanentlyDeleteEquipment(eq.id)
        if (result.success) {
            toast.success(`"${eq.name}" permanently deleted`)
        } else {
            toast.error(result.error || 'Failed to permanently delete')
        }
        setIsPending(false)
        setBinAction(null)
    }

    const getAvailableCount = (eq: any) => {
        return eq.instances.filter((inst: any) => !inst.labBorrowRecords || inst.labBorrowRecords.length === 0).length
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search equipment, models, or categories..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Bin Button */}
                    <Button
                        variant="outline"
                        onClick={() => setIsBinOpen(true)}
                        className="h-11 px-4 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all relative"
                    >
                        <Trash className="h-4 w-4 mr-2" />
                        Bin
                        {deletedEquipment.length > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px]">
                                {deletedEquipment.length}
                            </Badge>
                        )}
                    </Button>

                    {/* Create Sheet */}
                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <SheetTrigger asChild>
                            <Button className="h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 border-none hover:shadow-lg transition-all active:scale-95 shadow-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Equipment
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                            <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
                                <div className="relative z-10 text-left">
                                    <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Add New Equipment
                                    </SheetTitle>
                                    <SheetDescription className="text-sm font-medium mt-1">
                                        Register high-value laboratory equipment for tracking.
                                    </SheetDescription>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 px-6 py-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Tag className="h-3 w-3 text-primary/70" />
                                            Equipment Name
                                        </label>
                                        <Input
                                            placeholder="e.g. Compound Microscope"
                                            value={newEquipment.name}
                                            onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Barcode className="h-3 w-3 text-primary/70" />
                                            Model <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Input
                                            placeholder="e.g. CM-400"
                                            value={newEquipment.model}
                                            onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Layers className="h-3 w-3 text-primary/70" />
                                            Category <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Select value={newEquipment.categoryId} onValueChange={(v) => setNewEquipment({ ...newEquipment, categoryId: v })}>
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Microscope className="h-3 w-3 text-primary/70" />
                                            Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Input
                                            placeholder="Brief description"
                                            value={newEquipment.description}
                                            onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                </div>
                            </ScrollArea>

                            <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !newEquipment.name}
                                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Registering...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Register Equipment
                                        </>
                                    )}
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground/80">Equipment Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Category</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Model</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Instances</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Available</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedEquipment.map((eq) => (
                            <TableRow key={eq.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/labtech/equipment/${eq.id}`}
                                        className="hover:underline text-foreground hover:text-primary transition-colors"
                                    >
                                        {eq.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {eq.category ? (
                                        <Badge variant="outline" className="font-normal">
                                            {eq.category.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs italic">Uncategorized</span>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-sm">{eq.model || 'N/A'}</TableCell>
                                <TableCell>{eq.instances.length}</TableCell>
                                <TableCell>
                                    <Badge variant={getAvailableCount(eq) > 0 ? "default" : "secondary"}>
                                        {getAvailableCount(eq)}
                                    </Badge>
                                </TableCell>
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
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href={`/labtech/equipment/${eq.id}`}>
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEdit(eq)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openDelete(eq)} className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Equipment
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedEquipment.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No equipment found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing {Math.min(filteredEquipment.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredEquipment.length, currentPage * ITEMS_PER_PAGE)} of {filteredEquipment.length}
                    </div>
                    <Pagination className="w-auto flex-1 flex justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>
                                }
                                return null
                            })}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Edit Sheet */}
            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                    <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
                        <div className="relative z-10 text-left">
                            <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Edit Equipment
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium mt-1">
                                Update the details for <strong>{editingEquipment?.name}</strong>.
                            </SheetDescription>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6 py-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-primary/70" />
                                    Equipment Name
                                </label>
                                <Input
                                    placeholder="e.g. Compound Microscope"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Barcode className="h-3 w-3 text-primary/70" />
                                    Model <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="e.g. CM-400"
                                    value={editForm.model}
                                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Layers className="h-3 w-3 text-primary/70" />
                                    Category <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Microscope className="h-3 w-3 text-primary/70" />
                                    Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="Brief description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isPending || !editForm.name}
                            className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Equipment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingEquipment?.name}</strong>? This will move it to the bin. You can restore it later or permanently delete it from the bin.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Move to Bin'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bin Sheet */}
            <Sheet open={isBinOpen} onOpenChange={setIsBinOpen}>
                <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                    <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-destructive/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-destructive/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-destructive/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
                        <div className="relative z-10 text-left">
                            <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                <Trash className="h-5 w-5 text-destructive" />
                                Equipment Bin
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium mt-1">
                                {deletedEquipment.length} deleted item{deletedEquipment.length !== 1 ? 's' : ''}. Restore or permanently remove.
                            </SheetDescription>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6 py-6">
                        {deletedEquipment.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Trash className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground font-medium">Bin is empty</p>
                                <p className="text-muted-foreground text-sm mt-1">Deleted equipment will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {deletedEquipment.map((eq) => (
                                    <div key={eq.id} className="p-4 rounded-xl border bg-card hover:bg-muted/20 transition-all group">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground truncate">{eq.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {eq.category && (
                                                        <Badge variant="outline" className="text-xs font-normal">{eq.category.name}</Badge>
                                                    )}
                                                    {eq.model && (
                                                        <span className="text-xs text-muted-foreground font-mono">{eq.model}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                    Deleted {eq.deletedAt ? new Date(eq.deletedAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRestore(eq)}
                                                    disabled={isPending}
                                                    className="h-8 px-3 rounded-lg text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setBinAction({ type: 'permanent', item: eq })}
                                                    disabled={isPending}
                                                    className="h-8 px-3 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Permanent Delete Confirmation */}
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
