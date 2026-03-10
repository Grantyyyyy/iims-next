"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowLeft, ArrowRight, Check, Search, Loader2, AlertCircle, AlertTriangle, Clock, X, Droplet, BookOpen, MapPin, ClipboardList, User } from "lucide-react"
import { searchChemicals, getStockDetails, searchSubjects, searchRooms, searchUsers, recordChemicalUsage, previewFIFODeduction, type BatchDeduction } from "../actions"
import { cn } from "@/lib/utils"
import { BatchPreview } from "./BatchPreview"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RecordUsageDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type UsageFormState = {
  // Step 1 fields
  chemical: {
    id: number
    name: string
    unit: string | null
    availableVolume: number
    reorderLevel: number
  } | null
  quantity: string
  subject: {
    id: number
    name: string
    code?: string
  } | null
  room: {
    id: number
    name: string
  } | null
  purpose: string
  usedByType: 'registered' | 'internal'
  usedBy: {
    id: number
    firstName: string | null
    lastName: string | null
  } | null

  // Step 2 state
  batchPreview: {
    sufficient: boolean
    available: number
    requested: number
    reorderLevel: number
    batches: BatchDeduction[]
  } | null
  batchPreviewLoading: boolean
  batchPreviewError: string | null
}

const initialState: UsageFormState = {
  chemical: null,
  quantity: "",
  subject: null,
  room: null,
  purpose: "",
  usedByType: 'registered',
  usedBy: null,
  batchPreview: null,
  batchPreviewLoading: false,
  batchPreviewError: null,
}

export function RecordUsageDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: RecordUsageDialogProps) {
  // Current step (1 or 2)
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1)

  // Single state object at dialog root level
  const [formState, setFormState] = React.useState<UsageFormState>(initialState)

  // Validation state for highlighting
  const [quantityError, setQuantityError] = React.useState(false)

  // Chemical search state
  const [chemicalSearchQuery, setChemicalSearchQuery] = React.useState("")
  const [chemicalSearchResults, setChemicalSearchResults] = React.useState<
    Array<{ id: number; name: string; unit: string | null; volume: number; reorderLevel: number }>
  >([])
  const [isChemicalSearching, setIsChemicalSearching] = React.useState(false)
  const [chemicalPopoverOpen, setChemicalPopoverOpen] = React.useState(false)

  // Subject search state
  const [subjectSearchQuery, setSubjectSearchQuery] = React.useState("")
  const [subjectSearchResults, setSubjectSearchResults] = React.useState<
    Array<{ id: number; code: string; name: string }>
  >([])
  const [isSubjectSearching, setIsSubjectSearching] = React.useState(false)
  const [subjectPopoverOpen, setSubjectPopoverOpen] = React.useState(false)

  // Room search state
  const [roomSearchQuery, setRoomSearchQuery] = React.useState("")
  const [roomSearchResults, setRoomSearchResults] = React.useState<
    Array<{ id: number; name: string; location: string }>
  >([])
  const [isRoomSearching, setIsRoomSearching] = React.useState(false)
  const [roomPopoverOpen, setRoomPopoverOpen] = React.useState(false)

  // User search state
  const [userSearchQuery, setUserSearchQuery] = React.useState("")
  const [userSearchResults, setUserSearchResults] = React.useState<
    Array<{ id: number; firstName: string | null; lastName: string | null; username: string }>
  >([])
  const [isUserSearching, setIsUserSearching] = React.useState(false)
  const [userPopoverOpen, setUserPopoverOpen] = React.useState(false)

  // Stock details state (for Step 1 dynamic display)
  const [stockDetails, setStockDetails] = React.useState<{
    availableStock: number
    unit: string | null
    reorderLevel: number
    activeBatchCount: number
    batches: Array<{
      id: number
      batchNumber: string
      remainingVolume: number
      expiryDate: Date | null
      isExpiringSoon: boolean
    }>
    warnings: Array<{
      type: 'no_stock' | 'low_stock' | 'expiring_soon'
      message: string
    }>
  } | null>(null)
  const [isLoadingStock, setIsLoadingStock] = React.useState(false)

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Debounced chemical search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (chemicalSearchQuery.length >= 2) {
        setIsChemicalSearching(true)
        try {
          const results = await searchChemicals(chemicalSearchQuery)
          setChemicalSearchResults(results)
        } catch (error) {
          console.error("Error searching chemicals:", error)
          setChemicalSearchResults([])
        } finally {
          setIsChemicalSearching(false)
        }
      } else {
        setChemicalSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [chemicalSearchQuery])

  // Debounced subject search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (subjectSearchQuery.length >= 2) {
        setIsSubjectSearching(true)
        try {
          const results = await searchSubjects(subjectSearchQuery)
          setSubjectSearchResults(results)
        } catch (error) {
          console.error("Error searching subjects:", error)
          setSubjectSearchResults([])
        } finally {
          setIsSubjectSearching(false)
        }
      } else {
        setSubjectSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [subjectSearchQuery])

  // Debounced room search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (roomSearchQuery.length >= 2) {
        setIsRoomSearching(true)
        try {
          const results = await searchRooms(roomSearchQuery)
          setRoomSearchResults(results)
        } catch (error) {
          console.error("Error searching rooms:", error)
          setRoomSearchResults([])
        } finally {
          setIsRoomSearching(false)
        }
      } else {
        setRoomSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [roomSearchQuery])

  // Debounced user search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (userSearchQuery.length >= 2) {
        setIsUserSearching(true)
        try {
          const results = await searchUsers(userSearchQuery)
          setUserSearchResults(results)
        } catch (error) {
          console.error("Error searching users:", error)
          setUserSearchResults([])
        } finally {
          setIsUserSearching(false)
        }
      } else {
        setUserSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [userSearchQuery])

  // Load stock details when chemical is selected
  React.useEffect(() => {
    const loadStockDetails = async () => {
      if (formState.chemical?.id) {
        setIsLoadingStock(true)
        try {
          const details = await getStockDetails(formState.chemical.id)
          setStockDetails(details)
        } catch (error) {
          console.error("Error loading stock details:", error)
          setStockDetails(null)
        } finally {
          setIsLoadingStock(false)
        }
      } else {
        setStockDetails(null)
      }
    }

    loadStockDetails()
  }, [formState.chemical?.id])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
      setFormState(initialState)
      setQuantityError(false)
      setChemicalSearchQuery("")
      setChemicalSearchResults([])
      setChemicalPopoverOpen(false)
      setSubjectSearchQuery("")
      setSubjectSearchResults([])
      setSubjectPopoverOpen(false)
      setRoomSearchQuery("")
      setRoomSearchResults([])
      setRoomPopoverOpen(false)
      setUserSearchQuery("")
      setUserSearchResults([])
      setUserPopoverOpen(false)
      setStockDetails(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Handle step navigation
  const handleNext = async () => {
    // Validate required fields
    if (!formState.chemical?.id || !formState.quantity || !formState.subject?.id || !formState.room?.id || !formState.purpose) {
      toast.error("Please fill in all required fields")
      return
    }

    const qty = parseFloat(formState.quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    // Entering Step 2 - Fetch fresh batch preview
    setCurrentStep(2)
    setFormState(prev => ({ ...prev, batchPreviewLoading: true, batchPreviewError: null }))
    setQuantityError(false)

    try {
      const preview = await previewFIFODeduction(formState.chemical.id, qty)

      setFormState(prev => ({
        ...prev,
        batchPreview: preview,
        batchPreviewLoading: false,
        batchPreviewError: preview.sufficient ? null : `Stock changed since you started. Available: ${preview.available}, Requested: ${preview.requested}`
      }))

    } catch (error) {
      console.error("Error fetching batch preview:", error)
      setFormState(prev => ({
        ...prev,
        batchPreviewLoading: false,
        batchPreviewError: "Failed to load fresh batch preview"
      }))
    }
  }

  const handleBack = () => {
    // Back button preserves ALL form state (never resets)
    setCurrentStep(1)
    if (formState.batchPreviewError) {
      setQuantityError(true)
    }
  }

  const handleConfirm = async () => {
    if (!formState.chemical?.id || !formState.quantity || !formState.subject?.id || !formState.room?.id || !formState.purpose) {
      toast.error("Missing required information")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await recordChemicalUsage({
        chemicalId: formState.chemical.id,
        quantityUsed: parseFloat(formState.quantity),
        subjectId: formState.subject.id,
        roomId: formState.room.id,
        purpose: formState.purpose,
        usedById: formState.usedByType === 'registered' ? formState.usedBy?.id || null : null,
      })

      if (result.success) {
        toast.success(`Usage recorded successfully.`)

        if (result.warning === 'out_of_stock') {
          toast.error(`🔴 ${result.chemicalName} is now out of stock`)
        } else if (result.warning === 'low_stock') {
          toast.warning(`⚠ ${result.chemicalName} is now below reorder level`)
        }

        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.error || "Failed to record usage")
      }
    } catch (error) {
      console.error("Error recording usage:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
        <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
          {/* Subtle Glow Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

          <div className="relative z-10 text-left">
            <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {currentStep === 1 ? "Record Usage" : "Confirm Details"}
            </SheetTitle>
            <SheetDescription className="text-sm font-medium mt-1">
              {currentStep === 1
                ? "Enter usage details for the selected chemical."
                : "Review and confirm the usage deduction below."}
            </SheetDescription>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-1.5 mt-4 relative z-10">
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", currentStep >= 1 ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "bg-muted")} />
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", currentStep >= 2 ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "bg-muted")} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-8">

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Chemical Search Input */}
              <div className="space-y-2">
                <Label htmlFor="chemical">Chemical *</Label>
                <Popover open={chemicalPopoverOpen} onOpenChange={setChemicalPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={chemicalPopoverOpen}
                      className="w-full justify-between h-11 rounded-xl bg-muted/20 border-border/50 hover:bg-muted/30 transition-all px-4"
                    >
                      {formState.chemical?.name || "Search for a chemical..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search chemicals..."
                        value={chemicalSearchQuery}
                        onValueChange={setChemicalSearchQuery}
                      />
                      <CommandList>
                        {isChemicalSearching && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {!isChemicalSearching && chemicalSearchQuery.length < 2 && (
                          <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
                        )}
                        {!isChemicalSearching && chemicalSearchQuery.length >= 2 && chemicalSearchResults.length === 0 && (
                          <CommandEmpty>No chemicals found for &apos;{chemicalSearchQuery}&apos;</CommandEmpty>
                        )}
                        {!isChemicalSearching && chemicalSearchResults.length > 0 && (
                          <CommandGroup>
                            {chemicalSearchResults.map((chemical) => (
                              <CommandItem
                                key={chemical.id}
                                value={chemical.id.toString()}
                                onSelect={() => {
                                  setFormState((prev) => ({
                                    ...prev,
                                    chemical: {
                                      id: chemical.id,
                                      name: chemical.name,
                                      unit: chemical.unit,
                                      availableVolume: chemical.volume,
                                      reorderLevel: chemical.reorderLevel
                                    },
                                  }))
                                  setChemicalPopoverOpen(false)
                                  setChemicalSearchQuery("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formState.chemical?.id === chemical.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{chemical.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Available: {chemical.volume} {chemical.unit || "units"}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Stock Availability Display */}
                {isLoadingStock && formState.chemical?.id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading stock information...</span>
                  </div>
                )}

                {!isLoadingStock && stockDetails && formState.chemical?.id && (
                  <div className="space-y-2">
                    {/* Available Stock Summary */}
                    <div className="text-sm text-muted-foreground">
                      Available: <span className="font-medium text-foreground">{stockDetails.availableStock} {stockDetails.unit || "units"}</span> across <span className="font-medium text-foreground">{stockDetails.activeBatchCount}</span> active batch{stockDetails.activeBatchCount !== 1 ? 'es' : ''}
                    </div>

                    {/* Warnings */}
                    {stockDetails.warnings.length > 0 && (
                      <div className="space-y-2">
                        {stockDetails.warnings.map((warning, index) => (
                          <div
                            key={index}
                            role="alert"
                            className={cn(
                              "relative w-full rounded-lg border p-3 flex items-start gap-2",
                              warning.type === 'no_stock' && 'border-destructive/50 bg-destructive/10 text-destructive',
                              warning.type === 'low_stock' && 'border-orange-500 bg-orange-50 text-orange-900',
                              warning.type === 'expiring_soon' && 'border-yellow-500 bg-yellow-50 text-yellow-900'
                            )}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {warning.type === 'no_stock' && <AlertCircle className="h-4 w-4" />}
                              {warning.type === 'low_stock' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                              {warning.type === 'expiring_soon' && <Clock className="h-4 w-4 text-yellow-600" />}
                            </div>
                            <div className="text-sm flex-1">
                              {warning.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expiring Batches List */}
                    {stockDetails.batches.some(b => b.isExpiringSoon) && (
                      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 space-y-1">
                        <div className="text-xs font-medium text-yellow-900 mb-1">Batches expiring soon:</div>
                        {stockDetails.batches
                          .filter(b => b.isExpiringSoon)
                          .map(batch => (
                            <div key={batch.id} className="text-xs text-yellow-800 flex items-center gap-1">
                              <span className="font-mono">{batch.batchNumber}</span>
                              <span>expires</span>
                              <span className="font-medium">
                                {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'N/A'}
                              </span>
                              <span>⚠</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter quantity..."
                    value={formState.quantity}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    disabled={!formState.chemical?.id}
                    className={cn(
                      "h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300",
                      quantityError && "border-destructive/50 ring-destructive/20 ring-4 focus:ring-destructive/30"
                    )}
                  />
                  {formState.chemical?.id && stockDetails && (
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                      {stockDetails.unit || "units"}
                    </span>
                  )}
                </div>

                {/* Real-time validation error */}
                {formState.quantity &&
                  stockDetails &&
                  parseFloat(formState.quantity) > stockDetails.availableStock && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Exceeds available stock. Max: {stockDetails.availableStock} {stockDetails.unit || "units"}
                      </span>
                    </div>
                  )}
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectPopoverOpen}
                      className="w-full justify-between h-11 rounded-xl bg-muted/20 border-border/50 hover:bg-muted/30 transition-all px-4"
                    >
                      {formState.subject?.name ? `${formState.subject.code} - ${formState.subject.name}` : "Search for a subject..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search subjects..."
                        value={subjectSearchQuery}
                        onValueChange={setSubjectSearchQuery}
                      />
                      <CommandList>
                        {isSubjectSearching && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {!isSubjectSearching && subjectSearchQuery.length < 2 && (
                          <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
                        )}
                        {!isSubjectSearching && subjectSearchQuery.length >= 2 && subjectSearchResults.length === 0 && (
                          <CommandEmpty>No subjects found for &apos;{subjectSearchQuery}&apos;</CommandEmpty>
                        )}
                        {!isSubjectSearching && subjectSearchResults.length > 0 && (
                          <CommandGroup>
                            {subjectSearchResults.map((subject) => (
                              <CommandItem
                                key={subject.id}
                                value={subject.id.toString()}
                                onSelect={() => {
                                  setFormState((prev) => ({
                                    ...prev,
                                    subject: {
                                      id: subject.id,
                                      name: subject.name,
                                      code: subject.code,
                                    },
                                  }))
                                  setSubjectPopoverOpen(false)
                                  setSubjectSearchQuery("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formState.subject?.id === subject.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{subject.code}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {subject.name}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Room Selection */}
              <div className="space-y-2">
                <Label htmlFor="room">Room *</Label>
                <Popover open={roomPopoverOpen} onOpenChange={setRoomPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roomPopoverOpen}
                      className="w-full justify-between h-11 rounded-xl bg-muted/20 border-border/50 hover:bg-muted/30 transition-all px-4"
                    >
                      {formState.room?.name || "Search for a room..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search rooms..."
                        value={roomSearchQuery}
                        onValueChange={setRoomSearchQuery}
                      />
                      <CommandList>
                        {isRoomSearching && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {!isRoomSearching && roomSearchQuery.length < 2 && (
                          <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
                        )}
                        {!isRoomSearching && roomSearchQuery.length >= 2 && roomSearchResults.length === 0 && (
                          <CommandEmpty>No rooms found for &apos;{roomSearchQuery}&apos;</CommandEmpty>
                        )}
                        {!isRoomSearching && roomSearchResults.length > 0 && (
                          <CommandGroup>
                            {roomSearchResults.map((room) => (
                              <CommandItem
                                key={room.id}
                                value={room.id.toString()}
                                onSelect={() => {
                                  setFormState((prev) => ({
                                    ...prev,
                                    room: {
                                      id: room.id,
                                      name: room.name,
                                    },
                                  }))
                                  setRoomPopoverOpen(false)
                                  setRoomSearchQuery("")
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formState.room?.id === room.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{room.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {room.location}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Purpose Input */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Enter purpose of usage"
                  className="min-h-[100px] rounded-xl bg-muted/20 border-border/50 focus:bg-background transition-all duration-300 resize-none px-4 py-3"
                  value={formState.purpose}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, purpose: e.target.value }))
                  }
                />
              </div>

              {/* Used By Toggle and Search */}
              <div className="space-y-2">
                <Label>Used By</Label>

                {/* Toggle between Registered User and Internal Use */}
                <Tabs
                  value={formState.usedByType}
                  onValueChange={(value) => {
                    setFormState((prev) => ({
                      ...prev,
                      usedByType: value as 'registered' | 'internal',
                      usedBy: value === 'internal' ? null : prev.usedBy
                    }))
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30 rounded-xl h-12">
                    <TabsTrigger value="registered" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-10">Registered User</TabsTrigger>
                    <TabsTrigger value="internal" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-10">Internal Use</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* User Search Input (only shown when Registered User is selected) */}
                {formState.usedByType === 'registered' && (
                  <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userPopoverOpen}
                        className="w-full justify-between h-11 rounded-xl bg-muted/20 border-border/50 hover:bg-muted/30 transition-all px-4"
                      >
                        {formState.usedBy?.firstName ? `${formState.usedBy.firstName} ${formState.usedBy.lastName}` : "Search for a user..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type to search users..."
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                        />
                        <CommandList>
                          {isUserSearching && (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                          {!isUserSearching && userSearchQuery.length < 2 && (
                            <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
                          )}
                          {!isUserSearching && userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
                            <CommandEmpty>No users found for &apos;{userSearchQuery}&apos;</CommandEmpty>
                          )}
                          {!isUserSearching && userSearchResults.length > 0 && (
                            <CommandGroup>
                              {userSearchResults.map((user) => {
                                const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
                                return (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id.toString()}
                                    onSelect={() => {
                                      setFormState((prev) => ({
                                        ...prev,
                                        usedBy: {
                                          id: user.id,
                                          firstName: user.firstName,
                                          lastName: user.lastName,
                                        },
                                      }))
                                      setUserPopoverOpen(false)
                                      setUserSearchQuery("")
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formState.usedBy?.id === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{displayName}</span>
                                      <span className="text-xs text-muted-foreground">
                                        @{user.username}
                                      </span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Review & Confirm */}
          {currentStep === 2 && (
            <div className="space-y-4 py-4">
              {/* Loading State */}
              {formState.batchPreviewLoading && (
                <div className="space-y-4 py-8">
                  <div className="rounded-lg border p-4 space-y-3 animate-pulse">
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-8 bg-muted rounded col-span-1"></div>
                      <div className="h-8 bg-muted rounded col-span-1"></div>
                      <div className="h-8 bg-muted rounded col-span-2"></div>
                    </div>
                  </div>
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 w-1/3 bg-muted rounded"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </div>
              )}

              {/* Error State - Stock Changed */}
              {formState.batchPreviewError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-destructive mb-1">
                        Stock Changed
                      </h3>
                      <p className="text-sm text-destructive">
                        {formState.batchPreviewError}
                      </p>
                      <p className="text-sm text-destructive mt-2">
                        Please go back and adjust the quantity.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Details and Batch Preview */}
              {!formState.batchPreviewLoading && !formState.batchPreviewError && (
                <>
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Usage Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Chemical:</span>
                        <p className="font-medium">{formState.chemical?.name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">
                          {formState.quantity || "N/A"} {formState.chemical?.unit || "units"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Subject:</span>
                        <p className="font-medium">{formState.subject?.name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Room:</span>
                        <p className="font-medium">{formState.room?.name || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Purpose:</span>
                        <p className="font-medium">{formState.purpose || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Used By:</span>
                        <p className="font-medium">
                          {formState.usedByType === 'internal' ? "Internal" : `${formState.usedBy?.firstName} ${formState.usedBy?.lastName}` || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BatchPreview Component */}
                  {formState.chemical?.id && formState.quantity && formState.batchPreview && (
                    <BatchPreview
                      chemicalId={formState.chemical.id}
                      quantityRequested={parseFloat(formState.quantity)}
                      unit={formState.chemical.unit}
                      reorderLevel={formState.batchPreview.reorderLevel}
                      currentVolume={formState.batchPreview.available}
                      batches={formState.batchPreview.batches}
                    />
                  )}
                </>
              )}
            </div>
          )}

        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
          {currentStep === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!formState.chemical?.id || !formState.quantity || !formState.subject?.id || !formState.room?.id || !formState.purpose || formState.batchPreviewLoading}
                className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[120px]"
              >
                {formState.batchPreviewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting || !!formState.batchPreviewError || !formState.batchPreview || !formState.batchPreview.sufficient}
                className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-green-600 to-green-500 border-none group min-w-[170px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm Usage
                  </>
                )}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
