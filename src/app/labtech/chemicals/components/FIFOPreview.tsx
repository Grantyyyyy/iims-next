'use client'

import React from 'react'
import { Loader2, AlertCircle, Package } from 'lucide-react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FIFOPreviewProps {
  batches: Array<{
    batchNumber: string
    expiryDate: Date
    amountToDeduct: number
    unit: string
    willDeplete: boolean
  }>
  loading: boolean
  error?: string
}

export function FIFOPreview({ batches, loading, error }: FIFOPreviewProps) {
  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Calculating batch preview...</span>
        </div>
      </div>
    )
  }

  // Error state - insufficient stock
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Alert variant="destructive" className="border-0 bg-transparent p-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No batches to display
  if (!batches || batches.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Batch Deduction Preview (FIFO)</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Deducting from oldest batches first
        </p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch Number</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead className="text-right">Amount to Deduct</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch, index) => (
            <TableRow 
              key={`${batch.batchNumber}-${index}`}
              className={batch.willDeplete ? 'bg-destructive/5' : ''}
            >
              <TableCell className="font-mono text-sm">
                {batch.batchNumber}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(batch.expiryDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="text-right font-medium">
                {batch.amountToDeduct.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })} {batch.unit}
              </TableCell>
              <TableCell className="text-center">
                {batch.willDeplete && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Will Deplete
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
