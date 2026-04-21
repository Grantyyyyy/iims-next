"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, Filter, Download, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { getLabInstancesCSV } from "@/actions/labtech"
import { toast } from "sonner"

interface InstancesFilterProps {
    currentFilters: {
        search?: string
        type?: 'Equipment' | 'Apparatus'
        condition?: string
        status?: 'Available' | 'Borrowed' | 'Overdue'
        categoryId?: number
    }
}

export function InstancesFilter({ currentFilters }: InstancesFilterProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [search, setSearch] = React.useState(currentFilters.search || "")
    const debouncedSearch = useDebounce(search, 500)
    const [isExporting, setIsExporting] = React.useState(false)

    // Update search params when filters change
    const updateParams = React.useCallback((name: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(name, value)
        } else {
            params.delete(name)
        }
        params.set("page", "1") // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`)
    }, [pathname, router, searchParams])

    React.useEffect(() => {
        if (debouncedSearch !== (currentFilters.search || "")) {
            updateParams("search", debouncedSearch || null)
        }
    }, [debouncedSearch, currentFilters.search, updateParams])

    const clearFilters = () => {
        setSearch("")
        router.push(pathname)
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const data = await getLabInstancesCSV({
                search: currentFilters.search,
                type: currentFilters.type,
                condition: currentFilters.condition,
                status: currentFilters.status,
                categoryId: currentFilters.categoryId
            })

            if (data.length === 0) {
                toast.error("No data to export")
                return
            }

            // Simple CSV generation
            const headers = ["Type", "Name", "Inventory #", "Serial #", "Condition", "Status", "Borrower", "Due Date"]
            const csvContent = [
                headers.join(","),
                ...data.map(row => [
                    row.type,
                    `"${row.name.replace(/"/g, '""')}"`,
                    row.inventoryNumber,
                    row.serialNumber || "N/A",
                    row.condition,
                    row.status,
                    row.currentBorrower || "N/A",
                    row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "N/A"
                ].join(","))
            ].join("\n")

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const link = document.createElement("a")
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `lab-instances-audit-${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Export successful")
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export data")
        } finally {
            setIsExporting(false)
        }
    }

    const hasActiveFilters = currentFilters.search || currentFilters.type || currentFilters.condition || currentFilters.status || currentFilters.categoryId

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-lg bg-background border-border/50 focus-visible:ring-primary/30"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            <Select
                value={currentFilters.type || "all"}
                onValueChange={(v) => updateParams("type", v === "all" ? null : v)}
            >
                <SelectTrigger className="w-[140px] h-10 rounded-lg border-border/50 bg-background">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Apparatus">Apparatus</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={currentFilters.status || "all"}
                onValueChange={(v) => updateParams("status", v === "all" ? null : v)}
            >
                <SelectTrigger className="w-[140px] h-10 rounded-lg border-border/50 bg-background">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Borrowed">Borrowed</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={currentFilters.condition || "all"}
                onValueChange={(v) => updateParams("condition", v === "all" ? null : v)}
            >
                <SelectTrigger className="w-[140px] h-10 rounded-lg border-border/50 bg-background">
                    <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                    Clear
                </Button>
            )}

            <div className="flex-1" />

            <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="h-10 border-border/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
            >
                {isExporting ? (
                    <span className="flex items-center gap-2">
                        <Download className="h-4 w-4 animate-bounce" />
                        Exporting...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </span>
                )}
            </Button>
        </div>
    )
}
