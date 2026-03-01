'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'

import { createLabBorrowRecord } from '../records/actions'
import CategoryFilter from './components/CategoryFilter'
import ItemBrowser from './components/ItemBrowser'
import CheckoutSheet from './components/CheckoutSheet'
import FloatingCartButton from './components/FloatingCartButton'
import type {
    CartItem,
    BorrowerType,
    StaffUser,
    Room,
    EquipmentItem,
    ApparatusItem,
    EquipmentInstance,
    ApparatusInstance,
    CheckoutStep,
    ConflictWarning
} from './types'

type Props = {
    equipment: EquipmentItem[]
    apparatus: ApparatusItem[]
}

export default function LabBorrowClient({ equipment, apparatus }: Props) {
    const router = useRouter()

    // UI State
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const scrollRef = useRef<HTMLDivElement>(null)

    // Cart State (Persisted)
    const [cart, setCart] = useState<CartItem[]>([])

    // Dialog & Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogStep, setDialogStep] = useState<CheckoutStep>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Borrower Type
    const [borrowerType, setBorrowerType] = useState<BorrowerType>('STAFF')

    // Staff Borrower Fields
    const [selectedBorrower, setSelectedBorrower] = useState<StaffUser | null>(null)

    // Student Borrower Fields
    const [studentName, setStudentName] = useState('')
    const [studentCourse, setStudentCourse] = useState('')
    const [studentYearLevel, setStudentYearLevel] = useState('')

    // Common Fields
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    const [purpose, setPurpose] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [conflictWarnings, setConflictWarnings] = useState<ConflictWarning[]>([])

    // Expand state for groups
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    // Session Storage Sync
    useEffect(() => {
        const savedCart = sessionStorage.getItem('iims-labtech-borrow-cart')
        if (savedCart) {
            try { setCart(JSON.parse(savedCart)) } catch {
                // Ignore parse errors and start with empty cart
            }
        }
    }, [])

    useEffect(() => {
        sessionStorage.setItem('iims-labtech-borrow-cart', JSON.stringify(cart))
    }, [cart])

    // Derived Cart Info
    const totalCartItems = cart.length

    // Categories with counts and cart indicators
    const categoriesWithCounts = useMemo(() => {
        const cats = new Map<string, { count: number, cartCount: number }>()

        const allItems = [...equipment, ...apparatus]
        cats.set('ALL', { count: allItems.length, cartCount: totalCartItems })

        allItems.forEach(item => {
            const catName = item.category?.name || 'Uncategorized'
            if (!cats.has(catName)) {
                cats.set(catName, { count: 0, cartCount: 0 })
            }
            cats.get(catName)!.count += 1
        })

        cart.forEach(cartItem => {
            const originalItem = allItems.find(i => i.id === cartItem.itemId)
            const catName = originalItem?.category?.name || 'Uncategorized'
            if (cats.has(catName)) {
                cats.get(catName)!.cartCount += 1
            }
        })

        return Array.from(cats.entries()).map(([name, data]) => ({ name, ...data }))
    }, [equipment, apparatus, cart, totalCartItems])

    // Filter & Group Items
    const filteredAndGroupedItems = useMemo(() => {
        const filteredEquipment = equipment.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = categoryFilter === 'ALL' || (item.category?.name || 'Uncategorized') === categoryFilter
            return matchesSearch && matchesCategory && item.instances.length > 0
        })

        const filteredApparatus = apparatus.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = categoryFilter === 'ALL' || (item.category?.name || 'Uncategorized') === categoryFilter
            return matchesSearch && matchesCategory && item.instances.length > 0
        })

        return { equipmentGroups: filteredEquipment, apparatusGroups: filteredApparatus }
    }, [equipment, apparatus, searchTerm, categoryFilter])

    // Scroll to top on category change
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, [categoryFilter])

    // Cart Handlers
    const addToCart = (instance: EquipmentInstance | ApparatusInstance, itemType: 'EQUIPMENT' | 'APPARATUS', item: EquipmentItem | ApparatusItem) => {
        if (cart.some(c => c.instanceId === instance.id)) {
            toast.info('Item already in cart')
            return
        }

        const newItem: CartItem = {
            instanceId: instance.id,
            instanceType: itemType,
            itemId: item.id,
            itemName: item.name,
            inventoryNumber: instance.inventoryNumber
        }

        setCart(prev => [...prev, newItem])
        toast.success(`Added ${item.name} to cart`)
    }

    const removeFromCart = (instanceId: number) => {
        setCart(prev => prev.filter(c => c.instanceId !== instanceId))
        if (cart.length === 1) {
            setIsDialogOpen(false)
        }
    }

    const clearCart = () => {
        setCart([])
        sessionStorage.removeItem('iims-labtech-borrow-cart')
    }

    const resetForm = () => {
        setDialogStep(1)
        setBorrowerType('STAFF')
        setSelectedBorrower(null)
        setStudentName('')
        setStudentCourse('')
        setStudentYearLevel('')
        setSelectedRoom(null)
        setPurpose('')
        setDueDate('')
        setConflictWarnings([])
    }

    // Submit Handler
    const handleConfirmSubmit = async () => {
        setIsSubmitting(true)

        try {
            const borrowData = {
                borrowerId: borrowerType === 'STAFF' ? selectedBorrower?.id : undefined,
                studentName: borrowerType === 'STUDENT' ? studentName : undefined,
                studentCourse: borrowerType === 'STUDENT' ? studentCourse : undefined,
                studentYearLevel: borrowerType === 'STUDENT' ? studentYearLevel : undefined,
                roomId: selectedRoom?.id,
                purpose,
                dueDate: dueDate ? new Date(dueDate) : undefined
            }

            const results = await Promise.all(
                cart.map(item =>
                    createLabBorrowRecord({
                        ...borrowData,
                        equipmentInstanceId: item.instanceType === 'EQUIPMENT' ? item.instanceId : undefined,
                        apparatusInstanceId: item.instanceType === 'APPARATUS' ? item.instanceId : undefined,
                    })
                )
            )

            const failed = results.filter(r => !r.success)

            if (failed.length > 0) {
                toast.error(failed[0].error || 'Some items failed to borrow')
                return
            }

            const borrowerName = borrowerType === 'STAFF'
                ? `${selectedBorrower?.firstName} ${selectedBorrower?.lastName}`
                : studentName

            toast.success(`Success! Borrowed ${cart.length} item(s) to ${borrowerName}`)

            clearCart()
            resetForm()
            setIsDialogOpen(false)
            router.push('/labtech/records')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Toggle group expansion
    const handleToggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
    }

    return (
        <div className="w-full space-y-4 relative pb-24">
            {/* Category Filter */}
            <CategoryFilter
                categories={categoriesWithCounts}
                activeCategory={categoryFilter}
                onCategoryChange={setCategoryFilter}
            />

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by equipment or apparatus name..."
                    className="pl-9 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Item Browser */}
            <ItemBrowser
                equipmentGroups={filteredAndGroupedItems.equipmentGroups as EquipmentItem[]}
                apparatusGroups={filteredAndGroupedItems.apparatusGroups as ApparatusItem[]}
                cart={cart}
                expandedGroups={expandedGroups}
                onToggleGroup={handleToggleGroup}
                onAddToCart={addToCart}
                scrollRef={scrollRef}
            />

            {/* Floating Cart Button */}
            <FloatingCartButton
                itemCount={totalCartItems}
                onOpenCart={() => setIsDialogOpen(true)}
            />

            {/* Checkout Sheet */}
            <CheckoutSheet
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                currentStep={dialogStep}
                cart={cart}
                borrowerType={borrowerType}
                selectedBorrower={selectedBorrower}
                selectedRoom={selectedRoom}
                studentName={studentName}
                studentCourse={studentCourse}
                studentYearLevel={studentYearLevel}
                purpose={purpose}
                dueDate={dueDate}
                conflictWarnings={conflictWarnings}
                isSubmitting={isSubmitting}
                onStepChange={setDialogStep}
                onRemoveFromCart={removeFromCart}
                onBorrowerTypeChange={setBorrowerType}
                onBorrowerSelect={setSelectedBorrower}
                onStudentInfoChange={(field, value) => {
                    if (field === 'name') setStudentName(value)
                    else if (field === 'course') setStudentCourse(value)
                    else if (field === 'yearLevel') setStudentYearLevel(value)
                }}
                onRoomSelect={setSelectedRoom}
                onPurposeChange={setPurpose}
                onDueDateChange={setDueDate}
                onConfirm={handleConfirmSubmit}
                onClearCart={clearCart}
                onConflictsDetected={setConflictWarnings}
            />
        </div>
    )
}
