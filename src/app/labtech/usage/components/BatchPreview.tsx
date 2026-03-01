"use client"

import * as React from "react"
import { Loader2, AlertCircle, Package } from "lucide-react"
import { generateBatchPreview } from "../actions"
import type { BatchDeduction } from "../actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BatchPreviewProps {
  chemicalId: number
  quantityRequested: number
  unit: string | null
  reorderLevel: number
  currentVolume: number
}

export function BatchPreview({
  chemicalId,
  quantityRequested,
  unit,
  reorderLevel,
  currentVolume,
}: BatchPreviewProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<{
    batches: BatchDeduction[]
    totalDeducted: number
    isValid: boolean
  } | null>(null)

  // Calculate before and after volumes
  const beforeVolume = currentVolume
  const afterVolume = currentVolume - quantityRequested
  const willBeLowStock = afterVolume <= reorderLevel && afterVolume > 0
  const willBeOutOfStock = afterVolume === 0

  React.useEffect(() => {
    const fetchPreview = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await generateBatchPreview(chemicalId, quantityRequested)
        
        if (!result.isValid) {
          setError(result.error || "Unable to generate batch preview")
          setPreview(null)
        } else {
          setPreview({
            batches: result.batches,
            totalDeducted: result.totalDeducted,
            isValid: result.isValid,
          })
        }
      } catch (err) {
        console.error("Error fetching batch preview:", err)
        setError("Failed to load batch preview")
        setPreview(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [chemicalId, quantityRequested])

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading batch preview...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Alert variant="destructive" className="border-0 bg-transparent p-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
          </AlertDescription>
        </Alert>
        <p className="text-sm text-destructive mt-2">
          Please go back and adjust the quantity.
        </p>
      </div>
    )
  }

  if (!preview || preview.batches.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">No batch preview available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Volume Preview */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3">Volume Preview</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Before:</span>
          <span className="font-medium">{beforeVolume} {unit || "units"}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">After:</span>
          <span className="font-medium">{afterVolume} {unit || "units"}</span>
        </div>
        
        {/* Low Stock Warning */}
        {willBeLowStock && (
          <Alert className="mt-3 border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900 text-sm">
              ⚠ After this usage, stock will be below reorder level ({reorderLevel} {unit || "units"})
            </AlertDescription>
          </Alert>
        )}
        
        {/* Out of Stock Warning */}
        {willBeOutOfStock && (
          <Alert className="mt-3 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive text-sm">
              🔴 After this usage, this chemical will be out of stock
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Batch Deduction Table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Batch Deduction Breakdown (FIFO)</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Deducting from oldest batches first
          </p>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead className="text-right">Current Remaining</TableHead>
              <TableHead className="text-right">To Deduct</TableHead>
              <TableHead className="text-right">After Deduction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.batches.map((batch) => (
              <TableRow key={batch.batchId}>
                <TableCell className="font-mono text-sm">
                  {batch.batchNumber}
                </TableCell>
                <TableCell className="text-right">
                  {batch.currentRemaining} {unit || "units"}
                </TableCell>
                <TableCell className="text-right font-medium text-destructive">
                  -{batch.toDeduct} {unit || "units"}
                </TableCell>
                <TableCell className="text-right">
                  {batch.afterDeduction} {unit || "units"}
                  {batch.afterDeduction === 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">(depleted)</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Total Summary */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Total Deduction:</span>
            <span className="font-bold text-destructive">
              -{preview.totalDeducted} {unit || "units"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
