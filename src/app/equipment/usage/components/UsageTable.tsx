"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { UsageRecordWithRelations } from "../actions"
import { format } from "date-fns"

interface UsageTableProps {
  records: UsageRecordWithRelations[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function UsageTable({
  records,
  currentPage,
  totalPages,
  onPageChange,
}: UsageTableProps) {
  // Format date as YYYY-MM-DD HH:mm:ss
  const formatDate = (date: Date) => {
    return format(new Date(date), "yyyy-MM-dd HH:mm:ss")
  }

  // Format user name or "Internal"
  const formatUsedBy = (usedBy: { firstName: string | null; lastName: string | null } | null) => {
    if (!usedBy) return "Internal"
    const fullName = `${usedBy.firstName || ""} ${usedBy.lastName || ""}`.trim()
    return fullName || "Internal"
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No usage records found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Used</TableHead>
              <TableHead>Chemical Name</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead className="text-right">Quantity Used</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Subject Code</TableHead>
              <TableHead>Room Name</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-mono text-sm">
                  {formatDate(record.dateUsed)}
                </TableCell>
                <TableCell className="font-medium">
                  {record.chemicalBatch.chemical.name}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {record.chemicalBatch.batchNumber}
                </TableCell>
                <TableCell className="text-right">
                  {record.quantityUsed} {record.unit || "units"}
                </TableCell>
                <TableCell>{formatUsedBy(record.usedBy)}</TableCell>
                <TableCell>
                  {record.subject?.code || "-"}
                </TableCell>
                <TableCell>
                  {record.room?.name || "-"}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {record.purpose || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
