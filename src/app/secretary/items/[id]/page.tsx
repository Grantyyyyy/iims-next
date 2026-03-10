import { getItemDetails } from '@/app/actions/secretary'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, Package, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddInventoryButton } from './AddInventoryButton'
import { requirePermission } from '@/lib/permissions'

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const itemId = parseInt(id)
    if (isNaN(itemId)) notFound()

    const { roles } = await requirePermission('view:items')
    const isDean = roles.includes('DEAN')

    const item = await getItemDetails(itemId)
    if (!item) notFound()

    const isConsumable = item.itemType === 'Consumables'

    // Flatten all batches from all instances
    const allBatches = item.instances.flatMap((inst) => inst.consumableBatches || [])

    return (
        <div className="space-y-6">
            {/* Breadcrumb / Back */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/secretary/items">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Inventory
                    </Link>
                </Button>
                <AddInventoryButton
                    itemId={item.id}
                    instanceId={item.instances[0]?.id ?? 0}
                    itemType={item.itemType}
                    itemName={item.name}
                    isReadOnly={isDean}
                />
            </div>

            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl flex items-center gap-2">
                                {isConsumable
                                    ? <Package className="h-6 w-6 text-muted-foreground" />
                                    : <Layers className="h-6 w-6 text-muted-foreground" />
                                }
                                {item.name}
                            </CardTitle>
                            <CardDescription>
                                {item.category?.name || 'No Category'} &mdash; {item.model || 'No Model'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={isConsumable ? 'secondary' : 'outline'}>
                                {item.itemType}
                            </Badge>
                            <Badge variant="default" className="text-base px-3 py-1">
                                {item.quantity} {isConsumable ? 'units remaining' : 'instance(s)'}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Detail Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isConsumable ? 'Stock Batches' : 'Physical Instances'}
                    </CardTitle>
                    <CardDescription>
                        {isConsumable
                            ? 'All stock batches for this consumable item, ordered oldest to newest (FIFO).'
                            : 'All physical units registered for this item.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isConsumable ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch No.</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead>Original Qty</TableHead>
                                    <TableHead>Remaining</TableHead>
                                    <TableHead>Last Distributed</TableHead>
                                    <TableHead>Unit Cost</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allBatches.length > 0 ? allBatches.map((batch) => (
                                    <TableRow
                                        key={batch.id}
                                        className={batch.remainingQty === 0 ? 'opacity-40' : ''}
                                    >
                                        <TableCell className="font-mono font-medium">
                                            {batch.batchNumber}
                                        </TableCell>
                                        <TableCell>
                                            {batch.purchaseDate
                                                ? format(new Date(batch.purchaseDate), 'PP')
                                                : '—'}
                                        </TableCell>
                                        <TableCell>{batch.originalQty}</TableCell>
                                        <TableCell>
                                            {batch.remainingQty === 0 ? (
                                                <Badge variant="destructive">Exhausted</Badge>
                                            ) : batch.remainingQty === batch.originalQty ? (
                                                <Badge variant="default">{batch.remainingQty} full</Badge>
                                            ) : (batch.remainingQty / batch.originalQty) <= 0.1 ? (
                                                <Badge variant="destructive">{batch.remainingQty} low</Badge>
                                            ) : (
                                                <Badge variant="secondary">{batch.remainingQty} left</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {batch.distributionRecords?.[0]?.recipient ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {batch.distributionRecords[0].recipient.firstName} {batch.distributionRecords[0].recipient.lastName}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {format(new Date(batch.distributionRecords[0].distributedAt), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>₱{batch.unitCost.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {format(new Date(batch.addedAt), 'PP')}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {batch.notes || '—'}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No stock batches added yet. Use &quot;Add Stock&quot; to add inventory.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Inventory No.</TableHead>
                                    <TableHead>Serial No.</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Current User</TableHead>
                                    <TableHead>Previous User</TableHead>
                                    <TableHead>Unit Cost</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead>Useful Life</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {item.instances.length > 0 ? item.instances.map((instance) => {
                                    // Merge and sort all history (Distributions and Borrows)
                                    const history = [
                                        ...(instance.distributionRecords || []).map(d => ({
                                            user: d.recipient,
                                            date: d.distributedAt,
                                            type: 'Distribution' as const,
                                            isReturned: false
                                        })),
                                        ...(instance.borrowRecords || []).map(b => ({
                                            user: b.borrower,
                                            date: b.borrowDate,
                                            type: 'Borrow' as const,
                                            isReturned: !!b.returnRecord
                                        }))
                                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                                    // If the most recent record is a RETURNED borrow, then item is in storage
                                    const isCurrentlyStored = history.length === 0 || (history[0].type === 'Borrow' && history[0].isReturned)

                                    const currentUser = isCurrentlyStored ? null : history[0]
                                    const previousUser = isCurrentlyStored ? history[0] : history[1]

                                    return (
                                        <TableRow key={instance.id}>
                                            <TableCell className="font-mono font-medium">
                                                {instance.inventoryNumber || '—'}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {instance.serialNumber || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    instance.currentCondition === 'Good' ? 'default' :
                                                        instance.currentCondition === 'Fair' ? 'secondary' :
                                                            'destructive'
                                                }>
                                                    {instance.currentCondition || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {currentUser?.user ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {currentUser.user.firstName} {currentUser.user.lastName}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 leading-none font-normal">
                                                                {currentUser.type === 'Borrow' ? 'Borrowed' : 'Assigned'}
                                                            </Badge>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                {format(new Date(currentUser.date), 'MMM d, yyyy')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-sm">In Storage</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {previousUser?.user ? (
                                                    <div className="flex flex-col opacity-60">
                                                        <span className="text-sm">
                                                            {previousUser.user.firstName} {previousUser.user.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {format(new Date(previousUser.date), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">₱{instance.unitCost.toFixed(2)}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {instance.purchaseDate
                                                    ? format(new Date(instance.purchaseDate), 'PP')
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {instance.usefulLife ? `${instance.usefulLife} yr(s)` : '—'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No instances added yet. Use &quot;Add Instance&quot; to add inventory.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
