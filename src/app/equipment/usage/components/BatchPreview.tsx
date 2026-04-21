"use client"

import * as React from "react"
import { AlertCircle, Package, Clock, ShieldAlert } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BatchPreviewProps {
  chemicalId: number
  quantityRequested: number
  unit: string | null
  reorderLevel: number
  currentVolume: number
  batches: BatchDeduction[]
}

export function BatchPreview({
  unit,
  reorderLevel,
  currentVolume,
  quantityRequested,
  batches,
}: BatchPreviewProps) {
  // Calculate after volume
  const afterVolume = currentVolume - quantityRequested
  const willBeLowStock = afterVolume <= reorderLevel && afterVolume > 0
  const willBeOutOfStock = afterVolume <= 0

  return (
    <div className="space-y-4">
      {/* Volume Preview */}
      <div className="rounded-lg border p-4 bg-muted/10">
        <h3 className="font-semibold text-sm mb-3">After Deduction Preview</h3>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Volume Change:</span>
            <span className="font-medium underline decoration-primary/30 decoration-2 underline-offset-4">
              {currentVolume} {unit || "units"}
            </span>
            <span className="text-muted-foreground mx-1">→</span>
            <span className={cn(
              "font-bold text-lg",
              willBeOutOfStock ? "text-destructive" : "text-foreground"
            )}>
              {Math.max(0, afterVolume)} {unit || "units"}
            </span>
          </div>

          {willBeOutOfStock && (
            <Badge variant="destructive" className="animate-pulse">Out of Stock</Badge>
          )}
          {willBeLowStock && !willBeOutOfStock && (
            <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Low Stock</Badge>
          )}
        </div>

        {/* Low Stock/Empty Warning Banner */}
        {willBeLowStock && (
          <div className="mt-3 p-3 rounded-md bg-orange-50 border border-orange-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
            <p className="text-sm text-orange-900 leading-tight">
              Usage results in stock falling below your <span className="font-bold">{reorderLevel} {unit}</span> reorder level.
            </p>
          </div>
        )}
      </div>

      {/* Batch Deduction Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">FIFO Deduction Breakdown</h3>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow>
              <TableHead className="w-[140px]">Batch</TableHead>
              <TableHead className="text-right">Deducted</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.batchId} className="group hover:bg-muted/5 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold">{batch.batchNumber}</span>
                    {batch.expiryDate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-destructive">
                  -{batch.toDeduct}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {batch.remainingAfter}
                </TableCell>
                <TableCell className="text-right">
                  {batch.willBeExhausted ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] py-0 h-5">Exhausted</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0 h-5">Stocked</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-3 border-t bg-muted/50 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Deduction</span>
          <span className="font-bold text-destructive">
            -{quantityRequested} {unit || "units"}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-blue-50/50 border-blue-100 py-3">
        <ShieldAlert className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-800">
          This is a read-only preview. Stock is not reserved until you click <strong>Confirm Usage</strong>.
        </AlertDescription>
      </Alert>
    </div>
  )
}
