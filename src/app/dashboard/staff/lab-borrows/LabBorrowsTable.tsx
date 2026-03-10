"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Microscope, Search } from "lucide-react"
import { format, isBefore } from "date-fns"

type LabBorrowRecord = {
    id: number
    borrowDate: Date
    dueDate: Date | null
    returnDate: Date | null
    purpose: string | null
    equipmentInstance: {
        inventoryNumber: string
        currentCondition: string | null
        equipment: {
            name: string
            category: { name: string } | null
        }
    } | null
    apparatusInstance: {
        inventoryNumber: string
        currentCondition: string | null
        apparatus: {
            name: string
            category: { name: string } | null
        }
    } | null
    room: { name: string } | null
}

type Props = {
    records: LabBorrowRecord[]
    total: number
    pages: number
    currentPage: number
    currentSearch: string
    currentStatus: string
    currentType: string
    currentDateFrom: string
    currentDateTo: string
}

const conditionColor: Record<string, string> = {
    Good: "bg-green-100 text-green-800 border-green-200",
    Excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Poor: "bg-orange-100 text-orange-800 border-orange-200",
    Damaged: "bg-red-100 text-red-800 border-red-200",
}

function getBorrowStatus(record: LabBorrowRecord): "Active" | "Returned" | "Overdue" {
    if (record.returnDate) return "Returned"
    if (record.dueDate && isBefore(new Date(record.dueDate), new Date())) return "Overdue"
    return "Active"
}

function getRecordType(record: LabBorrowRecord): "Equipment" | "Apparatus" {
    return record.equipmentInstance ? "Equipment" : "Apparatus"
}

function getItemName(record: LabBorrowRecord): string {
    return record.equipmentInstance?.equipment.name || record.apparatusInstance?.apparatus.name || "—"
}

function getCategoryName(record: LabBorrowRecord): string | null {
    return record.equipmentInstance?.equipment.category?.name || record.apparatusInstance?.apparatus.category?.name || null
}

function getInventoryNumber(record: LabBorrowRecord): string {
    return record.equipmentInstance?.inventoryNumber || record.apparatusInstance?.inventoryNumber || "—"
}

function getCondition(record: LabBorrowRecord): string {
    return record.equipmentInstance?.currentCondition || record.apparatusInstance?.currentCondition || "Good"
}

export function LabBorrowsTable({
    records,
    total,
    pages,
    currentPage,
    currentSearch,
    currentStatus,
    currentType,
    currentDateFrom,
    currentDateTo,
}: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const [searchValue, setSearchValue] = useState(currentSearch)
    const [, startTransition] = useTransition()

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams()
            const base = {
                search: currentSearch,
                status: currentStatus,
                type: currentType,
                dateFrom: currentDateFrom,
                dateTo: currentDateTo,
                page: String(currentPage),
            }
            const merged = { ...base, ...updates }
            Object.entries(merged).forEach(([k, v]) => { if (v && v !== "all") params.set(k, v) })
            startTransition(() => router.push(`${pathname}?${params.toString()}`))
        },
        [router, pathname, currentSearch, currentStatus, currentType, currentDateFrom, currentDateTo, currentPage]
    )

    const handleSearch = () => updateParams({ search: searchValue, page: "1" })
    const statusTabs = ["all", "active", "returned", "overdue"]

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
                <div className="flex gap-2 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search item name or inv. no.…"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="pl-8"
                        />
                    </div>
                    <Button variant="outline" onClick={handleSearch}>
                        Search
                    </Button>
                </div>
                <Select
                    value={currentType || "all"}
                    onValueChange={(v) => updateParams({ type: v, page: "1" })}
                >
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="apparatus">Apparatus</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2 items-center">
                    <Input
                        type="date"
                        value={currentDateFrom}
                        onChange={(e) => updateParams({ dateFrom: e.target.value, page: "1" })}
                        className="w-36 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">→</span>
                    <Input
                        type="date"
                        value={currentDateTo}
                        onChange={(e) => updateParams({ dateTo: e.target.value, page: "1" })}
                        className="w-36 text-sm"
                    />
                </div>
            </div>

            {/* Status tabs */}
            <Tabs value={currentStatus || "all"} onValueChange={(v) => updateParams({ status: v, page: "1" })}>
                <TabsList>
                    {statusTabs.map((s) => (
                        <TabsTrigger key={s} value={s} className="capitalize">
                            {s}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Table */}
            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
                    <Microscope className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium text-lg">You have no lab borrows</p>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                        Equipment and apparatus borrowed from Labtech will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <TooltipProvider delayDuration={300}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead>Type</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Inventory No.</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Room</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Borrow Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Return Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => {
                                        const status = getBorrowStatus(record)
                                        const type = getRecordType(record)
                                        const condition = getCondition(record)
                                        const isOverdue = status === "Overdue"
                                        const category = getCategoryName(record)

                                        return (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-medium ${type === "Equipment"
                                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                                : "bg-green-100 text-green-800 border-green-200"
                                                            }`}
                                                    >
                                                        {type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{getItemName(record)}</p>
                                                        {category && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs">{getInventoryNumber(record)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${conditionColor[condition] || "bg-gray-100 text-gray-700"}`}
                                                    >
                                                        {condition}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{record.room?.name || "—"}</TableCell>
                                                <TableCell className="max-w-[150px]">
                                                    {record.purpose ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <p className="text-sm truncate cursor-default">
                                                                    {record.purpose.slice(0, 40)}
                                                                    {record.purpose.length > 40 && "…"}
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-xs">
                                                                {record.purpose}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">
                                                    {format(new Date(record.borrowDate), "MMM d, yyyy HH:mm")}
                                                </TableCell>
                                                <TableCell className={`text-sm whitespace-nowrap ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                                    {record.dueDate ? format(new Date(record.dueDate), "MMM d, yyyy") : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">
                                                    {record.returnDate ? format(new Date(record.returnDate), "MMM d, yyyy") : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-medium ${status === "Active"
                                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                                : status === "Returned"
                                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                                    : "bg-red-100 text-red-800 border-red-200"
                                                            }`}
                                                    >
                                                        {status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>

                    {pages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {total} record{total !== 1 ? "s" : ""} found
                            </p>
                            <Pagination className="w-auto">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => updateParams({ page: String(Math.max(1, currentPage - 1)) })}
                                            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                                        let page: number
                                        if (pages <= 5) page = i + 1
                                        else if (currentPage <= 3) page = i + 1
                                        else if (currentPage >= pages - 2) page = pages - 4 + i
                                        else page = currentPage - 2 + i
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => updateParams({ page: String(page) })}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => updateParams({ page: String(Math.min(pages, currentPage + 1)) })}
                                            className={currentPage >= pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
