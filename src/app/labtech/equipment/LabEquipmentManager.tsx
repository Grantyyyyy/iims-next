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
import { Microscope, Beaker, Pipette } from 'lucide-react'

interface LabEquipmentManagerProps {
    equipment: any[]
}

export function LabEquipmentManager({ equipment }: LabEquipmentManagerProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Equipment Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Total Qty</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {equipment.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Microscope className="h-4 w-4 text-muted-foreground" />
                                        {item.name}
                                    </div>
                                </TableCell>
                                <TableCell>{item.category?.name || 'N/A'}</TableCell>
                                <TableCell>{item.model || 'N/A'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {item.instances.filter((i: any) => i.currentCondition === 'Good').length}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {equipment.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    No lab equipment found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
