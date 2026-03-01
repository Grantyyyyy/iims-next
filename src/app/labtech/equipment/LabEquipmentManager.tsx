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
import { createEquipment } from './actions'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Tag, Barcode, Layers, Check, X, MoreHorizontal, Microscope } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface LabEquipmentManagerProps {
    equipment: any[]
    categories: any[]
}

const ITEMS_PER_PAGE = 10

export function LabEquipmentManager({ equipment, categories }: LabEquipmentManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isPending, setIsPending] = useState(false)

    // Create
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newEquipment, setNewEquipment] = useState({ name: '', model: '', description: '', categoryId: '' })

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

    const getAvailableCount = (eq: any) => {
        return eq.instances.filter((inst: any) => !inst.labBorrowRecords || inst.labBorrowRecords.length === 0).length
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search equipment, models, or categories..."
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
                            Add Equipment
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Add New Equipment</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Register high-value laboratory equipment for tracking.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Tag className="h-4 w-4 text-primary/70" />
                                    Equipment Name
                                </label>
                                <Input
                                    placeholder="e.g. Compound Microscope"
                                    value={newEquipment.name}
                                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Barcode className="h-4 w-4 text-primary/70" />
                                    Model <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="e.g. CM-400"
                                    value={newEquipment.model}
                                    onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Layers className="h-4 w-4 text-primary/70" />
                                    Category <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Select value={newEquipment.categoryId} onValueChange={(v) => setNewEquipment({ ...newEquipment, categoryId: v })}>
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
                                    <Microscope className="h-4 w-4 text-primary/70" />
                                    Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="Brief description"
                                    value={newEquipment.description}
                                    onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="px-6 h-11 shrink-0">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !newEquipment.name}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Create Equipment</>
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
        </div>
    )
}
