'use client'

import { X, ChevronLeft, ChevronRight, Check, Loader2, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import BorrowerSelector from './BorrowerSelector'
import RoomSelector from './RoomSelector'
import ConflictDetector from './ConflictDetector'
import type { CheckoutStep, CartItem, BorrowerType, StaffUser, Room, ConflictWarning } from '../types'

type CheckoutSheetProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentStep: CheckoutStep
  cart: CartItem[]
  borrowerType: BorrowerType
  selectedBorrower: StaffUser | null
  selectedRoom: Room | null
  studentName: string
  studentCourse: string
  studentYearLevel: string
  purpose: string
  dueDate: string
  conflictWarnings: ConflictWarning[]
  isSubmitting: boolean
  onStepChange: (step: CheckoutStep) => void
  onRemoveFromCart: (instanceId: number) => void
  onBorrowerTypeChange: (type: BorrowerType) => void
  onBorrowerSelect: (borrower: StaffUser | null) => void
  onStudentInfoChange: (field: 'name' | 'course' | 'yearLevel', value: string) => void
  onRoomSelect: (room: Room | null) => void
  onPurposeChange: (purpose: string) => void
  onDueDateChange: (date: string) => void
  onConfirm: () => void
  onClearCart: () => void
  onConflictsDetected: (conflicts: ConflictWarning[]) => void
}

export default function CheckoutSheet({
  isOpen,
  onOpenChange,
  currentStep,
  cart,
  borrowerType,
  selectedBorrower,
  selectedRoom,
  studentName,
  studentCourse,
  studentYearLevel,
  purpose,
  dueDate,
  conflictWarnings: _conflictWarnings,
  isSubmitting,
  onStepChange,
  onRemoveFromCart,
  onBorrowerTypeChange,
  onBorrowerSelect,
  onStudentInfoChange,
  onRoomSelect,
  onPurposeChange,
  onDueDateChange,
  onConfirm,
  onClearCart,
  onConflictsDetected
}: CheckoutSheetProps) {
  // Validation logic for each step
  const isStep1Valid = cart.length > 0

  const isStep2Valid = () => {
    const hasBorrower = borrowerType === 'STAFF'
      ? selectedBorrower !== null
      : studentName.trim() !== '' && studentCourse.trim() !== '' && studentYearLevel.trim() !== ''

    return hasBorrower && selectedRoom !== null && purpose.trim() !== ''
  }

  const canContinue = () => {
    if (currentStep === 1) return isStep1Valid
    if (currentStep === 2) return isStep2Valid()
    return true
  }

  const handleBack = () => {
    if (currentStep > 1) {
      onStepChange((currentStep - 1) as CheckoutStep)
    }
  }

  const handleContinue = () => {
    if (currentStep < 3 && canContinue()) {
      onStepChange((currentStep + 1) as CheckoutStep)
    } else if (currentStep === 3) {
      onConfirm()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
          {/* Subtle Glow Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Checkout
              </SheetTitle>
              <SheetDescription className="text-sm font-medium">Complete your borrow request</SheetDescription>
            </div>
          </div>

          {/* Step Progress Indicators */}
          <div className="flex items-center gap-2 mt-4 relative z-10">
            {[1, 2, 3].map((step) => (
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
                    {step === 1 ? 'Cart' : step === 2 ? 'Details' : 'Confirm'}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`h-[1.5px] flex-1 mx-3 rounded-full transition-all duration-700 ${step < currentStep ? 'bg-primary shadow-[0_0_6px_rgba(var(--primary),0.3)]' : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </SheetHeader>

        {/* Step Content */}
        <ScrollArea className="flex-1 min-h-0 px-6 py-6 pt-8">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Review Your Cart</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the items you want to borrow.
                  </p>
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive flex items-center gap-2"
                    onClick={onClearCart}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>

              {cart.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Your cart is empty</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {cart.map((item) => (
                    <Card key={item.instanceId} className="p-4 border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{item.itemName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                              {item.instanceType}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.inventoryNumber}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => onRemoveFromCart(item.instanceId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold">
                  Total Items: <span className="text-primary">{cart.length}</span>
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Borrower & Location Details</h3>
                <p className="text-sm text-muted-foreground">
                  Provide information about who is borrowing and where the items will be used.
                </p>
              </div>

              <BorrowerSelector
                borrowerType={borrowerType}
                selectedBorrower={selectedBorrower}
                studentName={studentName}
                studentCourse={studentCourse}
                studentYearLevel={studentYearLevel}
                onBorrowerTypeChange={onBorrowerTypeChange}
                onBorrowerSelect={onBorrowerSelect}
                onStudentInfoChange={onStudentInfoChange}
              />

              <div className="h-[1px] bg-border/50" />

              <RoomSelector
                selectedRoom={selectedRoom}
                borrowerType={borrowerType}
                selectedBorrower={selectedBorrower}
                onRoomSelect={onRoomSelect}
              />

              <div className="h-[1px] bg-border/50" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Purpose of Borrowing</Label>
                  <div className="relative group">
                    <Textarea
                      placeholder="e.g. For Laboratory Experiment #3..."
                      className="min-h-[80px] rounded-xl bg-muted/20 focus:bg-background transition-all duration-300 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 resize-none p-3 text-sm"
                      value={purpose}
                      onChange={(e) => onPurposeChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Return Due Date (Optional)</Label>
                  <div className="relative group">
                    <Input
                      type="date"
                      className="h-10 rounded-xl bg-muted/20 focus:bg-background transition-all duration-300 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 pl-3 text-sm"
                      value={dueDate}
                      onChange={(e) => onDueDateChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review & Confirm</h3>
                <p className="text-sm text-muted-foreground">
                  Please review all details before submitting your borrow request.
                </p>
              </div>

              {/* Conflict Warnings */}
              <ConflictDetector
                borrowerType={borrowerType}
                selectedBorrower={selectedBorrower}
                cart={cart}
                onConflictsDetected={onConflictsDetected}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Borrower Summary */}
                <Card className="p-4 border-l-4 border-l-primary/30">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Borrower</span>
                  </div>
                  {borrowerType === 'STAFF' && selectedBorrower ? (
                    <div>
                      <p className="font-semibold text-lg">
                        {selectedBorrower.firstName} {selectedBorrower.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded mt-1">
                        ID: {selectedBorrower.customId} • {selectedBorrower.department?.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-lg">{studentName}</p>
                      <p className="text-xs text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded mt-1">
                        {studentCourse} • {studentYearLevel}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Room Summary */}
                {selectedRoom && (
                  <Card className="p-4 border-l-4 border-l-primary/30">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Location</span>
                    </div>
                    <p className="font-semibold text-lg">{selectedRoom.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedRoom.location}</p>
                  </Card>
                )}

                {/* Purpose Summary */}
                <Card className="p-4 border-l-4 border-l-primary/30">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Purpose</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">{purpose}</p>
                </Card>

                {/* Due Date Summary */}
                {dueDate && (
                  <Card className="p-4 border-l-4 border-l-primary/30">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Due Date</span>
                    </div>
                    <p className="font-semibold text-lg">{new Date(dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                  </Card>
                )}
              </div>

              {/* Items Summary - Full Width */}
              <Card className="overflow-hidden border-t-4 border-t-primary/50">
                <div className="bg-muted/30 px-4 py-2 border-b">
                  <h4 className="font-bold text-xs uppercase tracking-widest">
                    Items to Borrow ({cart.length})
                  </h4>
                </div>
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.instanceId} className="flex items-center justify-between p-3 px-4 hover:bg-muted/10 transition-colors">
                      <div>
                        <p className="text-sm font-semibold">{item.itemName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.inventoryNumber}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {item.instanceType}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </ScrollArea>

        {/* Navigation Footer */}
        <SheetFooter className="px-6 py-4 border-t flex-row justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!canContinue() || isSubmitting}
            className="flex items-center gap-2 px-8 h-12 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : currentStep === 3 ? (
              <>
                <Check className="h-5 w-5" />
                Confirm Borrow
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
