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
import { toast } from 'sonner'
import { Plus, Search, Tag, Check, X, MoreHorizontal, Droplet, AlertCircle, FileText, Ruler } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createChemical } from './actions'
import { cn } from '@/lib/utils'

interface StockProgressBarProps {
    volume: number;
    reorderLevel: number;
    unit: string;
}

const StockProgressBar = ({ volume, reorderLevel, unit }: StockProgressBarProps) => {
    const isLow = volume <= reorderLevel;
    // Surplus buffer: 0% at reorder level, 100% at 2x reorder level
    const surplusPercent = Math.min(100, Math.max(0, ((volume - reorderLevel) / (reorderLevel || 1)) * 100));

    return (
        <div className="flex flex-col w-32 space-y-1.5 group">
            <div className="flex justify-between items-end">
                <span className={cn("text-xs font-bold transition-colors", isLow ? "text-destructive animate-pulse" : "text-foreground")}>
                    {volume.toFixed(1)} <span className="text-[10px] font-medium text-muted-foreground uppercase">{unit}</span>
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-tighter">Min: {reorderLevel}</span>
            </div>
            <div className={cn(
                "h-2 w-full rounded-full overflow-hidden border transition-colors duration-300 relative bg-muted/30",
                isLow ? "border-destructive/30" : "border-border/50"
            )}>
                {/* Visual "Empty" marker/track when low */}
                {isLow && (
                    <div className="absolute inset-0 bg-destructive/10 animate-pulse" />
                )}
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        isLow ? "w-0" : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    )}
                    style={{ width: `${surplusPercent}%` }}
                />
            </div>
        </div>
    );
};

interface ChemicalManagerProps {
    chemicals: any[]
}

const ITEMS_PER_PAGE = 10

export function ChemicalManager({ chemicals }: ChemicalManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [newChem, setNewChem] = useState({
        name: '',
        unit: '',
        description: '',
        reorderLevel: ''
    })

    const handleCreate = async () => {
        if (!newChem.name || !newChem.reorderLevel) return

        setIsPending(true)
        const result = await createChemical({
            name: newChem.name,
            unit: newChem.unit || undefined,
            description: newChem.description || undefined,
            reorderLevel: parseFloat(newChem.reorderLevel)
        })
        setIsPending(false)

        if (result.success) {
            toast.success('Chemical created successfully')
            setNewChem({ name: '', unit: '', description: '', reorderLevel: '' })
            setIsSheetOpen(false)
        } else {
            toast.error(result.error || 'Failed to create chemical')
        }
    }

    const filteredChemicals = useMemo(() => {
        if (!searchTerm) return chemicals
        const term = searchTerm.toLowerCase()
        return chemicals.filter(chem =>
            chem.name.toLowerCase().includes(term)
        )
    }, [chemicals, searchTerm])

    const totalPages = Math.ceil(filteredChemicals.length / ITEMS_PER_PAGE)
    const paginatedChemicals = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredChemicals.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredChemicals, currentPage])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OK':
                return <Badge variant="default" className="bg-green-500">OK</Badge>
            case 'LOW_STOCK':
                return <Badge variant="default" className="bg-orange-500">Low Stock</Badge>
            case 'OUT_OF_STOCK':
                return <Badge variant="destructive">Out of Stock</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chemicals..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-9"
                    />
                </div>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button className="shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Chemical
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                            <SheetTitle className="text-2xl font-bold tracking-tight">Create New Chemical</SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground">
                                Register a new chemical for laboratory use.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-8 space-y-6 px-1">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <Tag className="h-4 w-4 text-primary/70" />
                                        Chemical Name
                                    </label>
                                    <Input
                                        placeholder="e.g. Hydrochloric Acid"
                                        value={newChem.name}
                                        onChange={(e) => setNewChem({ ...newChem, name: e.target.value })}
                                        className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <Ruler className="h-4 w-4 text-primary/70" />
                                        Unit of Measurement
                                    </label>
                                    <Input
                                        placeholder="e.g. L, mL, g, kg"
                                        value={newChem.unit}
                                        onChange={(e) => setNewChem({ ...newChem, unit: e.target.value })}
                                        className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <AlertCircle className="h-4 w-4 text-primary/70" />
                                        Reorder Level
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 10.00"
                                        value={newChem.reorderLevel}
                                        onChange={(e) => setNewChem({ ...newChem, reorderLevel: e.target.value })}
                                        className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                                        <FileText className="h-4 w-4 text-primary/70" />
                                        Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                    </label>
                                    <Input
                                        placeholder="Brief description..."
                                        value={newChem.description}
                                        onChange={(e) => setNewChem({ ...newChem, description: e.target.value })}
                                        className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                        <SheetFooter className="pt-6 border-t bg-muted/10">
                            <div className="flex w-full justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="px-6 h-11 shrink-0">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !newChem.name || !newChem.reorderLevel}
                                    className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                                >
                                    {isPending ? 'Processing...' : (
                                        <><Check className="mr-2 h-4 w-4" /> Create Chemical</>
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
                            <TableHead className="font-semibold text-foreground/80">Chemical Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Unit</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Stock Status</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Batches</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                            <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedChemicals.map((chem) => (
                            <TableRow key={chem.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/labtech/chemicals/${chem.id}`}
                                        className="hover:underline text-foreground hover:text-primary transition-colors"
                                    >
                                        {chem.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{chem.unit || 'N/A'}</TableCell>
                                <TableCell>
                                    <StockProgressBar
                                        volume={chem.volume}
                                        reorderLevel={chem.reorderLevel}
                                        unit={chem.unit || ''}
                                    />
                                </TableCell>
                                <TableCell>{chem.batches.length}</TableCell>
                                <TableCell>{getStatusBadge(chem.status)}</TableCell>
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
                                                <Link href={`/labtech/chemicals/${chem.id}`}>
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedChemicals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No chemicals found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing {Math.min(filteredChemicals.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredChemicals.length, currentPage * ITEMS_PER_PAGE)} of {filteredChemicals.length}
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
