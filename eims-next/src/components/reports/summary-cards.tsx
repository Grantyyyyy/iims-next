import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, AlertCircle, Package, CalendarClock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface SummaryCardsProps {
    stats: {
        activeBorrows: number
        damagedItems: number
        lowStockAlerts: number
        nearingEndOfLife: number
    } | null
    loading: boolean
}

export function SummaryCards({ stats, loading }: SummaryCardsProps) {
    if (loading || !stats) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const cards = [
        {
            title: "Active Borrows",
            value: stats.activeBorrows,
            label: "Items currently lent out",
            icon: ClipboardList,
            color: "text-blue-500",
        },
        {
            title: "Damaged Items",
            value: stats.damagedItems,
            label: "Critical maintenance required",
            icon: AlertCircle,
            color: "text-red-500",
        },
        {
            title: "Low Stock Alerts",
            value: stats.lowStockAlerts,
            label: "Items below safe threshold",
            icon: Package,
            color: "text-orange-500",
        },
        {
            title: "Nearing End of Life",
            value: stats.nearingEndOfLife,
            label: "Replacement needed in <1y",
            icon: CalendarClock,
            color: "text-yellow-500",
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color || 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
