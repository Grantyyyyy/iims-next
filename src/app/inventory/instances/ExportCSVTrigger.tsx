'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Download } from 'lucide-react'
import { getInstancesCSV } from '@/actions/instances'
import { toast } from 'sonner'

interface ExportCSVTriggerProps {
    filters: any
}

export function ExportCSVTrigger({ filters }: ExportCSVTriggerProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExportCSV = async () => {
        setIsExporting(true)
        try {
            const allFilteredData = await getInstancesCSV({
                search: filters.search,
                condition: filters.condition,
                status: filters.status,
                categoryId: filters.categoryId
            })

            let csvContent = "data:text/csv;charset=utf-8,"
            csvContent += "Item Name,Category,Inventory No.,Serial No.,Condition,Status,Current Holder,Unit Cost,Purchase Date,Useful Life (years)\n"

            allFilteredData.forEach((inst: any) => {
                const status = inst.borrowRecords.length > 0 ? 'Borrowed' : 'Available'
                const holder = inst.borrowRecords.length > 0 
                    ? `${inst.borrowRecords[0].borrower.firstName} ${inst.borrowRecords[0].borrower.lastName}`
                    : 'In Storage'
                
                const row = [
                    `"${inst.item.name}"`,
                    `"${inst.item.category?.name || 'N/A'}"`,
                    `"${inst.inventoryNumber || ''}"`,
                    `"${inst.serialNumber || ''}"`,
                    `"${inst.currentCondition || 'Good'}"`,
                    `"${status}"`,
                    `"${holder}"`,
                    inst.unitCost,
                    inst.purchaseDate ? new Date(inst.purchaseDate).toLocaleDateString() : 'N/A',
                    inst.usefulLife || 'N/A'
                ].join(",")
                csvContent += row + "\n"
            })

            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `instances-audit-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Export completed')
        } catch (error) {
            toast.error('Failed to export CSV')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV} 
            disabled={isExporting}
            className="h-10 border-primary/20 hover:border-primary/50 hover:bg-primary/5 gap-2"
        >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
        </Button>
    )
}
