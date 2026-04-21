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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { LabInstanceView } from "@/actions/labtech"
import { cn } from "@/lib/utils"
import { Calendar, User, Info, AlertTriangle, Clock } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface InstancesTableProps {
    instances: LabInstanceView[]
    total: number
    pages: number
    currentPage: number
}

export function InstancesTable({ instances, total, pages, currentPage }: InstancesTableProps) {
    if (instances.length === 0) {
        return (
            <div className="p-20 text-center space-y-3">
                <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                    We couldn't find any inventory items matching your current filters. Try adjusting your search or filters.
                </p>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Available':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-none font-medium">Available</Badge>
            case 'Borrowed':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-medium">Borrowed</Badge>
            case 'Overdue':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shadow-none font-bold animate-pulse">Overdue</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getConditionBadge = (condition: string) => {
        switch (condition.toUpperCase()) {
            case 'GOOD':
                return <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><div className="h-1.5 w-1.5 rounded-full bg-green-600" />Good</div>
            case 'FAIR':
                return <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600"><div className="h-1.5 w-1.5 rounded-full bg-orange-600" />Fair</div>
            case 'POOR':
            case 'DAMAGED':
                return <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600"><div className="h-1.5 w-1.5 rounded-full bg-red-600" />{condition}</div>
            default:
                return <span className="text-xs font-medium text-muted-foreground">{condition}</span>
        }
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="relative overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30 border-b border-border/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[80px] font-bold text-foreground">Type</TableHead>
                                <TableHead className="font-bold text-foreground min-w-[200px]">Item Name</TableHead>
                                <TableHead className="font-bold text-foreground">Identifiers</TableHead>
                                <TableHead className="font-bold text-foreground">Condition</TableHead>
                                <TableHead className="font-bold text-foreground">Status</TableHead>
                                <TableHead className="font-bold text-foreground">Borrower / Due</TableHead>
                                <TableHead className="text-right font-bold text-foreground">Useful Life</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {instances.map((instance) => (
                                <TableRow key={instance.id} className="group hover:bg-muted/5 transition-colors border-border/40">
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] uppercase font-bold tracking-tight px-1.5 h-5",
                                                instance.type === 'Equipment' ? "border-purple-200 text-purple-700 bg-purple-50/50" : "border-indigo-200 text-indigo-700 bg-indigo-50/50"
                                            )}
                                        >
                                            {instance.type.substring(0, 4)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                                                {instance.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                                {instance.category || "Uncategorized"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="text-muted-foreground">INV:</span>
                                                <span className="font-mono font-bold text-primary/80">{instance.inventoryNumber}</span>
                                            </div>
                                            {instance.serialNumber && (
                                                <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="text-muted-foreground">SN:</span>
                                                    <span className="font-mono">{instance.serialNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getConditionBadge(instance.condition)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(instance.status)}
                                    </TableCell>
                                    <TableCell>
                                        {instance.currentBorrower ? (
                                            <div className="flex flex-col gap-0.5 max-w-[150px]">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium line-clamp-1">{instance.currentBorrower}</span>
                                                </div>
                                                {instance.dueDate && (
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-[10px]",
                                                        instance.status === 'Overdue' ? "text-red-600 font-bold" : "text-muted-foreground"
                                                    )}>
                                                        <Clock className="h-2.5 w-2.5" />
                                                        <span>Due: {new Date(instance.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-[10px] font-medium text-muted-foreground">
                                                {instance.usefulLife ? `${instance.usefulLife} Years` : "N/A"}
                                            </div>
                                            {instance.isPastUsefulLife && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="bg-red-50 text-red-600 p-1 rounded-full cursor-help hover:bg-red-100 transition-colors">
                                                            <AlertTriangle className="h-3 w-3" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left">
                                                        <p className="text-[10px] font-bold">Past Useful Life Warning</p>
                                                        <p className="text-[10px]">Item may require replacement or thorough inspection.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {pages > 1 && (
                    <div className="p-4 border-t bg-muted/5">
                        <PaginationComp
                            currentPage={currentPage}
                            totalPages={pages}
                        />
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}

function PaginationComp({ currentPage, totalPages }: { currentPage: number, totalPages: number }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createPageUrl = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", pageNumber.toString())
        return `${pathname}?${params.toString()}`
    }

    return (
        <Pagination className="justify-end">
            <PaginationContent>
                {currentPage > 1 && (
                    <PaginationItem>
                        <PaginationPrevious href={createPageUrl(currentPage - 1)} />
                    </PaginationItem>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and pages around current
                    if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                        return (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    href={createPageUrl(page)}
                                    isActive={page === currentPage}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                    ) {
                        return (
                            <PaginationItem key={page}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )
                    }
                    return null
                })}

                {currentPage < totalPages && (
                    <PaginationItem>
                        <PaginationNext href={createPageUrl(currentPage + 1)} />
                    </PaginationItem>
                )}
            </PaginationContent>
        </Pagination>
    )
}

