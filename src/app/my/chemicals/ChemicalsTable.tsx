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
import { FlaskConical, Search } from "lucide-react"
import { format } from "date-fns"

type Subject = { id: number; name: string; code: string }

type ChemicalRecord = {
    id: number
    dateUsed: Date
    distributedAmount: number | null
    distributedUnit: string | null
    quantityRequested: number
    unit: string | null
    purpose: string | null
    chemicalBatch: {
        baseUnit: string
        chemical: { name: string; unit: string | null }
    }
    subject: Subject | null
    room: { name: string } | null
    recordedBy: { firstName: string | null; lastName: string | null; username: string }
}

type Props = {
    records: ChemicalRecord[]
    total: number
    pages: number
    currentPage: number
    currentSearch: string
    currentSubjectId: string
    currentDateFrom: string
    currentDateTo: string
    subjects: Subject[]
}

function formatAmount(record: ChemicalRecord): { displayed: string; baseEquivalent: string | null } {
    const amount = record.distributedAmount ?? record.quantityRequested
    const unit = record.distributedUnit ?? record.unit ?? ""
    const displayed = `${amount} ${unit}`.trim()

    // Show base equivalent if the displayed unit differs from base unit
    const baseUnit = record.chemicalBatch.baseUnit
    if (unit && baseUnit && unit.toUpperCase() !== baseUnit.toUpperCase()) {
        // Convert to base equivalent
        const conversions: Record<string, Record<string, number>> = {
            L: { ML: 1000 },
            ML: { L: 0.001 },
            KG: { G: 1000 },
            G: { KG: 0.001 },
            GAL: { ML: 3785.41, L: 3.78541 },
        }
        const factor = conversions[unit.toUpperCase()]?.[baseUnit.toUpperCase()]
        if (factor) {
            const baseAmount = amount * factor
            return { displayed, baseEquivalent: `= ${baseAmount.toLocaleString()} ${baseUnit}` }
        }
    }
    return { displayed, baseEquivalent: null }
}

export function ChemicalsTable({
    records,
    total,
    pages,
    currentPage,
    currentSearch,
    currentSubjectId,
    currentDateFrom,
    currentDateTo,
    subjects,
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
                subjectId: currentSubjectId,
                dateFrom: currentDateFrom,
                dateTo: currentDateTo,
                page: String(currentPage),
            }
            const merged = { ...base, ...updates }
            Object.entries(merged).forEach(([k, v]) => { if (v && v !== "all") params.set(k, v) })
            startTransition(() => router.push(`${pathname}?${params.toString()}`))
        },
        [router, pathname, currentSearch, currentSubjectId, currentDateFrom, currentDateTo, currentPage]
    )

    const handleSearch = () => updateParams({ search: searchValue, page: "1" })

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
                <div className="flex gap-2 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search chemical name…"
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
                    value={currentSubjectId || "all"}
                    onValueChange={(v) => updateParams({ subjectId: v, page: "1" })}
                >
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.code} — {s.name}
                            </SelectItem>
                        ))}
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

            {/* Table */}
            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
                    <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium text-lg">No chemicals received yet</p>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                        Chemicals distributed to you by Labtech will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <TooltipProvider delayDuration={300}>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead>Chemical</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Room</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Distributed By</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => {
                                        const { displayed, baseEquivalent } = formatAmount(record)
                                        const recorderName = [record.recordedBy.firstName, record.recordedBy.lastName].filter(Boolean).join(" ") || record.recordedBy.username
                                        return (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{record.chemicalBatch.chemical.name}</p>
                                                        {record.chemicalBatch.baseUnit && (
                                                            <Badge variant="outline" className="text-[10px] mt-0.5 uppercase">
                                                                {record.chemicalBatch.baseUnit}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm font-medium">{displayed}</p>
                                                        {baseEquivalent && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">({baseEquivalent})</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {(record.distributedUnit ?? record.unit ?? "—").toUpperCase()}
                                                </TableCell>
                                                <TableCell>
                                                    {record.subject ? (
                                                        <div>
                                                            <p className="text-sm font-medium">{record.subject.name}</p>
                                                            <p className="text-xs text-muted-foreground">{record.subject.code}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {record.room?.name || "—"}
                                                </TableCell>
                                                <TableCell className="max-w-[140px]">
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
                                                <TableCell className="text-sm">{recorderName}</TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">
                                                    {format(new Date(record.dateUsed), "MMM d, yyyy HH:mm")}
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
