'use client'

import React, { useState, useEffect, useRef } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, AlertTriangle, Droplet } from 'lucide-react'
import { RecipientSelector } from './RecipientSelector'
import { RoomSelector } from './RoomSelector'
import { SubjectSelector } from './SubjectSelector'
import { FIFOPreview } from './FIFOPreview'
import { distributeChemical, previewDistribution, getRecentDistribution } from '@/app/actions/labtech'
import { convertToBaseUnit } from '@/lib/unit-conversion'
import { toast } from 'sonner'
import { z } from 'zod'

interface DistributionSheetProps {
  chemical: {
    id: number
    name: string
    volume: number
    unit: string
    reorderLevel: number
  }
  trigger: React.ReactNode
}

// Zod schema for form validation
const distributionSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  unit: z.enum(['GAL', 'L', 'ML', 'KG', 'G']),
  subject: z.string().min(1, 'Subject is required'),
  room: z.string().min(1, 'Room is required'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
})

export function DistributionSheet({ chemical, trigger }: DistributionSheetProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [recipientId, setRecipientId] = useState('')
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<string>(chemical.unit)
  const [subject, setSubject] = useState('')
  const [room, setRoom] = useState('')
  const [purpose, setPurpose] = useState('')
  
  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewBatches, setPreviewBatches] = useState<any[]>([])
  const [previewError, setPreviewError] = useState<string | undefined>()
  
  // Warning state
  const [recentDistributionWarning, setRecentDistributionWarning] = useState<string | null>(null)
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced preview updates (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Clear preview if amount is empty or zero
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setPreviewBatches([])
      setPreviewError(undefined)
      return
    }

    setPreviewLoading(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await previewDistribution({
          chemicalId: chemical.id,
          amount: amountNum,
          unit: unit as any,
        })

        if (result.success && result.batches) {
          setPreviewBatches(result.batches)
          setPreviewError(undefined)
        } else {
          setPreviewBatches([])
          setPreviewError(result.error)
        }
      } catch (error) {
        console.error('Preview error:', error)
        setPreviewBatches([])
        setPreviewError('Failed to load preview')
      } finally {
        setPreviewLoading(false)
      }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [amount, unit, chemical.id])

  // Check for recent distribution when recipient changes
  useEffect(() => {
    if (!recipientId || recipientId === '0') {
      setRecentDistributionWarning(null)
      return
    }

    const checkRecentDistribution = async () => {
      try {
        const result = await getRecentDistribution({
          chemicalId: chemical.id,
          recipientId: parseInt(recipientId),
        })

        if (result.found && result.distribution) {
          const { recipientName, amount, unit, date } = result.distribution
          const formattedDate = new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          setRecentDistributionWarning(
            `⚠ ${recipientName} received ${amount.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })} ${unit} of this chemical on ${formattedDate}`
          )
        } else {
          setRecentDistributionWarning(null)
        }
      } catch (error) {
        console.error('Error checking recent distribution:', error)
        setRecentDistributionWarning(null)
      }
    }

    checkRecentDistribution()
  }, [recipientId, chemical.id])

  const handleUserSelect = (user: { id: number; departmentId: number | null }) => {
    setDepartmentId(user.departmentId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // Validate form
    const amountNum = parseFloat(amount)
    const validation = distributionSchema.safeParse({
      recipientId,
      amount: amountNum,
      unit,
      subject,
      room,
      purpose,
    })

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await distributeChemical({
        chemicalId: chemical.id,
        recipientId: parseInt(recipientId),
        amount: amountNum,
        unit: unit as any,
        subject,
        room,
        purpose,
      })

      if (result.success) {
        // Success notification
        let message = 'Chemical distributed successfully'
        if (result.warning) {
          message += `. ${result.warning}`
        }
        toast.success(message)
        
        // Reset form and close
        resetForm()
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to distribute chemical')
      }
    } catch (error) {
      console.error('Distribution error:', error)
      toast.error('An error occurred while distributing the chemical')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setRecipientId('')
    setDepartmentId(null)
    setAmount('')
    setUnit(chemical.unit)
    setSubject('')
    setRoom('')
    setPurpose('')
    setPreviewBatches([])
    setPreviewError(undefined)
    setRecentDistributionWarning(null)
    setErrors({})
  }

  // Calculate conversion preview
  const conversionPreview = () => {
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return null
    }

    const baseAmount = convertToBaseUnit(amountNum, unit)
    const baseUnit = ['GAL', 'L', 'ML'].includes(unit) ? 'ML' : 'G'
    
    return `= ${baseAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} ${baseUnit} will be deducted from stock`
  }

  // Check stock level warnings
  const isOutOfStock = chemical.volume === 0
  const isLowStock = chemical.volume > 0 && chemical.volume <= chemical.reorderLevel

  // Disable submit when out of stock
  const isSubmitDisabled = isSubmitting || isOutOfStock || !!previewError

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      <SheetContent className="flex flex-col gap-0 sm:max-w-2xl border-l shadow-2xl overflow-y-auto">
        <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
          <SheetTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplet className="h-6 w-6" />
            Distribute Chemical
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Distribute {chemical.name} to a STAFF user
          </SheetDescription>
          
          {/* Chemical Info */}
          <div className="mt-4 p-3 bg-background rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">{chemical.name}</div>
                <div className="text-sm text-muted-foreground">
                  Current Stock: {chemical.volume.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })} {chemical.unit}
                </div>
              </div>
              {isLowStock && !isOutOfStock && (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 py-6 px-1 space-y-6">
          {/* Out of Stock Error */}
          {isOutOfStock && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This chemical is out of stock. Please add new batches before distributing.
              </AlertDescription>
            </Alert>
          )}

          {/* Low Stock Warning */}
          {isLowStock && !isOutOfStock && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                Low stock warning: Current volume is at or below reorder level ({chemical.reorderLevel} {chemical.unit})
              </AlertDescription>
            </Alert>
          )}

          {/* Recipient Selector */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient (STAFF User) *</Label>
            <RecipientSelector
              value={recipientId}
              onChange={setRecipientId}
              onUserSelect={handleUserSelect}
            />
            {errors.recipientId && (
              <p className="text-sm text-destructive">{errors.recipientId}</p>
            )}
          </div>

          {/* Recent Distribution Warning */}
          {recentDistributionWarning && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                {recentDistributionWarning}
              </AlertDescription>
            </Alert>
          )}

          {/* Amount and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-xl"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GAL">GAL</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="ML">ML</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Preview */}
          {conversionPreview() && (
            <div className="text-sm text-muted-foreground italic">
              {conversionPreview()}
            </div>
          )}

          {/* Subject Selector */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <SubjectSelector
              value={subject}
              onChange={setSubject}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject}</p>
            )}
          </div>

          {/* Room Selector */}
          <div className="space-y-2">
            <Label htmlFor="room">Room *</Label>
            <RoomSelector
              value={room}
              onChange={setRoom}
              departmentId={departmentId}
            />
            {errors.room && (
              <p className="text-sm text-destructive">{errors.room}</p>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Textarea
              id="purpose"
              placeholder="Describe the purpose of this distribution..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            {errors.purpose && (
              <p className="text-sm text-destructive">{errors.purpose}</p>
            )}
          </div>

          {/* FIFO Preview */}
          {(previewLoading || previewBatches.length > 0 || previewError) && (
            <div className="space-y-2">
              <Label>Batch Deduction Preview</Label>
              <FIFOPreview
                batches={previewBatches}
                loading={previewLoading}
                error={previewError}
              />
            </div>
          )}
        </form>

        <SheetFooter className="pt-6 border-t px-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              setOpen(false)
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Distributing...
              </>
            ) : (
              'Distribute Chemical'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
