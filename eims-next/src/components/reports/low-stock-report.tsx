import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface LowStockItem {
    name: string
    category: string
    remainingQty: number
    threshold: number
    type: string
}

interface LowStockReportProps {
    data: LowStockItem[]
}

export function LowStockReport({ data }: LowStockReportProps) {
    const getStatusBadge = (qty: number, threshold: number) => {
        const ratio = qty / threshold
        if (ratio <= 0.25) return <Badge className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
        if (ratio <= 0.5) return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Low</Badge>
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Remaining Qty</TableHead>
                        <TableHead className="text-center">Threshold</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="text-[10px]">
                                        {item.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                    {item.remainingQty}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                    {item.threshold}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(item.remainingQty, item.threshold)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                All items are well-stocked.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
