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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplet, Plus, History } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { recordChemicalUsage } from '@/actions/labtech'
import { toast } from 'sonner'

interface ChemicalManagerProps {
    chemicals: any[]
}

export function ChemicalManager({ chemicals }: ChemicalManagerProps) {
    const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<any>(null)
    const [usageData, setUsageData] = useState({
        quantityUsed: 0,
        purpose: ''
    })
    const [isPending, setIsPending] = useState(false)

    const handleRecordUsage = async () => {
        if (!selectedStock) return

        setIsPending(true)
        const result = await recordChemicalUsage({
            requestedChemicalId: selectedStock.id,
            borrowerId: 1, // Placeholder for current user ID
            quantityUsed: usageData.quantityUsed,
            purpose: usageData.purpose
        })
        setIsPending(false)

        if (result.success) {
            toast.success('Usage recorded successfully')
            setIsUsageDialogOpen(false)
            setSelectedStock(null)
            setUsageData({ quantityUsed: 0, purpose: '' })
        } else {
            toast.error(result.error || 'Failed to record usage')
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Chemical Name</TableHead>
                            <TableHead>Formula</TableHead>
                            <TableHead>Total Volume</TableHead>
                            <TableHead>Stocks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {chemicals.map((chem) => (
                            <TableRow key={chem.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Droplet className="h-4 w-4 text-blue-500" />
                                        {chem.name}
                                    </div>
                                </TableCell>
                                <TableCell><code>{chem.formula || 'N/A'}</code></TableCell>
                                <TableCell>{chem.volume} {chem.unit || 'units'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {chem.stocks.map((stock: any) => (
                                            <div key={stock.id} className="text-xs flex items-center justify-between gap-4">
                                                <span>SN: {stock.inventoryNumber} - {stock.volume} {chem.unit}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px]"
                                                    onClick={() => {
                                                        setSelectedStock(stock)
                                                        setIsUsageDialogOpen(true)
                                                    }}
                                                >
                                                    Use
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">
                                        <History className="mr-2 h-4 w-4" />
                                        History
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {chemicals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                    No chemicals found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Chemical Usage</DialogTitle>
                        <DialogDescription>
                            Recording usage for stock {selectedStock?.inventoryNumber}. Current volume: {selectedStock?.volume}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="number"
                            placeholder="Quantity Used"
                            value={usageData.quantityUsed}
                            onChange={(e) => setUsageData({ ...usageData, quantityUsed: parseFloat(e.target.value) })}
                        />
                        <Input
                            placeholder="Purpose/Experiment"
                            value={usageData.purpose}
                            onChange={(e) => setUsageData({ ...usageData, purpose: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleRecordUsage} disabled={isPending || usageData.quantityUsed <= 0}>
                            {isPending ? 'Recording...' : 'Record Usage'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
