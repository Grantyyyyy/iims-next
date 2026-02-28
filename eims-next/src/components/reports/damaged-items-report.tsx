'use client'

import { useState, useTransition } from 'react'
import { DamagedItemRow, downloadDamagedItemsPDF, printAllDamagedItems, printSelectedDamagedItems } from '@/lib/reports/damaged-items-pdf'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from 'date-fns'
import { Printer, Download, Search, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface DamagedItemsReportProps {
    data: {
        items: DamagedItemRow[]
        total: number
        pages: number
    }
    categories: { id: number, name: string }[]
    user: { firstName: string, lastName: string }
    userRole: string
    isDean: boolean
}

export function DamagedItemsReport({ data, categories, user, userRole, isDean }: DamagedItemsReportProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [search, setSearch] = useState(searchParams.get('search') || '')

    const updateFilter = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === '') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        params.set('page', '1') // Reset to first page on filter change
        router.push(`?${params.toString()}`)
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === data.items.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(data.items.map(i => i.id))
        }
    }

    const toggleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const getConditionColor = (condition: string) => {
        const c = condition.toLowerCase()
        if (c === 'damaged') return 'bg-red-100 text-red-700 border-red-200'
        if (c === 'poor') return 'bg-orange-100 text-orange-700 border-orange-200'
        if (c === 'fair') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        return 'bg-green-100 text-green-700 border-green-200'
    }

    const handlePrintAll = () => {
        printAllDamagedItems(data.items, { user, userRole })
    }

    const handlePrintSelected = () => {
        printSelectedDamagedItems(data.items, selectedIds, { user, userRole })
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-end md:items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search inventory..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateFilter({ search })}
                        />
                    </div>

                    <Select
                        value={searchParams.get('category') || 'all'}
                        onValueChange={(v) => updateFilter({ category: v === 'all' ? null : v })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={searchParams.get('value') || 'all'}
                        onValueChange={(v) => updateFilter({ value: v === 'all' ? null : v })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Value Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Values</SelectItem>
                            <SelectItem value="high">High Value (≥₱5000)</SelectItem>
                            <SelectItem value="low">Low Value (&lt;₱5000)</SelectItem>
                        </SelectContent>
                    </Select>

                    {(search || searchParams.get('category') || searchParams.get('value')) && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setSearch('')
                                router.push('?tab=damaged')
                            }}
                            className="text-muted-foreground"
                        >
                            <XCircle className="h-4 w-4 mr-1" /> Clear
                        </Button>
                    )}
                </div>

                {!isDean && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={selectedIds.length === 0}
                            onClick={handlePrintSelected}
                        >
                            <Printer className="h-4 w-4 mr-2" /> Print Selected
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrintAll}
                            disabled={data.items.length === 0}
                        >
                            <Printer className="h-4 w-4 mr-2" /> Print All
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white relative">
                 {isPending && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox 
                                    checked={data.items.length > 0 && selectedIds.length === data.items.length} 
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead className="w-[300px]">Item Description</TableHead>
                            <TableHead>Inventory No.</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Previous Borrower</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.length > 0 ? (
                            data.items.map((row) => (
                                <TableRow 
                                    key={row.id} 
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/dashboard/items/${row.id}`)}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox 
                                            checked={selectedIds.includes(row.id)}
                                            onCheckedChange={() => toggleSelectRow(row.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-nowrap">
                                        ₱{row.unitCost.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{row.quantity}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{row.itemName}</span>
                                            {row.description && <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>}
                                            <span className="text-[10px] text-blue-600 font-mono mt-0.5">SN: {row.serialNumber || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{row.inventoryNumber}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${getConditionColor(row.currentCondition)} font-bold text-[10px]`}>
                                            {row.currentCondition.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {row.lastBorrowRecord ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="secondary" className="w-fit text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                                    {row.lastBorrowRecord.borrowerName}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {row.lastBorrowRecord.returnDate ? format(new Date(row.lastBorrowRecord.returnDate), 'MMM d, yyyy') : 'No Return'}
                                                    {row.lastBorrowRecord.roomName && ` • ${row.lastBorrowRecord.roomName}`}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No record</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No damaged items found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <p className="text-sm text-muted-foreground">
                    Showing {data.items.length} of {data.total} records
                </p>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={searchParams.get('page') === '1' || !searchParams.get('page')}
                        onClick={() => {
                            const p = parseInt(searchParams.get('page') || '1') - 1
                            updateFilter({ page: p.toString() })
                        }}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {searchParams.get('page') || '1'} of {data.pages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={parseInt(searchParams.get('page') || '1') >= (data.pages || 1)}
                        onClick={() => {
                            const p = parseInt(searchParams.get('page') || '1') + 1
                            updateFilter({ page: p.toString() })
                        }}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
