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
import { createApparatus, updateApparatus, deleteApparatus, restoreApparatus, permanentlyDeleteApparatus } from './actions'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Tag, Barcode, Layers, Check, X, MoreHorizontal, Beaker, Box, Loader2, Trash, RotateCcw, AlertTriangle, FileText, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from 'next/link'

interface LabApparatusManagerProps {
    apparatus: any[]
    categories: any[]
    deletedApparatus?: any[]
}

const ITEMS_PER_PAGE = 10

export function LabApparatusManager({ apparatus, categories, deletedApparatus = [] }: LabApparatusManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isPending, setIsPending] = useState(false)

    // Create
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newApparatus, setNewApparatus] = useState({
        name: '',
        apparatusType: 'Non-Consumables',
        description: '',
        categoryId: ''
    })

    // Edit
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingApparatus, setEditingApparatus] = useState<any>(null)
    const [editForm, setEditForm] = useState({ name: '', apparatusType: 'Non-Consumables', description: '', categoryId: '' })

    // Delete
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deletingApparatus, setDeletingApparatus] = useState<any>(null)

    // Bin
    // Removed internal bin state

    const filteredApparatus = useMemo(() => {
        if (!searchTerm) return apparatus
        const term = searchTerm.toLowerCase()
        return apparatus.filter(app =>
            app.name.toLowerCase().includes(term) ||
            app.category?.name?.toLowerCase().includes(term)
        )
    }, [apparatus, searchTerm])

    const totalPages = Math.ceil(filteredApparatus.length / ITEMS_PER_PAGE)
    const paginatedApparatus = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredApparatus.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredApparatus, currentPage])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleCreate = async () => {
        if (!newApparatus.name) return
        setIsPending(true)
        const result = await createApparatus({
            name: newApparatus.name,
            apparatusType: newApparatus.apparatusType,
            description: newApparatus.description || undefined,
            categoryId: newApparatus.categoryId ? parseInt(newApparatus.categoryId) : undefined
        })
        if (result.success) {
            toast.success('Apparatus created')
            setNewApparatus({ name: '', apparatusType: 'Non-Consumables', description: '', categoryId: '' })
            setIsCreateOpen(false)
        } else {
            toast.error(result.error || 'Failed to create apparatus')
        }
        setIsPending(false)
    }

    // Edit handlers
    const openEdit = (app: any) => {
        setEditingApparatus(app)
        setEditForm({
            name: app.name,
            apparatusType: app.apparatusType || 'Non-Consumables',
            description: app.description || '',
            categoryId: app.categoryId ? String(app.categoryId) : ''
        })
        setIsEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingApparatus || !editForm.name) return
        setIsPending(true)
        const result = await updateApparatus(editingApparatus.id, {
            name: editForm.name,
            apparatusType: editForm.apparatusType,
            description: editForm.description || undefined,
            categoryId: editForm.categoryId ? parseInt(editForm.categoryId) : undefined
        })
        if (result.success) {
            toast.success('Apparatus updated')
            setIsEditOpen(false)
        } else {
            toast.error(result.error || 'Failed to update')
        }
        setIsPending(false)
    }

    // Delete handlers
    const openDelete = (app: any) => {
        setDeletingApparatus(app)
        setIsDeleteOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingApparatus) return
        setIsPending(true)
        const result = await deleteApparatus(deletingApparatus.id)
        if (result.success) {
            toast.success('Apparatus moved to bin')
            setIsDeleteOpen(false)
        } else {
            toast.error(result.error || 'Failed to delete apparatus')
        }
        setIsPending(false)
    }

    // Removed handleRestore and handlePermanentDelete

    const getAvailableCount = (app: any) => {
        if (app.apparatusType === 'Consumables') {
            return app.batches.reduce((sum: number, batch: any) => sum + batch.remainingQty, 0)
        }
        return app.instances.filter((inst: any) => !inst.labBorrowRecords || inst.labBorrowRecords.length === 0).length
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search apparatus or categories..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10 h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Bin Button */}
                    <Button
                        variant="outline"
                        asChild
                        className="h-11 px-4 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all relative"
                    >
                        <Link href="/labtech/bin">
                            <Trash className="h-4 w-4 mr-2" />
                            Bin
                            {deletedApparatus.length > 0 && (
                                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px]">
                                    {deletedApparatus.length}
                                </Badge>
                            )}
                        </Link>
                    </Button>

                    {/* Create Sheet */}
                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <SheetTrigger asChild>
                            <Button className="h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 border-none hover:shadow-lg transition-all active:scale-95 shadow-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Apparatus
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                            <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
                                <div className="relative z-10 text-left">
                                    <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Add New Apparatus
                                    </SheetTitle>
                                    <SheetDescription className="text-sm font-medium mt-1">
                                        Register new laboratory apparatus for tracking.
                                    </SheetDescription>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 px-6 py-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Tag className="h-3 w-3 text-primary/70" />
                                            Apparatus Name
                                        </label>
                                        <Input
                                            placeholder="e.g. Beaker"
                                            value={newApparatus.name}
                                            onChange={(e) => setNewApparatus({ ...newApparatus, name: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Box className="h-3 w-3 text-primary/70" />
                                            Type
                                        </label>
                                        <Select value={newApparatus.apparatusType} onValueChange={(v) => setNewApparatus({ ...newApparatus, apparatusType: v })}>
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50">
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Non-Consumables">Non-Consumables</SelectItem>
                                                <SelectItem value="Consumables">Consumables</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Layers className="h-3 w-3 text-primary/70" />
                                            Category <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Select value={newApparatus.categoryId} onValueChange={(v) => setNewApparatus({ ...newApparatus, categoryId: v })}>
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
                                            <Beaker className="h-3 w-3 text-primary/70" />
                                            Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Input
                                            placeholder="Brief description"
                                            value={newApparatus.description}
                                            onChange={(e) => setNewApparatus({ ...newApparatus, description: e.target.value })}
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
                                    disabled={isPending || !newApparatus.name}
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
                                            Register Apparatus
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
                            <TableHead className="font-semibold text-foreground/80">Apparatus Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80 text-center w-24">Files</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Category</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Type</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Instances/Batches</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Available</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedApparatus.map((app) => (
                            <TableRow key={app.id} className="group">
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/labtech/apparatus/${app.id}`}
                                        className="hover:underline text-foreground hover:text-primary transition-colors"
                                    >
                                        {app.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                    {app.instances?.some((inst: any) => inst.barcodeUrl) && (
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 gap-1.5 animate-in fade-in zoom-in duration-300">
                                            <FileText className="h-3 w-3" />
                                            <span className="text-[10px] font-bold">FILE</span>
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {app.category ? (
                                        <Badge variant="outline" className="font-normal">
                                            {app.category.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs italic">Uncategorized</span>
                                    )}
                                </TableCell>
                                <TableCell><Badge variant="outline">{app.apparatusType}</Badge></TableCell>
                                <TableCell>
                                    {app.apparatusType === 'Consumables' ? app.batches.length : app.instances.length}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getAvailableCount(app) > 0 ? "default" : "secondary"}>
                                        {getAvailableCount(app)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-muted/20">
                                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Options</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-primary/10 group/item">
                                                <Link href={`/labtech/apparatus/${app.id}`} className="flex items-center justify-between w-full">
                                                    View Details
                                                    <ArrowRight className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEdit(app)} className="cursor-pointer rounded-lg px-3 py-2 focus:bg-primary/10">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openDelete(app)} className="cursor-pointer rounded-lg px-3 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Apparatus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedApparatus.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No apparatus found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing {Math.min(filteredApparatus.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredApparatus.length, currentPage * ITEMS_PER_PAGE)} of {filteredApparatus.length}
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
                                Edit Apparatus
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium mt-1">
                                Update the details for <strong>{editingApparatus?.name}</strong>.
                            </SheetDescription>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6 py-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-primary/70" />
                                    Apparatus Name
                                </label>
                                <Input
                                    placeholder="e.g. Beaker"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Box className="h-3 w-3 text-primary/70" />
                                    Type
                                </label>
                                <Select value={editForm.apparatusType} onValueChange={(v) => setEditForm({ ...editForm, apparatusType: v })}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Non-Consumables">Non-Consumables</SelectItem>
                                        <SelectItem value="Consumables">Consumables</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                    <Beaker className="h-3 w-3 text-primary/70" />
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
                        <DialogTitle>Delete Apparatus</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingApparatus?.name}</strong>? This will move it to the bin. You can restore it later or permanently delete it from the bin.
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

        </div>
    )
}
