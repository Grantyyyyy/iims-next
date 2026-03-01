'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    AlertCircle,
    Loader2,
    Minus,
    Lock,
    Check,
    User,
    MapPin,
    ClipboardList,
    Clock,
    Package,
    ArrowRight,
    ArrowLeft,
    X,
    Package as PackageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    distributeItems,
    searchStaffUsers,
    searchRooms,
    getRecipientActiveItems,
    type CartItem
} from '@/app/actions/secretary'

type Props = {
    initialItems: any[]
}

export default function DistributeClient({ initialItems }: Props) {
    const router = useRouter()

    // UI State
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const scrollRef = useRef<HTMLDivElement>(null)

    // Cart State (Persisted)
    const [cart, setCart] = useState<CartItem[]>([])

    // Dialog & Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogStep, setDialogStep] = useState<1 | 2 | 3>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form Fields
    const [borrowerSearch, setBorrowerSearch] = useState('')
    const [borrowerResults, setBorrowerResults] = useState<any[]>([])
    const [isSearchingBorrower, setIsSearchingBorrower] = useState(false)
    const [selectedBorrower, setSelectedBorrower] = useState<any>(null)

    const [roomSearch, setRoomSearch] = useState('')
    const [roomResults, setRoomResults] = useState<any[]>([])
    const [isSearchingRoom, setIsSearchingRoom] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<any>(null)

    const [purpose, setPurpose] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [conflictWarnings, setConflictWarnings] = useState<any[]>([])

    // Inline quantities for Consumables
    const [quantities, setQuantities] = useState<Record<number, number>>({})

    // Expand state for Non-Consumable groups
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

    // Session Storage Sync
    useEffect(() => {
        const savedCart = sessionStorage.getItem('iims-distribution-cart')
        if (savedCart) {
            try { setCart(JSON.parse(savedCart)) } catch (e) { }
        }
    }, [])

    useEffect(() => {
        sessionStorage.setItem('iims-distribution-cart', JSON.stringify(cart))
    }, [cart])

    // Derived Cart Info
    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const hasNonConsumables = cart.some(item => item.itemType === 'NON_CONSUMABLE')

    // Categories with counts and cart indicators
    const categories = useMemo(() => {
        const cats = new Map<string, { count: number, cartCount: number }>()
        cats.set('ALL', { count: initialItems.length, cartCount: totalCartItems })

        initialItems.forEach(instance => {
            const catName = instance.item.category?.name || 'Uncategorized'

            if (!cats.has(catName)) {
                cats.set(catName, { count: 0, cartCount: 0 })
            }
            cats.get(catName)!.count += 1
        })

        cart.forEach(cartItem => {
            const originalInstance = initialItems.find(i => i.id === cartItem.itemInstanceId)
            const catName = originalInstance?.item.category?.name || 'Uncategorized'
            if (cats.has(catName)) {
                cats.get(catName)!.cartCount += cartItem.quantity
            }
        })

        return Array.from(cats.entries()).map(([name, data]) => ({ name, ...data }))
    }, [initialItems, cart, totalCartItems])

    // Filter & Group Items
    const filteredAndGroupedItems = useMemo(() => {
        const filtered = initialItems.filter(i => {
            const matchesSearch = i.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (i.inventoryNumber && i.inventoryNumber.toLowerCase().includes(searchTerm.toLowerCase()))
            const matchesCategory = categoryFilter === 'ALL' || (i.item.category?.name || 'Uncategorized') === categoryFilter
            return matchesSearch && matchesCategory
        })

        const nonConsumablesMap = new Map<number, { item: any, instances: any[] }>()
        const consumables: any[] = []

        filtered.forEach(instance => {
            if (instance.item.itemType === 'Consumables') {
                consumables.push(instance)
            } else {
                if (!nonConsumablesMap.has(instance.itemId)) {
                    nonConsumablesMap.set(instance.itemId, { item: instance.item, instances: [] })
                }
                nonConsumablesMap.get(instance.itemId)!.instances.push(instance)
            }
        })

        return {
            consumables,
            nonConsumableGroups: Array.from(nonConsumablesMap.values())
        }
    }, [initialItems, searchTerm, categoryFilter])

    // Scroll to top on category change
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, [categoryFilter])

    // Debounced Borrower Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (borrowerSearch.length >= 2 && !selectedBorrower) {
                setIsSearchingBorrower(true)
                const results = await searchStaffUsers(borrowerSearch)
                setBorrowerResults(results)
                setIsSearchingBorrower(false)
            } else {
                setBorrowerResults([])
            }
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [borrowerSearch, selectedBorrower])

    // Debounced Room Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (roomSearch.length >= 2 && selectedBorrower?.departmentId && !selectedRoom) {
                setIsSearchingRoom(true)
                const results = await searchRooms(roomSearch, selectedBorrower.departmentId)
                setRoomResults(results)
                setIsSearchingRoom(false)
            } else {
                setRoomResults([])
            }
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [roomSearch, selectedBorrower, selectedRoom])

    // Fetch conflicts when borrower is selected
    useEffect(() => {
        async function checkConflicts() {
            if (selectedBorrower) {
                const active = await getRecipientActiveItems(selectedBorrower.id)

                const conflicts = []
                for (const cartItem of cart) {
                    if (cartItem.itemType === 'NON_CONSUMABLE') {
                        const existingBorrow = active.borrows.find((b: any) => b.itemInstance.item.id === cartItem.itemId)
                        if (existingBorrow) {
                            conflicts.push({
                                itemName: cartItem.itemName,
                                inventoryNumber: existingBorrow.itemInstance.inventoryNumber,
                                date: existingBorrow.borrowDate
                            })
                        }
                    }
                }
                setConflictWarnings(conflicts)
            } else {
                setConflictWarnings([])
            }
        }
        checkConflicts()
    }, [selectedBorrower, cart])


    // Cart Handlers
    const addToCart = (instance: any, isConsumable: boolean) => {
        if (!isConsumable && cart.some(c => c.itemInstanceId === instance.id)) return

        const qty = isConsumable ? (quantities[instance.id] || 1) : 1

        setCart(prev => {
            const existingIdx = prev.findIndex(c => c.itemInstanceId === instance.id)
            if (existingIdx >= 0 && isConsumable) {
                // Update qty
                const newCart = [...prev]
                newCart[existingIdx].quantity = qty
                toast.success(`Updated quantity for ${instance.item.name}`)
                return newCart
            } else {
                // Add new
                toast.success(`Added ${instance.item.name} to cart`)
                return [...prev, {
                    itemInstanceId: instance.id,
                    itemId: instance.itemId,
                    itemName: instance.item.name,
                    inventoryNumber: instance.inventoryNumber,
                    itemType: isConsumable ? 'CONSUMABLE' : 'NON_CONSUMABLE',
                    quantity: qty,
                    maxQuantity: instance.quantity
                }]
            }
        })
    }

    const updateQuantity = (instanceId: number, max: number, delta: number) => {
        setQuantities(prev => {
            const current = prev[instanceId] || 1
            const next = Math.max(1, Math.min(max, current + delta))
            return { ...prev, [instanceId]: next }
        })
    }

    const removeFromCart = (instanceId: number) => {
        setCart(prev => prev.filter(c => c.itemInstanceId !== instanceId))
        if (cart.length === 1) setIsDialogOpen(false) // Close if removing last item
    }

    const updateCartQuantity = (instanceId: number, max: number, delta: number) => {
        setCart(prev => prev.map(c => {
            if (c.itemInstanceId === instanceId) {
                const next = Math.max(1, Math.min(max, c.quantity + delta))
                return { ...c, quantity: next }
            }
            return c
        }))
    }

    // Submit Handler
    const handleConfirmSubmit = async () => {
        setIsSubmitting(true)

        try {
            const res = await distributeItems({
                items: cart,
                recipientUserId: selectedBorrower.id,
                roomId: selectedRoom.id,
                purpose,
                dueDate: hasNonConsumables ? new Date(dueDate).toISOString() : undefined
            })

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Success! Distributed items to ${selectedBorrower.firstName}`)
                setCart([])
                sessionStorage.removeItem('iims-distribution-cart')
                setIsDialogOpen(false)

                // Reset form
                setDialogStep(1)
                setSelectedBorrower(null)
                setBorrowerSearch('')
                setSelectedRoom(null)
                setRoomSearch('')
                setPurpose('')
                setDueDate('')

                router.push('/secretary/records')
            }
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Floating Cart pulsing effect on new item
    const [cartPulse, setCartPulse] = useState(false)
    useEffect(() => {
        if (cart.length > 0) {
            setCartPulse(true)
            const t = setTimeout(() => setCartPulse(false), 300)
            return () => clearTimeout(t)
        }
    }, [cart.length])

    return (
        <div className="w-full space-y-4 relative pb-24">
            {/* Filter Tabs */}
            <div className="w-full">
                <ScrollArea className="w-full whitespace-nowrap rounded-md bg-background overflow-hidden pb-4">
                    <div className="flex w-max space-x-2 px-1 py-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat.name}
                                variant={categoryFilter === cat.name ? "default" : "ghost"}
                                className="rounded-full h-8 px-4 text-sm"
                                onClick={() => setCategoryFilter(cat.name)}
                            >
                                {cat.name}
                                <span className="ml-2 text-xs opacity-70">({cat.count})</span>
                                {cat.cartCount > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary-foreground text-primary">
                                        {cat.cartCount}
                                    </Badge>
                                )}
                            </Button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by item name or ID..."
                    className="pl-9 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Main Item Browser */}
            <div ref={scrollRef} className="space-y-6">

                {filteredAndGroupedItems.nonConsumableGroups.length === 0 && filteredAndGroupedItems.consumables.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground border rounded-lg bg-background/50">
                        <p>No items found in this category.</p>
                    </div>
                )}

                {/* Non-Consumable Groups */}
                {filteredAndGroupedItems.nonConsumableGroups.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Non-Consumable Assets
                            <Badge variant="outline">{filteredAndGroupedItems.nonConsumableGroups.length}</Badge>
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredAndGroupedItems.nonConsumableGroups.map(group => {
                                const availableCount = group.instances.length
                                const isExpanded = expandedGroups[group.item.id] || availableCount === 1

                                return (
                                    <Collapsible
                                        key={group.item.id}
                                        open={isExpanded}
                                        onOpenChange={(open) => setExpandedGroups(p => ({ ...p, [group.item.id]: open }))}
                                        className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-muted/30">
                                            <div className="flex items-center gap-4">
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="w-9 p-0" disabled={availableCount === 0}>
                                                        {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <div>
                                                    <h4 className="font-semibold text-base">{group.item.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{group.item.category?.name} — {group.item.model || 'No Model'}</p>
                                                </div>
                                            </div>
                                            <Badge variant={availableCount > 0 ? "default" : "secondary"}>
                                                {availableCount} available
                                            </Badge>
                                        </div>

                                        <CollapsibleContent className="bg-background divide-y">
                                            {group.instances.map(instance => {
                                                const inCart = cart.some(c => c.itemInstanceId === instance.id)
                                                // Assuming we only listed available ones based on getAvailableItems query

                                                return (
                                                    <div key={instance.id} className="flex items-center justify-between p-4 pl-14 hover:bg-muted/10 transition-colors">
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="font-medium w-32">{instance.inventoryNumber}</span>
                                                            <span className="text-muted-foreground w-32">{instance.serialNumber || 'No SN'}</span>
                                                            <Badge variant="outline">{instance.currentCondition}</Badge>
                                                        </div>

                                                        {inCart ? (
                                                            <Button variant="secondary" disabled size="sm" className="w-32">
                                                                <Check className="h-4 w-4 mr-2" /> In Cart
                                                            </Button>
                                                        ) : (
                                                            <Button onClick={() => addToCart(instance, false)} size="sm" className="w-32">
                                                                <ShoppingCart className="h-4 w-4 mr-2" /> Add
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </CollapsibleContent>
                                    </Collapsible>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Consumable Cards */}
                {filteredAndGroupedItems.consumables.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mt-8">
                            Consumable Supplies
                            <Badge variant="outline">{filteredAndGroupedItems.consumables.length}</Badge>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredAndGroupedItems.consumables.map(instance => {
                                const qty = quantities[instance.id] || 1
                                const inCart = cart.some(c => c.itemInstanceId === instance.id)
                                const cartItem = cart.find(c => c.itemInstanceId === instance.id)

                                return (
                                    <Card key={instance.id} className="flex flex-col">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">{instance.item.name}</CardTitle>
                                                    <CardDescription>{instance.item.category?.name}</CardDescription>
                                                </div>
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {instance.quantity} avail
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardFooter className="mt-auto pt-4 flex gap-2 justify-between">
                                            <div className="flex items-center border rounded-md">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={() => updateQuantity(instance.id, instance.quantity, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm font-medium">{qty}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={() => updateQuantity(instance.id, instance.quantity, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <Button
                                                onClick={() => addToCart(instance, true)}
                                                variant={inCart && qty === cartItem?.quantity ? "secondary" : "default"}
                                            >
                                                {inCart ? (qty !== cartItem?.quantity ? 'Update Qty' : <><Check className="h-4 w-4 mr-2" /> In Cart</>) : <><ShoppingCart className="h-4 w-4 mr-2" /> Add</>}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <div className={`fixed bottom-6 right-6 z-50 transition-transform ${cartPulse ? 'scale-110' : 'scale-100'}`}>
                    <Button
                        size="lg"
                        className="rounded-full shadow-xl px-6 h-14 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 border-2 border-transparent"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <ShoppingCart className="h-5 w-5 mr-3" />
                        <span className="font-semibold text-base mr-3">Cart</span>
                        <Badge variant="secondary" className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-full w-6 h-6 p-0 flex items-center justify-center">
                            {totalCartItems}
                        </Badge>
                    </Button>
                </div>
            )}

            {/* Distribution Multi-Step Sheet */}
            <Sheet open={isDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsDialogOpen(false)
                } else {
                    setIsDialogOpen(true)
                }
            }}>
                <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                    <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                        {/* Subtle Glow Effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                        <div className="relative z-10 text-left">
                            <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Distribute Items
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium mt-1">
                                {dialogStep === 1 ? "Review your selected items in the cart." :
                                    dialogStep === 2 ? "Specify the recipient and destination details." :
                                        "Review all details before confirming distribution."}
                            </SheetDescription>
                        </div>

                        {/* Stepper Indicator */}
                        <div className="flex items-center gap-1.5 mt-6 relative z-10">
                            {[1, 2, 3].map((step) => (
                                <React.Fragment key={step}>
                                    <div className="flex flex-col items-center gap-1.5 flex-1 group">
                                        <div className={cn(
                                            "h-1.5 w-full rounded-full transition-all duration-500",
                                            dialogStep >= step ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "bg-muted"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                            dialogStep >= step ? "text-primary" : "text-muted-foreground/50"
                                        )}>
                                            {step === 1 ? "Cart" : step === 2 ? "Details" : "Review"}
                                        </span>
                                    </div>
                                    {step < 3 && <div className="w-2" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6 py-8">
                        {dialogStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ShoppingCart className="h-3.5 w-3.5 text-primary/70" />
                                        Added Items ({cart.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.itemInstanceId} className="group flex justify-between items-center text-sm p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-background hover:shadow-md hover:border-primary/30 transition-all duration-300">
                                            <div className="flex gap-4 items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeFromCart(item.itemInstanceId)}
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </Button>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{item.itemName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[10px] h-4.5 font-medium px-1.5 bg-background/50">
                                                            {item.itemType === 'NON_CONSUMABLE' ? item.inventoryNumber : 'Consumable'}
                                                        </Badge>
                                                        {item.itemType === 'NON_CONSUMABLE' && (
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Asset</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {item.itemType === 'CONSUMABLE' ? (
                                                <div className="flex items-center bg-background rounded-lg border border-border/50 shadow-sm overflow-hidden h-9">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-none hover:bg-muted/50 transition-colors"
                                                        onClick={() => updateCartQuantity(item.itemInstanceId, item.maxQuantity!, -1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-10 text-center text-xs font-extrabold">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-none hover:bg-muted/50 transition-colors"
                                                        onClick={() => updateCartQuantity(item.itemInstanceId, item.maxQuantity!, 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                                                    1x
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {cart.length === 0 && (
                                        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-2xl bg-muted/5">
                                            <ShoppingCart className="h-12 w-12 opacity-10 mb-3" />
                                            <p className="text-sm font-medium">Your cart is empty</p>
                                            <Button variant="link" className="text-primary h-auto mt-2" onClick={() => setIsDialogOpen(false)}>Browse Items</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {dialogStep === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                {/* Borrower Search */}
                                <div className="space-y-2.5 relative">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <User className="h-3 w-3 text-primary/70" />
                                        Borrower
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Search staff by name (min 2 chars)..."
                                            className="pl-11 h-12 rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all duration-300 shadow-sm"
                                            value={selectedBorrower ? `${selectedBorrower.firstName} ${selectedBorrower.lastName}` : borrowerSearch}
                                            onChange={(e) => {
                                                setBorrowerSearch(e.target.value)
                                                if (selectedBorrower) {
                                                    setSelectedBorrower(null)
                                                    setSelectedRoom(null)
                                                    setRoomSearch('')
                                                }
                                            }}
                                        />
                                        {isSearchingBorrower && <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-primary" />}
                                        {selectedBorrower && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-2 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => {
                                                    setSelectedBorrower(null)
                                                    setBorrowerSearch('')
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {!selectedBorrower && borrowerSearch.length >= 2 && (
                                        <Card className="absolute top-full mt-2 w-full z-[60] shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl max-h-72 overflow-y-auto rounded-2xl overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            {borrowerResults.length > 0 ? (
                                                <div className="space-y-1">
                                                    {borrowerResults.map(user => (
                                                        <div
                                                            key={user.id}
                                                            className="flex items-center gap-4 p-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/10 active:scale-[0.98]"
                                                            onClick={() => {
                                                                setSelectedBorrower(user)
                                                                setBorrowerSearch('')
                                                                setBorrowerResults([])
                                                            }}
                                                        >
                                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-primary/10">
                                                                <AvatarImage src={user.profilePicUrl} />
                                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-foreground leading-none mb-1">{user.firstName} {user.lastName}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 font-bold bg-muted/50 uppercase">ID: {user.customId}</Badge>
                                                                    <span className="text-[10px] text-muted-foreground font-medium">• {user.department?.name}</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                                <ArrowRight className="h-3.5 w-3.5" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    <User className="h-8 w-8 mx-auto opacity-10 mb-2" />
                                                    <p className="text-xs font-medium">No results found for "{borrowerSearch}"</p>
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                </div>

                                {/* Room Search */}
                                <div className="space-y-2.5 relative">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <MapPin className="h-3 w-3 text-primary/70" />
                                        Room
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Search rooms..."
                                            className="pl-11 h-12 rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all duration-300 shadow-sm"
                                            disabled={!selectedBorrower}
                                            value={selectedRoom ? selectedRoom.name : roomSearch}
                                            onChange={(e) => {
                                                setRoomSearch(e.target.value)
                                                if (selectedRoom) setSelectedRoom(null)
                                            }}
                                        />
                                        {isSearchingRoom && <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-primary" />}
                                    </div>
                                    {!selectedBorrower && (
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-amber-600/80 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10 ml-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Select a borrower first to load rooms
                                        </div>
                                    )}

                                    {selectedBorrower && !selectedRoom && roomSearch.length >= 2 && (
                                        <Card className="absolute top-full mt-2 w-full z-[60] shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl max-h-72 overflow-y-auto rounded-2xl overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            {roomResults.length > 0 ? (
                                                <div className="space-y-1">
                                                    {roomResults.map(room => (
                                                        <div
                                                            key={room.id}
                                                            className="flex flex-col p-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/10 active:scale-[0.98]"
                                                            onClick={() => {
                                                                setSelectedRoom(room)
                                                                setRoomSearch('')
                                                                setRoomResults([])
                                                            }}
                                                        >
                                                            <p className="text-sm font-bold text-foreground leading-none mb-1">{room.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-muted-foreground font-medium">{room.location} • {room.department?.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    <MapPin className="h-8 w-8 mx-auto opacity-10 mb-2" />
                                                    <p className="text-xs font-medium">No rooms found in {selectedBorrower.department?.name}</p>
                                                </div>
                                            )}
                                        </Card>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <ClipboardList className="h-3 w-3 text-primary/70" />
                                        Purpose
                                    </label>
                                    <Textarea
                                        placeholder="Brief explanation for this distribution..."
                                        className="min-h-[100px] rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all duration-300 resize-none px-4 py-3 shadow-sm"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                    />
                                </div>

                                {hasNonConsumables && (
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-primary/70" />
                                            Return Due Date (Optional)
                                        </label>
                                        <Input
                                            type="date"
                                            className="h-12 rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all duration-300"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                        <p className="text-[10px] text-muted-foreground ml-1 font-medium italic">* Consumables do not require a due date.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {dialogStep === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                {/* Borrower Summary Card */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <Check className="h-3 w-3 text-primary/70" />
                                        Distribution Summary
                                    </h3>
                                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/[0.03] to-background border-primary/20 shadow-md">
                                        {/* Subtle pattern background */}
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                                        <CardContent className="p-6 relative z-10">
                                            <div className="flex gap-4 items-center">
                                                <Avatar className="h-16 w-16 border-4 border-background shadow-xl ring-2 ring-primary/20">
                                                    <AvatarImage src={selectedBorrower?.profilePicUrl} />
                                                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{selectedBorrower?.firstName?.[0]}{selectedBorrower?.lastName?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-extrabold text-xl text-foreground tracking-tight">{selectedBorrower?.firstName} {selectedBorrower?.lastName}</p>
                                                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2 mt-1">
                                                        <Badge className="bg-primary hover:bg-primary font-bold text-[10px] h-4.5 px-2">STAFF</Badge>
                                                        {selectedBorrower?.department?.name}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-8 grid grid-cols-2 gap-y-4 gap-x-6">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">Distribution Area</span>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                                        {selectedRoom?.name}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">Status</span>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                        Ready for processing
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">Purpose</span>
                                                    <p className="text-sm font-semibold text-foreground italic">"{purpose}"</p>
                                                </div>
                                                {dueDate && (
                                                    <div className="col-span-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                                <Clock className="h-4 w-4 text-amber-600" />
                                                            </div>
                                                            <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">Return Deadline</span>
                                                        </div>
                                                        <span className="text-sm font-extrabold text-amber-700">{format(new Date(dueDate), 'MMMM dd, yyyy')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Conflict Warnings - Styled Premium */}
                                {conflictWarnings.length > 0 && (
                                    <div className="bg-destructive/[0.03] border border-destructive/20 p-5 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                            <AlertCircle className="h-24 w-24 text-destructive" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="font-extrabold text-xs text-destructive flex items-center gap-2 uppercase tracking-widest mb-3">
                                                <AlertCircle className="h-4 w-4" />
                                                Inventory Conflict Detected
                                            </p>
                                            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                                                <span className="font-bold text-foreground">{selectedBorrower?.firstName}</span> has outstanding items that must be returned first, or this distribution must be noted:
                                            </p>
                                            <div className="space-y-2">
                                                {conflictWarnings.map((w, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-destructive/10">
                                                        <div className="h-2 w-2 rounded-full bg-destructive" />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold">{w.itemName}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase">{w.inventoryNumber} • Since {format(new Date(w.date), 'PP')}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-4 font-bold border-t border-destructive/10 pt-3 italic">
                                                * Secretary approval overrides this warning.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Items Summary - Compact Table Style */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Package className="h-3 w-3 text-primary/70" />
                                            Cart manifest
                                        </h3>
                                        <Badge variant="secondary" className="font-bold text-[10px] px-2 h-5 rounded-full bg-muted/50">{cart.length} items</Badge>
                                    </div>

                                    <div className="rounded-2xl border border-border/50 bg-muted/5 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/10">
                                                <TableRow className="hover:bg-transparent border-border/50">
                                                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-wider">Item/Asset</TableHead>
                                                    <TableHead className="text-[10px] h-10 font-bold uppercase tracking-wider text-right pr-6">Quantity</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cart.map(item => (
                                                    <TableRow key={item.itemInstanceId} className="hover:bg-muted/20 transition-colors border-border/50">
                                                        <TableCell className="py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm leading-none mb-1">{item.itemName}</span>
                                                                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">
                                                                    {item.itemType === 'NON_CONSUMABLE' ? item.inventoryNumber : `Consumable ID: ${item.itemInstanceId}`}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-3 pr-6">
                                                            <Badge variant="outline" className="font-extrabold text-xs h-7 px-3 bg-background group-hover:bg-primary group-hover:text-white transition-colors border-border/50">
                                                                {item.itemType === 'CONSUMABLE' ? `${item.quantity}x` : '1x'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ScrollArea>

                    <SheetFooter className="px-6 py-5 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                        {dialogStep === 1 ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium border-border/50"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                    Close Cart
                                </Button>
                                <Button
                                    onClick={() => setDialogStep(2)}
                                    disabled={cart.length === 0}
                                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group"
                                >
                                    Review Details
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </>
                        ) : dialogStep === 2 ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogStep(1)}
                                    className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium border-border/50"
                                >
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                    Back to Cart
                                </Button>
                                <Button
                                    onClick={() => setDialogStep(3)}
                                    disabled={!selectedBorrower || !selectedRoom || !purpose}
                                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group"
                                >
                                    Review manifest
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogStep(2)}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium border-border/50"
                                >
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                    Edit details
                                </Button>
                                <Button
                                    onClick={handleConfirmSubmit}
                                    disabled={isSubmitting || cart.length === 0}
                                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-green-500/20 active:scale-95 bg-gradient-to-r from-green-600 to-green-500 border-none group min-w-[200px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Confirm distribution
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

        </div>
    )
}
