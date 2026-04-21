"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Beaker, Package, AlertCircle, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface SummaryStatsProps {
    stats: {
        total: number
        available: number
        borrowed: number
        damaged: number
    }
}

export function SummaryStats({ stats }: SummaryStatsProps) {
    const items = [
        {
            title: "Total Instances",
            value: stats.total,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            title: "Available",
            value: stats.available,
            icon: ClipboardCheck,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-100"
        },
        {
            title: "Borrowed",
            value: stats.borrowed,
            icon: Beaker,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100"
        },
        {
            title: "Damaged/Poor",
            value: stats.damaged,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100"
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
                <Card key={item.title} className={cn("border shadow-sm", item.border)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {item.title}
                        </CardTitle>
                        <div className={cn("p-2 rounded-lg", item.bg)}>
                            <item.icon className={cn("h-4 w-4", item.color)} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
