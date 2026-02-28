'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Trash2, Plus, AlertCircle, Loader2, Minus, Lock, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

            {/* Distribution Multi-Step Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsDialogOpen(false)
                    // We don't clear state on close so they can resume
                } else {
                    setIsDialogOpen(true)
                }
            }}>
                <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b bg-muted/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold">Distribute Items</h2>
                            <div className="flex items-center text-sm font-medium">
                                <div className={`flex items-center gap-2 transition-colors ${dialogStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${dialogStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</span>
                                    <span className="hidden sm:inline">Cart</span>
                                </div>
                                <div className={`h-[1px] w-4 sm:w-8 mx-2 transition-colors ${dialogStep >= 2 ? 'bg-primary' : 'bg-border'}`} />
                                <div className={`flex items-center gap-2 transition-colors ${dialogStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${dialogStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</span>
                                    <span className="hidden sm:inline">Details</span>
                                </div>
                                <div className={`h-[1px] w-4 sm:w-8 mx-2 transition-colors ${dialogStep >= 3 ? 'bg-primary' : 'bg-border'}`} />
                                <div className={`flex items-center gap-2 transition-colors ${dialogStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${dialogStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</span>
                                    <span className="hidden sm:inline">Review</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {dialogStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="font-semibold text-sm border-b pb-2">Review Added Items</h3>
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                    {cart.map(item => (
                                        <div key={item.itemInstanceId} className="flex justify-between items-center text-sm p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors">
                                            <div className="flex gap-4 items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                                                    onClick={() => removeFromCart(item.itemInstanceId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div>
                                                    <p className="font-bold">{item.itemName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.itemType === 'NON_CONSUMABLE' ? item.inventoryNumber : 'Consumable Supply'}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.itemType === 'CONSUMABLE' ? (
                                                <div className="flex items-center border rounded-md overflow-hidden bg-muted/30 h-8">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none hover:bg-background"
                                                        onClick={() => updateCartQuantity(item.itemInstanceId, item.maxQuantity!, -1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-10 text-center text-xs font-bold">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none hover:bg-background"
                                                        onClick={() => updateCartQuantity(item.itemInstanceId, item.maxQuantity!, 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="font-mono">1x</Badge>
                                            )}
                                        </div>
                                    ))}
                                    {cart.length === 0 && (
                                        <div className="py-12 text-center text-muted-foreground">
                                            Your cart is empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {dialogStep === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                                {/* Borrower Search */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium">Borrower</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search staff by name (min 2 chars)..."
                                            className="pl-9"
                                            value={selectedBorrower ? `${selectedBorrower.firstName} ${selectedBorrower.lastName}` : borrowerSearch}
                                            onChange={(e) => {
                                                setBorrowerSearch(e.target.value)
                                                if (selectedBorrower) {
                                                    setSelectedBorrower(null)
                                                    setSelectedRoom(null) // clear room if borrower changes
                                                    setRoomSearch('')
                                                }
                                            }}
                                        />
                                        {isSearchingBorrower && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>

                                    {!selectedBorrower && borrowerSearch.length >= 2 && (
                                        <Card className="absolute top-full mt-1 w-full z-10 shadow-lg max-h-60 overflow-y-auto">
                                            {borrowerResults.length > 0 ? (
                                                <div className="p-1">
                                                    {borrowerResults.map(user => (
                                                        <div
                                                            key={user.id}
                                                            className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedBorrower(user)
                                                                setBorrowerSearch('')
                                                                setBorrowerResults([])
                                                            }}
                                                        >
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={user.profilePicUrl} />
                                                                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                                                                <p className="text-xs text-muted-foreground">ID: {user.customId} • {user.department?.name}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-sm text-center text-muted-foreground">No staff found for "{borrowerSearch}"</div>
                                            )}
                                        </Card>
                                    )}
                                </div>

                                {/* Room Search */}
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium">Room</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search rooms..."
                                            className="pl-9"
                                            disabled={!selectedBorrower}
                                            value={selectedRoom ? selectedRoom.name : roomSearch}
                                            onChange={(e) => {
                                                setRoomSearch(e.target.value)
                                                if (selectedRoom) setSelectedRoom(null)
                                            }}
                                        />
                                        {isSearchingRoom && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                    {!selectedBorrower && <p className="text-xs text-muted-foreground">Select a borrower first to load their department rooms.</p>}

                                    {selectedBorrower && !selectedRoom && roomSearch.length >= 2 && (
                                        <Card className="absolute top-full mt-1 w-full z-10 shadow-lg max-h-60 overflow-y-auto">
                                            {roomResults.length > 0 ? (
                                                <div className="p-1">
                                                    {roomResults.map(room => (
                                                        <div
                                                            key={room.id}
                                                            className="flex flex-col p-2 hover:bg-muted rounded-md cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedRoom(room)
                                                                setRoomSearch('')
                                                                setRoomResults([])
                                                            }}
                                                        >
                                                            <p className="text-sm font-medium">{room.name}</p>
                                                            <p className="text-xs text-muted-foreground">{room.location} • {room.department?.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-sm text-center text-muted-foreground">No rooms found in {selectedBorrower.department?.name}</div>
                                            )}
                                        </Card>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Purpose</label>
                                    <Textarea
                                        placeholder="Purpose of distribution..."
                                        className="resize-none"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                    />
                                </div>

                                {hasNonConsumables && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-1">
                                            Due Date (Optional)
                                        </label>
                                        <Input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {dialogStep === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in max-h-[60vh] overflow-y-auto pr-2">
                                {/* Borrower Summary */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm border-b pb-2">Borrower Details</h3>
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="p-4 flex gap-4 items-center">
                                            <Avatar className="h-12 w-12 border bg-background">
                                                <AvatarImage src={selectedBorrower?.profilePicUrl} />
                                                <AvatarFallback>{selectedBorrower?.firstName?.[0]}{selectedBorrower?.lastName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm flex-1">
                                                <p className="font-bold text-base">{selectedBorrower?.firstName} {selectedBorrower?.lastName}</p>
                                                <p className="text-muted-foreground">Staff • {selectedBorrower?.department?.name}</p>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                    <p><span className="font-semibold">Room:</span> {selectedRoom?.name}</p>
                                                    <p className="truncate"><span className="font-semibold">Purpose:</span> {purpose}</p>
                                                    {dueDate && (
                                                        <p className="col-span-2 mt-1"><span className="font-semibold text-amber-600 dark:text-amber-400">Due Date:</span> {new Date(dueDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Conflict Warnings */}
                                {conflictWarnings.length > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-lg text-sm space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Conflict Detected
                                        </p>
                                        <p>{selectedBorrower?.firstName} already has related items currently borrowed:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {conflictWarnings.map((w, i) => (
                                                <li key={i}>{w.itemName} ({w.inventoryNumber}) since {new Date(w.date).toLocaleDateString()}</li>
                                            ))}
                                        </ul>
                                        <p className="text-xs opacity-80 pt-1">You may still proceed if this is intentional.</p>
                                    </div>
                                )}

                                {/* Items Summary (ReadOnly) */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <h3 className="font-semibold text-sm">Items Summary</h3>
                                        <Badge variant="outline">{cart.length} unique items</Badge>
                                    </div>

                                    <div className="space-y-2">
                                        {cart.map(item => (
                                            <div key={item.itemInstanceId} className="flex justify-between items-center text-sm px-2 py-1">
                                                <div>
                                                    <p className="font-medium">{item.itemName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.itemType === 'NON_CONSUMABLE' ? item.inventoryNumber : `Supply (ID: ${item.itemInstanceId})`}
                                                    </p>
                                                </div>
                                                <div className="font-bold">
                                                    {item.itemType === 'CONSUMABLE' ? `x${item.quantity}` : '1x'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-muted/20 flex justify-between">
                        {dialogStep === 1 ? (
                            <>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={() => setDialogStep(2)}
                                    disabled={cart.length === 0}
                                >
                                    Continue to Details →
                                </Button>
                            </>
                        ) : dialogStep === 2 ? (
                            <>
                                <Button variant="outline" onClick={() => setDialogStep(1)}>← Back to Cart</Button>
                                <Button
                                    onClick={() => setDialogStep(3)}
                                    disabled={!selectedBorrower || !selectedRoom || !purpose}
                                >
                                    Review Summary →
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setDialogStep(2)} disabled={isSubmitting}>
                                    ← Edit Details
                                </Button>
                                <Button onClick={handleConfirmSubmit} disabled={isSubmitting || cart.length === 0}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Confirm Distribution
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
