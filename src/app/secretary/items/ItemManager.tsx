'use client'

import React, { useState, useMemo } from 'react'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
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
import { createItem, updateItem, deleteItem } from '@/actions/secretary'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Tag, Barcode, Layers, Box, Check, X, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ItemManagerProps {
    items: any[]
    categories: any[]
}

const ITEMS_PER_PAGE = 10

export function ItemManager({ items, categories }: ItemManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isPending, setIsPending] = useState(false)

    // Create
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newItem, setNewItem] = useState({ name: '', model: '', itemType: 'Non-Consumables', categoryId: '' })

    // Edit
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [editForm, setEditForm] = useState({ name: '', model: '', itemType: 'Non-Consumables', categoryId: '' })

    // Delete
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deletingItem, setDeletingItem] = useState<any>(null)

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items
        const term = searchTerm.toLowerCase()
        return items.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.model?.toLowerCase().includes(term) ||
            item.category?.name?.toLowerCase().includes(term)
        )
    }, [items, searchTerm])

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredItems.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredItems, currentPage])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleCreate = async () => {
        if (!newItem.name || !newItem.categoryId) return
        setIsPending(true)
        const result = await createItem({ ...newItem, categoryId: parseInt(newItem.categoryId) })
        if (result.success) {
            toast.success('Item created')
            setNewItem({ name: '', model: '', itemType: 'Non-Consumables', categoryId: '' })
            setIsCreateOpen(false)
        } else {
            toast.error(result.error || 'Failed to create item')
        }
        setIsPending(false)
    }

    const openEdit = (item: any) => {
        setEditingItem(item)
        setEditForm({ name: item.name, model: item.model || '', itemType: item.itemType, categoryId: String(item.categoryId) })
        setIsEditOpen(true)
    }

    const handleUpdate = async () => {
        if (!editingItem || !editForm.name || !editForm.categoryId) return
        setIsPending(true)
        const result = await updateItem(editingItem.id, { ...editForm, categoryId: parseInt(editForm.categoryId) })
        if (result.success) {
            toast.success('Item updated')
            setIsEditOpen(false)
        } else {
            toast.error(result.error || 'Failed to update')
        }
        setIsPending(false)
    }

    const openDelete = (item: any) => {
        setDeletingItem(item)
        setIsDeleteOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        setIsPending(true)
        const result = await deleteItem(deletingItem.id)
        if (result.success) {
            toast.success('Item deleted')
            setIsDeleteOpen(false)
        } else {
            toast.error(result.error || 'Failed to delete item')
        }
        setIsPending(false)
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items, models, or categories..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-9"
                    />
                </div>

                {/* Create Sheet */}
                <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <SheetTrigger asChild>
                        <Button variant="default" className="shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Item
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Create New Item</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Register a new item in the secretary inventory.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Tag className="h-4 w-4 text-primary/70" />
                                    Item Name
                                </label>
                                <Input
                                    placeholder="e.g. Whiteboard Markers"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Barcode className="h-4 w-4 text-primary/70" />
                                    Model <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="e.g. WBM-SET"
                                    value={newItem.model}
                                    onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Layers className="h-4 w-4 text-primary/70" />
                                    Category
                                </label>
                                <Select value={newItem.categoryId} onValueChange={(v) => setNewItem({ ...newItem, categoryId: v })}>
                                    <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
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
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Box className="h-4 w-4 text-primary/70" />
                                    Item Type
                                </label>
                                <Select value={newItem.itemType} onValueChange={(v) => setNewItem({ ...newItem, itemType: v })}>
                                    <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Non-Consumables">Non-Consumables</SelectItem>
                                        <SelectItem value="Consumables">Consumables</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="px-6 h-11 shrink-0">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !newItem.name || !newItem.categoryId}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Create Item</>
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-foreground/80">Item Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Category</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Type</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Model</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Total Qty</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/secretary/items/${item.id}`}
                                        className="hover:underline text-foreground hover:text-primary transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{item.category?.name || 'N/A'}</TableCell>
                                <TableCell><Badge variant="outline">{item.itemType}</Badge></TableCell>
                                <TableCell>{item.model || 'N/A'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
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
                                            <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openDelete(item)} className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No items found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Sheet */}
            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                    <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                        <SheetTitle className="text-2xl font-bold tracking-tight">Edit Item</SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground">
                            Update the details for <strong>{editingItem?.name}</strong>.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <Tag className="h-4 w-4 text-primary/70" />
                                Item Name
                            </label>
                            <Input
                                placeholder="e.g. Whiteboard Markers"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <Barcode className="h-4 w-4 text-primary/70" />
                                Model <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                            </label>
                            <Input
                                placeholder="e.g. WBM-SET"
                                value={editForm.model}
                                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <Layers className="h-4 w-4 text-primary/70" />
                                Category
                            </label>
                            <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}>
                                <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
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
                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                <Box className="h-4 w-4 text-primary/70" />
                                Item Type
                            </label>
                            <Select value={editForm.itemType} onValueChange={(v) => setEditForm({ ...editForm, itemType: v })}>
                                <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Non-Consumables">Non-Consumables</SelectItem>
                                    <SelectItem value="Consumables">Consumables</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <SheetFooter className="pt-6 border-t bg-muted/10">
                        <div className="flex w-full justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="px-6 h-11 shrink-0">
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={isPending || !editForm.name || !editForm.categoryId}
                                className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                            >
                                {isPending ? 'Processing...' : (
                                    <><Check className="mr-2 h-4 w-4" /> Save Changes</>
                                )}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingItem?.name}</strong>? This cannot be undone.
                            Items with existing instances or distribution records cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete Item'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing {Math.min(filteredItems.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredItems.length, currentPage * ITEMS_PER_PAGE)} of {filteredItems.length}
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
        </div>
    )
}
