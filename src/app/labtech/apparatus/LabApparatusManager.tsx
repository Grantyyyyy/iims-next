'use client'

import React, { useState, useMemo } from 'react'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { createApparatus } from './actions'
import { toast } from 'sonner'
import { Plus, Search, Tag, Barcode, Layers, Check, X, MoreHorizontal, Beaker, Box } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface LabApparatusManagerProps {
    apparatus: any[]
    categories: any[]
}

const ITEMS_PER_PAGE = 10

export function LabApparatusManager({ apparatus, categories }: LabApparatusManagerProps) {
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
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search apparatus or categories..."
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
                            Add Apparatus
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Add New Apparatus</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Register laboratory apparatus for tracking.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Tag className="h-4 w-4 text-primary/70" />
                                    Apparatus Name
                                </label>
                                <Input
                                    placeholder="e.g. Burette 50ml"
                                    value={newApparatus.name}
                                    onChange={(e) => setNewApparatus({ ...newApparatus, name: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Box className="h-4 w-4 text-primary/70" />
                                    Apparatus Type
                                </label>
                                <Select value={newApparatus.apparatusType} onValueChange={(v) => setNewApparatus({ ...newApparatus, apparatusType: v })}>
                                    <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Non-Consumables">Non-Consumables</SelectItem>
                                        <SelectItem value="Consumables">Consumables</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Layers className="h-4 w-4 text-primary/70" />
                                    Category <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Select value={newApparatus.categoryId} onValueChange={(v) => setNewApparatus({ ...newApparatus, categoryId: v })}>
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
                                    <Beaker className="h-4 w-4 text-primary/70" />
                                    Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                </label>
                                <Input
                                    placeholder="Brief description"
                                    value={newApparatus.description}
                                    onChange={(e) => setNewApparatus({ ...newApparatus, description: e.target.value })}
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
                                    disabled={isPending || !newApparatus.name}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Create Apparatus</>
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
                            <TableHead className="font-semibold text-foreground/80">Apparatus Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Category</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Type</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Instances/Batches</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Available</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedApparatus.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/labtech/apparatus/${app.id}`}
                                        className="hover:underline text-foreground hover:text-primary transition-colors"
                                    >
                                        {app.name}
                                    </Link>
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
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href={`/labtech/apparatus/${app.id}`}>
                                                    View Details
                                                </Link>
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
        </div>
    )
}
