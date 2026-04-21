'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, CheckCircle2, User, MapPin, Book, Info } from 'lucide-react'
import { CartItem } from './DistributionCart'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface DistributionConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isSubmitting: boolean
    items: CartItem[]
    details: {
        recipientName: string
        subjectCode: string
        roomName: string
        purpose: string
    }
}

export function DistributionConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    isSubmitting,
    items,
    details
}: DistributionConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Confirm Distribution</DialogTitle>
                            <DialogDescription className="text-xs font-medium mt-0.5">
                                Please review the distribution summary before proceeding.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    <User className="h-3 w-3" />
                                    Recipient
                                </div>
                                <p className="text-sm font-bold text-foreground truncate">{details.recipientName}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    <MapPin className="h-3 w-3" />
                                    Location
                                </div>
                                <p className="text-sm font-bold text-foreground truncate">{details.roomName}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    <Book className="h-3 w-3" />
                                    Subject
                                </div>
                                <p className="text-sm font-bold text-foreground truncate">{details.subjectCode}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    <Info className="h-3 w-3" />
                                    Purpose
                                </div>
                                <p className="text-sm font-medium text-foreground line-clamp-1">{details.purpose}</p>
                            </div>
                        </div>

                        {/* Items Breakdown */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                                Distribution Items ({items.length})
                            </h4>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.id} className="p-4 rounded-xl border border-border/50 bg-background shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground">{item.name}</span>
                                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold px-2.5 py-0.5">
                                                {item.quantity} {item.selectedUnit}
                                            </Badge>
                                        </div>

                                        {/* FIFO Batch Info */}
                                        <div className="space-y-1.5 pt-2 border-t border-dashed">
                                            <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground ml-1">Affected Batches</p>
                                            <div className="space-y-1">
                                                {item.batches?.map((batch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-muted/30">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-muted-foreground">#{batch.batchNumber}</span>
                                                            <span className="text-[10px] text-muted-foreground/60 italic">
                                                                Exp: {batch.expiryDate ? format(new Date(batch.expiryDate), 'MM/yyyy') : 'Never'}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold">-{batch.amountToDeduct} {batch.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-800">Final Confirmation</p>
                                <p className="text-[11px] text-amber-700 leading-relaxed">
                                    Proceeding will permanently deduct these amounts from inventory using FIFO logic. This action will be recorded and grouped as a single session.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 bg-muted/5 border-t flex-row gap-3 sm:justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6 rounded-xl font-medium border-border/60">
                        Back to Cart
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="h-11 px-10 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all active:scale-95 disabled:grayscale"
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm & Distribute'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
