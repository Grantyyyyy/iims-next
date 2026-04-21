'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, ShoppingCart, Info, AlertTriangle, Package, Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { RecipientSelector } from './RecipientSelector'
import { RoomSelector } from './RoomSelector'
import { SubjectSelector } from './SubjectSelector'
import { FIFOPreview } from './FIFOPreview'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DistributionConfirmDialog } from './DistributionConfirmDialog'
import { convertFromBaseUnit, determineBaseUnit } from '@/lib/unit-conversion';

export interface CartItem {
    id: number
    name: string
    volume: number // Available volume
    unit: string   // Base unit (e.g., ML, G)
    reorderLevel: number
    quantity: string
    selectedUnit: string
    batches?: any[]
    previewLoading?: boolean
    previewError?: string
}

interface DistributionCartProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    items: CartItem[]
    onRemove: (id: number) => void
    onUpdateQuantity: (id: number, quantity: string, unit: string) => void
    onClear: () => void
    isSubmitting: boolean
    onSubmit: (data: any) => Promise<void>
}

export function DistributionCart({
    open,
    onOpenChange,
    items,
    onRemove,
    onUpdateQuantity,
    onClear,
    isSubmitting,
    onSubmit
}: DistributionCartProps) {
    const [recipientId, setRecipientId] = useState('')
    const [departmentId, setDepartmentId] = useState<number | null>(null)
    const [subject, setSubject] = useState('')
    const [room, setRoom] = useState('')
    const [purpose, setPurpose] = useState('')
    const [currentStep, setCurrentStep] = useState(1)

    // Confirmation dialog state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [recipientName, setRecipientName] = useState('')
    const [subjectCode, setSubjectCode] = useState('')
    const [roomName, setRoomName] = useState('')

    const handleUserSelect = (user: { id: number; departmentId: number | null; name: string }) => {
        setDepartmentId(user.departmentId)
        setRecipientName(user.name)
    }

    const handleSubmit = async () => {
        if (items.length === 0) return

        // Validation logic
        if (!recipientId || !subject || !room || purpose.length < 10) {
            toast.error('Please fill in all required fields. Purpose must be at least 10 characters.')
            return
        }

        // Check for any quantity errors or out of stock in cart
        const hasErrors = items.some(item => !item.quantity || parseFloat(item.quantity) <= 0 || item.previewError)
        if (hasErrors) {
            toast.error('Please fix the errors in your cart before distributing.')
            return
        }

        // Open confirmation dialog instead of direct submit
        setIsConfirmOpen(true)
    }

    const handleConfirmSubmit = async () => {
        setIsConfirmOpen(false)
        await onSubmit({
            recipientId: parseInt(recipientId),
            subject,
            room,
            purpose,
            items: items.map(item => ({
                id: item.id,
                quantity: parseFloat(item.quantity),
                selectedUnit: ['ML', 'L', 'GAL'].includes(item.unit) ? 'ML' : 'G'
            }))
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
                <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Distribution Cart
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium">
                                {items.length} chemical{items.length !== 1 ? 's' : ''} in cart
                            </SheetDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 relative z-10">
                        {[1, 2].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <div
                                        className={`flex items-center justify-center h-8 w-8 rounded-full text-[10px] font-bold transition-all duration-500 ${step < currentStep
                                            ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                                            : step === currentStep
                                                ? 'bg-primary text-primary-foreground ring-4 ring-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-105'
                                                : 'bg-muted/50 text-muted-foreground border'
                                            }`}
                                    >
                                        {step < currentStep ? <Check className="h-4 w-4 stroke-[3]" /> : step}
                                    </div>
                                    <span
                                        className={`text-[9px] uppercase font-bold tracking-widest transition-colors duration-300 ${step === currentStep ? 'text-primary' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {step === 1 ? 'Cart' : 'Details'}
                                    </span>
                                </div>
                                {step < 2 && (
                                    <div
                                        className={`h-[1.5px] flex-1 mx-3 rounded-full transition-all duration-700 ${step < currentStep ? 'bg-primary shadow-[0_0_6px_rgba(var(--primary),0.3)]' : 'bg-muted'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 min-h-0 px-6 py-6 pt-8">
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Review Your Cart</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Review the chemicals you want to distribute.
                                    </p>
                                </div>
                                {items.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive flex items-center gap-2"
                                        onClick={onClear}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Clear All
                                    </Button>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/5">
                                    <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">Your cart is empty</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Add chemicals from the list to start distribution</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <Card key={item.id} className={cn("overflow-hidden border-2 transition-all duration-300", item.previewError ? "border-destructive/50" : "border-border/50 shadow-sm")}>
                                            <CardHeader className="p-4 bg-muted/10 space-y-0 pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-bold text-base">{item.name}</div>
                                                    <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                        Available: {(determineBaseUnit(item.unit) !== item.unit ? convertFromBaseUnit(item.volume, determineBaseUnit(item.unit), item.unit) : item.volume).toLocaleString(undefined, { maximumFractionDigits: 1 })} {item.unit}
                                                    </Badge>
                                                    {item.volume <= item.reorderLevel && (
                                                        <Badge variant="default" className="text-[10px] py-0 h-5 bg-orange-500">Low Stock</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-4 pt-2">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Amount</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const forcedUnit = ['ML', 'L', 'GAL'].includes(item.unit) ? 'ML' : 'G';
                                                                onUpdateQuantity(item.id, e.target.value, forcedUnit);
                                                            }}
                                                            className="h-10 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Unit</Label>
                                                        <div className="h-10 rounded-lg border border-input bg-muted flex items-center px-3 text-sm text-muted-foreground font-medium">
                                                            {['ML', 'L', 'GAL'].includes(item.unit) ? 'ML' : 'G'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {item.previewError && (
                                                    <div className="text-xs text-destructive flex items-center gap-1.5 mt-2 bg-destructive/10 p-2 rounded-lg">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        {item.previewError}
                                                    </div>
                                                )}

                                                {(item.previewLoading || (item.batches && item.batches.length > 0)) && (
                                                    <div className="mt-2 border-t pt-3">
                                                        <FIFOPreview batches={item.batches || []} loading={item.previewLoading || false} />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Recipient & Details</h3>
                                <p className="text-sm text-muted-foreground">
                                    Provide information about who is receiving the chemicals.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Recipient (STAFF User) *</Label>
                                    <RecipientSelector
                                        value={recipientId}
                                        onChange={setRecipientId}
                                        onUserSelect={handleUserSelect}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject *</Label>
                                        <SubjectSelector
                                            value={subject}
                                            onChange={setSubject}
                                            onSelect={(s) => setSubjectCode(s.code)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Room *</Label>
                                        <RoomSelector
                                            value={room}
                                            onChange={setRoom}
                                            departmentId={departmentId}
                                            onSelect={(r) => setRoomName(r.name)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Purpose (Min 10 characters) *</Label>
                                    <Textarea
                                        placeholder="Enter distribution purpose..."
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="min-h-[100px] rounded-xl bg-muted/20 focus:bg-background transition-all duration-300 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 resize-none p-3 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <SheetFooter className="px-6 py-4 border-t flex-row justify-between gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onOpenChange(false)}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl font-medium"
                    >
                        {currentStep > 1 ? <ChevronLeft className="h-4 w-4" /> : null}
                        {currentStep > 1 ? 'Back' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={() => {
                            if (currentStep === 1) {
                                // check errors first
                                const hasErrors = items.some(item => !item.quantity || parseFloat(item.quantity) <= 0 || item.previewError)
                                if (hasErrors) {
                                    toast.error('Please fix the errors in your cart before continuing.')
                                    return
                                }
                                setCurrentStep(2)
                            } else {
                                handleSubmit()
                            }
                        }}
                        disabled={items.length === 0 || isSubmitting || (currentStep === 2 && (!recipientId || !subject || !room || purpose.length < 10))}
                        className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : currentStep === 2 ? (
                            'Review Distribution'
                        ) : (
                            <>
                                Continue
                                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>

            <DistributionConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={handleConfirmSubmit}
                isSubmitting={isSubmitting}
                items={items}
                details={{
                    recipientName,
                    subjectCode,
                    roomName,
                    purpose
                }}
            />
        </Sheet>
    )
}
