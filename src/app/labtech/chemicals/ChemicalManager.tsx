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
import { Plus, Search, Tag, Check, X, MoreHorizontal, Droplet, AlertCircle, FileText, Ruler, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from 'next/link'
import { createChemical } from './actions'
import { cn } from '@/lib/utils'
import { DistributionCart, CartItem } from './components/DistributionCart'
import { previewDistribution, distributeMultipleChemicals } from '@/app/actions/labtech'
import { Switch } from '@/components/ui/switch'
import { Label as UiLabel } from '@/components/ui/label'
import { convertFromBaseUnit, determineBaseUnit } from '@/lib/unit-conversion';

interface StockProgressBarProps {
    volume: number;
    reorderLevel: number;
    unit: string;
}

const StockProgressBar = ({ volume, reorderLevel, unit }: StockProgressBarProps) => {
    // If the unit is a bulk unit, we need to convert the base volume (ML/G) back to it
    const baseUnit = determineBaseUnit(unit);
    const displayVolume = unit !== baseUnit ? convertFromBaseUnit(volume, baseUnit, unit) : volume;
    const isLow = volume <= reorderLevel;

    // Surplus buffer: 0% at reorder level, 100% at 2x reorder level
    const surplusPercent = Math.min(100, Math.max(0, ((volume - reorderLevel) / (reorderLevel || 1)) * 100));

    return (
        <div className="flex flex-col w-32 space-y-1.5 group">
            <div className="flex justify-between items-end">
                <span className={cn("text-xs font-bold transition-colors", isLow ? "text-destructive animate-pulse" : "text-foreground")}>
                    {displayVolume.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[10px] font-medium text-muted-foreground uppercase">{unit}</span>
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

    // Cart State
    const [isDistributionMode, setIsDistributionMode] = useState(false)
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load cart from sessionStorage on mount
    React.useEffect(() => {
        const savedCart = sessionStorage.getItem('iims-chem-distribution-cart')
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart', e)
            }
        }
    }, [])

    // Save cart to sessionStorage whenever it changes
    React.useEffect(() => {
        sessionStorage.setItem('iims-chem-distribution-cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (chem: any) => {
        if (cart.find(item => item.id === chem.id)) {
            setIsCartOpen(true)
            return
        }

        const newItem: CartItem = {
            id: chem.id,
            name: chem.name,
            volume: chem.volume,
            unit: chem.unit || 'ML',
            reorderLevel: chem.reorderLevel,
            quantity: '',
            selectedUnit: ['ML', 'L', 'GAL'].includes(chem.unit || 'ML') ? 'ML' : 'G',
            batches: [],
            previewLoading: false
        }

        setCart(prev => [...prev, newItem])
        setIsCartOpen(true)
        toast.success(`Added ${chem.name} to cart`)
    }

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const updateCartItem = async (id: number, quantity: string, unit: string) => {
        setCart(prev => prev.map(item =>
            item.id === id ? { ...item, quantity, selectedUnit: unit, previewLoading: !!quantity && parseFloat(quantity) > 0 } : item
        ))

        const amountNum = parseFloat(quantity)
        if (!quantity || isNaN(amountNum) || amountNum <= 0) {
            setCart(prev => prev.map(item =>
                item.id === id ? { ...item, batches: [], previewLoading: false, previewError: undefined } : item
            ))
            return
        }

        try {
            const result = await previewDistribution({
                chemicalId: id,
                amount: amountNum,
                unit: unit as any
            })

            setCart(prev => prev.map(item => {
                if (item.id === id) {
                    if (result.success && result.batches) {
                        return { ...item, batches: result.batches, previewLoading: false, previewError: undefined }
                    } else {
                        return { ...item, batches: [], previewLoading: false, previewError: result.error }
                    }
                }
                return item
            }))
        } catch (error) {
            setCart(prev => prev.map(item =>
                item.id === id ? { ...item, previewLoading: false, previewError: 'Failed to load preview' } : item
            ))
        }
    }

    const clearCart = () => {
        setCart([])
        toast.info('Cart cleared')
    }

    const handleDistributeAll = async (data: any) => {
        setIsSubmitting(true)
        try {
            const result = await distributeMultipleChemicals({
                recipientId: parseInt(data.recipientId),
                subject: data.subject,
                room: data.room,
                purpose: data.purpose,
                items: data.items.map((item: any) => ({
                    id: item.id,
                    quantity: parseFloat(item.quantity),
                    unit: item.selectedUnit
                }))
            })

            if (result.success) {
                toast.success('Distribution completed successfully')
                clearCart()
                setIsCartOpen(false)
                setIsDistributionMode(false)
            } else {
                toast.error(result.error || 'Failed to distribute chemicals')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

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
            <div className="flex justify-between items-center gap-4 bg-muted/20 p-4 rounded-2xl border-2 border-primary/10 shadow-sm mb-6">
                <div className="flex items-center gap-6">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search chemicals..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="pl-10 h-11 rounded-xl bg-background focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                        />
                    </div>

                    <div className="h-8 w-[2px] bg-primary/10" />

                    <div className="flex items-center space-x-3">
                        <Switch
                            id="distribution-mode"
                            checked={isDistributionMode}
                            onCheckedChange={setIsDistributionMode}
                            className="data-[state=checked]:bg-primary"
                        />
                        <UiLabel htmlFor="distribution-mode" className="font-bold text-sm cursor-pointer select-none flex items-center gap-2">
                            <Droplet className={cn("h-4 w-4", isDistributionMode ? "text-primary" : "text-muted-foreground")} />
                            Start Distribution
                        </UiLabel>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {cart.length > 0 && (
                        <Button
                            variant="outline"
                            className="h-11 px-5 rounded-xl font-bold border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all relative group shadow-sm active:scale-95"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            View Cart
                            <Badge className="ml-2 bg-primary text-white border-none group-hover:scale-110 transition-transform h-5 min-w-[20px] flex items-center justify-center">
                                {cart.length}
                            </Badge>
                        </Button>
                    )}

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button className="h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 border-none hover:shadow-lg transition-all active:scale-95 shadow-sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Chemical
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                            <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                                {/* Subtle Glow Effect */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                                <div className="relative z-10 text-left">
                                    <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Create New Chemical
                                    </SheetTitle>
                                    <SheetDescription className="text-sm font-medium mt-1">
                                        Register a new chemical for laboratory use.
                                    </SheetDescription>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 px-6 py-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Tag className="h-3 w-3 text-primary/70" />
                                            Chemical Name
                                        </label>
                                        <Input
                                            placeholder="e.g. Hydrochloric Acid"
                                            value={newChem.name}
                                            onChange={(e) => setNewChem({ ...newChem, name: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Ruler className="h-3 w-3 text-primary/70" />
                                            Unit of Measurement
                                        </label>
                                        <Select
                                            value={newChem.unit}
                                            onValueChange={(value) => setNewChem({ ...newChem, unit: value })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300">
                                                <SelectValue placeholder="e.g. L, ML, G, KG" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ML">ML</SelectItem>
                                                <SelectItem value="L">L</SelectItem>
                                                <SelectItem value="GAL">GAL</SelectItem>
                                                <SelectItem value="KG">KG</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <AlertCircle className="h-3 w-3 text-primary/70" />
                                            Reorder Level
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 10.00"
                                            value={newChem.reorderLevel}
                                            onChange={(e) => setNewChem({ ...newChem, reorderLevel: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-primary/70" />
                                            Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                                        </label>
                                        <Input
                                            placeholder="Brief description..."
                                            value={newChem.description}
                                            onChange={(e) => setNewChem({ ...newChem, description: e.target.value })}
                                            className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                                        />
                                    </div>
                                </div>
                            </ScrollArea>

                            <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsSheetOpen(false)}
                                    className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isPending || !newChem.name || !newChem.reorderLevel}
                                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Create Chemical
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
                            <TableHead className="font-semibold text-foreground/80">Chemical Name</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Unit</TableHead>
                            <TableHead className="font-semibold text-foreground/80">Stock Status</TableHead>
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
                                <TableCell>{getStatusBadge(chem.status)}</TableCell>
                                <TableCell className="text-right">
                                    {isDistributionMode ? (
                                        <Button
                                            onClick={() => addToCart(chem)}
                                            disabled={chem.volume === 0}
                                            variant={cart.find(item => item.id === chem.id) ? "secondary" : "default"}
                                            className={cn(
                                                "h-9 px-4 rounded-lg font-bold transition-all active:scale-95",
                                                cart.find(item => item.id === chem.id) ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-primary text-primary-foreground shadow-sm hover:shadow-md"
                                            )}
                                        >
                                            {cart.find(item => item.id === chem.id) ? (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    In Cart
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add to Cart
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted/50">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-muted/20">
                                                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Options</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-primary/10 group">
                                                    <Link href={`/labtech/chemicals/${chem.id}`} className="flex items-center justify-between w-full">
                                                        View Details
                                                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
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

            {/* Distribution Cart Panel */}
            <DistributionCart
                open={isCartOpen}
                onOpenChange={setIsCartOpen}
                items={cart}
                onRemove={removeFromCart}
                onUpdateQuantity={updateCartItem}
                onClear={clearCart}
                isSubmitting={isSubmitting}
                onSubmit={handleDistributeAll}
            />
        </div>
    )
}
