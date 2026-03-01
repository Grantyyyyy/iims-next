'use client'

import React, { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter, SheetTrigger
} from "@/components/ui/sheet"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { createLabCategory } from './actions'
import { toast } from 'sonner'
import { Plus, Search, Tag, Check, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface LabCategoryManagerProps {
    categories: any[]
}

const ITEMS_PER_PAGE = 10

export function LabCategoryManager({ categories }: LabCategoryManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [isPending, setIsPending] = useState(false)

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories
        const term = searchTerm.toLowerCase()
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(term)
        )
    }, [categories, searchTerm])

    const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE)
    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredCategories.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredCategories, currentPage])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleCreate = async () => {
        if (!newCatName) return

        setIsPending(true)
        const result = await createLabCategory(newCatName)
        setIsPending(false)

        if (result.success) {
            toast.success('Category created successfully')
            setNewCatName('')
            setIsSheetOpen(false)
        } else {
            toast.error(result.error || 'Failed to create category')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-9"
                    />
                </div>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button className="shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Create New Category</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Register a new category for lab equipment and apparatus.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                    <Tag className="h-4 w-4 text-primary/70" />
                                    Category Name
                                </label>
                                <Input
                                    placeholder="e.g. Glassware"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="px-6 h-11 shrink-0">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !newCatName}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Create Category</>
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCategories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell className="font-medium">{cat.name}</TableCell>
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
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Category
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Category
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedCategories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing {Math.min(filteredCategories.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredCategories.length, currentPage * ITEMS_PER_PAGE)} of {filteredCategories.length}
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
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(page)}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )
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
