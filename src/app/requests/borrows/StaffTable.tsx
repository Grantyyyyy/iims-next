'use client'

import React, { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

interface StaffTableProps {
    type: 'BORROW' | 'DISTRIBUTION'
    records: any[]
}

const ITEMS_PER_PAGE = 10

export function StaffTable({ type, records }: StaffTableProps) {
    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE)
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return records.slice(start, start + ITEMS_PER_PAGE)
    }, [records, currentPage])

    if (records.length === 0) {
        return (
            <div className="text-center py-12 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No records found.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {type === 'BORROW' ? (
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Borrow Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Received Date</TableHead>
                                <TableHead>Received By</TableHead>
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {paginatedRecords.map((record) => (
                            <TableRow key={record.id}>
                                {type === 'BORROW' ? (
                                    <>
                                        <TableCell className="font-medium">
                                            {record.itemInstance?.item?.name}
                                        </TableCell>
                                        <TableCell>{record.quantity}</TableCell>
                                        <TableCell>{record.room?.name || '—'}</TableCell>
                                        <TableCell>
                                            {new Date(record.borrowDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {record.duration
                                                ? new Date(
                                                    new Date(record.borrowDate).getTime() +
                                                    record.duration * 24 * 60 * 60 * 1000
                                                ).toLocaleDateString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {record.returnRecord ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    Returned
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">Active</Badge>
                                            )}
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell className="font-medium">
                                            {record.itemInstance?.item?.name}
                                        </TableCell>
                                        <TableCell>{record.quantity}</TableCell>
                                        <TableCell>{record.room?.name || '—'}</TableCell>
                                        <TableCell>
                                            {new Date(record.distributedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {record.distributedBy?.username || '—'}
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(records.length, currentPage * ITEMS_PER_PAGE)} of {records.length}
                    </div>
                    <Pagination className="w-auto flex-1 flex justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(page)}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
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

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}
