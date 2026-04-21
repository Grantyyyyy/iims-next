"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { UsageFilters, type FilterState } from "./components/UsageFilters"
import { UsageTable } from "./components/UsageTable"
import { UsageSummaryStats } from "./components/UsageSummaryStats"
import { RecordUsageDialog } from "./components/RecordUsageDialog"
import { getUsageRecords, exportUsageToCSV } from "./actions"
import type { UsageRecordWithRelations } from "./actions"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

interface UsageListClientProps {
  initialRecords: UsageRecordWithRelations[]
  initialTotalPages: number
  subjects: Array<{ id: number; code: string; name: string }>
  rooms: Array<{ id: number; name: string; location: string }>
  hasPermission: boolean
}

export function UsageListClient({
  initialRecords,
  initialTotalPages,
  subjects,
  rooms,
  hasPermission,
}: UsageListClientProps) {
  const searchParams = useSearchParams()
  const [records, setRecords] = React.useState(initialRecords)
  const [totalPages, setTotalPages] = React.useState(initialTotalPages)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const [filters, setFilters] = React.useState<FilterState>({
    search: searchParams.get('search') || "",
    subjectId: null,
    roomId: null,
    dateFrom: null,
    dateTo: null,
  })

  const [currentPage, setCurrentPage] = React.useState(1)

  // Fetch records when filters or page changes
  React.useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true)
      try {
        const result = await getUsageRecords({
          search: filters.search || undefined,
          subjectId: filters.subjectId || undefined,
          roomId: filters.roomId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          page: currentPage,
          pageSize: 15,
        })
        setRecords(result.records)
        setTotalPages(result.totalPages)
      } catch (error: any) {
        console.error("Error fetching usage records:", error)
        toast.error(error.message || "Failed to fetch usage records")
        setRecords([])
        setTotalPages(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [filters, currentPage])

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    // Validate date range (max 1 year)
    if (newFilters.dateFrom && newFilters.dateTo) {
      const daysDiff = Math.floor(
        (newFilters.dateTo.getTime() - newFilters.dateFrom.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysDiff > 365) {
        toast.error("Date range cannot exceed 1 year")
        return
      }
    }

    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle export to CSV
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportUsageToCSV({
        search: filters.search || undefined,
        subjectId: filters.subjectId || undefined,
        roomId: filters.roomId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      })

      if (result.success && result.csvData && result.filename) {
        // Create a blob and trigger download
        const blob = new Blob([result.csvData], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", result.filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success("CSV exported successfully")
      } else {
        toast.error(result.error || "Failed to export CSV")
      }
    } catch (error: any) {
      console.error("Error exporting CSV:", error)
      toast.error(error.message || "Failed to export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  // Handle successful usage recording
  const handleUsageSuccess = () => {
    // Refetch records to show the new usage
    setCurrentPage(1)
    setFilters({ ...filters }) // Trigger refetch
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <UsageSummaryStats filters={filters} />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usage Records</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || records.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export to CSV"}
          </Button>
          {hasPermission && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Usage
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <UsageFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        subjects={subjects}
        rooms={rooms}
      />

      {/* Usage Table */}
      {isLoading ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Loading usage records...</p>
        </div>
      ) : (
        <UsageTable
          records={records}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Record Usage Dialog */}
      <RecordUsageDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleUsageSuccess}
      />
    </div>
  )
}
