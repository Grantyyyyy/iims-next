'use client'

import React, { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processRequest } from '@/actions/requests'
import { toast } from 'sonner'
import { ArrowLeftRight, RefreshCcw, Trash2, Check, X } from 'lucide-react'

interface RequestBoardProps {
    transfers: any[]
    replaces: any[]
    disposals: any[]
}

export function RequestBoard({ transfers, replaces, disposals }: RequestBoardProps) {
    const [isPending, setIsPending] = useState(false)

    const handleProcess = async (type: 'transfer' | 'replace' | 'dispose', id: number, status: 'APPROVED' | 'REJECTED') => {
        setIsPending(true)
        const result = await processRequest(type, id, status)
        setIsPending(false)

        if (result.success) {
            toast.success(`Request ${status.toLowerCase()} successfully`)
        } else {
            toast.error(result.error || 'Failed to process request')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
            case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
            case 'PENDING': return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <Tabs defaultValue="transfers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transfers">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Transfers
                </TabsTrigger>
                <TabsTrigger value="replaces">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Replacements
                </TabsTrigger>
                <TabsTrigger value="disposals">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disposals
                </TabsTrigger>
            </TabsList>

            <TabsContent value="transfers" className="mt-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transfers.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        {req.itemInstance.item.name}
                                        <div className="text-xs text-muted-foreground">SN: {req.itemInstance.serialNumber || 'N/A'}</div>
                                    </TableCell>
                                    <TableCell>{req.requestedBy.username}</TableCell>
                                    <TableCell>{req.newAssignee.username}</TableCell>
                                    <TableCell>{req.newLocation.name}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600" onClick={() => handleProcess('transfer', req.id, 'APPROVED')}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => handleProcess('transfer', req.id, 'REJECTED')}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="replaces" className="mt-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item to Replace</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {replaces.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        {req.itemInstance.item.name}
                                    </TableCell>
                                    <TableCell>{req.requestedBy.username}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{req.replacementReason}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleProcess('replace', req.id, 'APPROVED')}>Approve</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleProcess('replace', req.id, 'REJECTED')}>Reject</Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="disposals" className="mt-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item to Dispose</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {disposals.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        {req.itemInstance.item.name}
                                    </TableCell>
                                    <TableCell>{req.requestedBy.username}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{req.disposalReason}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleProcess('dispose', req.id, 'APPROVED')}>Approve</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleProcess('dispose', req.id, 'REJECTED')}>Reject</Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
        </Tabs>
    )
}
