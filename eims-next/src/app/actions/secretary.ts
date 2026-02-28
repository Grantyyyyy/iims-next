'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CartItemSchema = z.object({
    itemInstanceId: z.number(),
    itemId: z.number(),
    itemName: z.string(),
    inventoryNumber: z.string().nullable(),
    itemType: z.enum(['CONSUMABLE', 'NON_CONSUMABLE']),
    quantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive()
})

export type CartItem = z.infer<typeof CartItemSchema>

const distributeItemsSchema = z.object({
    items: z.array(CartItemSchema).min(1, 'Cart cannot be empty'),
    recipientUserId: z.number(),
    roomId: z.number(),
    purpose: z.string().min(1, 'Purpose is required'),
    dueDate: z.string().optional().nullable()
})

const addConsumableStockSchema = z.object({
    itemId: z.number(),
    itemInstanceId: z.number(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitCost: z.number().min(0, 'Unit cost must be positive'),
    purchaseDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
})

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getUsers() {
    await requirePermission('manage:items')
    return await prisma.user.findMany({
        orderBy: { firstName: 'asc' },
        where: { isActive: true },
        include: { department: true }
    })
}

export async function getRooms() {
    await requirePermission('manage:items')
    return await prisma.room.findMany({
        orderBy: { name: 'asc' },
        include: { department: true }
    })
}

export async function getAvailableItems() {
    await requirePermission('manage:items')

    // We only fetch ItemInstances that have available quantity (for Consumables)
    // or are non-consumable and not currently borrowed.
    const instances = await prisma.itemInstance.findMany({
        where: {
            OR: [
                {
                    item: { itemType: 'Consumables' },
                    quantity: { gt: 0 }
                },
                {
                    item: { itemType: 'Non-Consumables' },
                    borrowRecords: {
                        none: {
                            returnRecord: null // means currently borrowed
                        }
                    } // implies NOT currently borrowed
                }
            ]
        },
        include: {
            item: {
                include: { category: true }
            }
        },
        orderBy: { item: { name: 'asc' } }
    })

    return instances
}

export async function getItemDetails(itemId: number) {
    await requirePermission('manage:items')
    try {
        return await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                category: true,
                instances: {
                    include: {
                        consumableBatches: {
                            include: {
                                distributionRecords: {
                                    include: { recipient: true },
                                    orderBy: { distributedAt: 'desc' },
                                    take: 1
                                }
                            },
                            orderBy: { addedAt: 'asc' }
                        },
                        distributionRecords: {
                            include: { recipient: true },
                            orderBy: { distributedAt: 'desc' }
                        },
                        borrowRecords: {
                            include: {
                                borrower: true,
                                returnRecord: true
                            },
                            orderBy: { borrowDate: 'desc' },
                            take: 5
                        }
                    }
                }
            }
        })
    } catch (error) {
        console.error('Error fetching item details:', error)
        return null
    }
}

export async function searchStaffUsers(query: string) {
    await requirePermission('manage:items')
    if (!query || query.length < 2) return []

    try {
        return await prisma.user.findMany({
            where: {
                roles: { some: { role: { name: 'STAFF' } } },
                isActive: true,
                OR: [
                    { firstName: { contains: query } },
                    { lastName: { contains: query } }
                ]
            },
            take: 8,
            include: { department: true }
        })
    } catch (error) {
        console.error('Error searching staff users:', error)
        return []
    }
}

export async function searchRooms(query: string, departmentId: number) {
    await requirePermission('manage:items')
    if (!query || query.length < 2) return []

    try {
        return await prisma.room.findMany({
            where: {
                departmentId: departmentId,
                OR: [
                    { name: { contains: query } },
                    { location: { contains: query } }
                ]
            },
            take: 8,
            include: { department: true }
        })
    } catch (error) {
        console.error('Error searching rooms:', error)
        return []
    }
}

export async function getRecipientActiveItems(userId: number) {
    await requirePermission('manage:items')

    try {
        const activeBorrows = await prisma.borrowRecord.findMany({
            where: {
                borrowerId: userId,
                returnRecord: null
            },
            include: {
                itemInstance: {
                    include: { item: true }
                }
            }
        })

        const distributions = await prisma.distributionRecord.findMany({
            where: { recipientId: userId },
            include: {
                itemInstance: {
                    include: { item: true }
                }
            }
        })

        return {
            borrows: activeBorrows,
            distributions: distributions
        }
    } catch (error) {
        console.error('Error fetching recipient active items:', error)
        return { borrows: [], distributions: [] }
    }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function distributeItems(data: {
    items: CartItem[]
    recipientUserId: number
    roomId: number
    purpose: string
    dueDate?: string | null
}) {
    const { user } = await requirePermission('manage:items')

    const validated = distributeItemsSchema.safeParse(data)
    if (!validated.success) {
        return { error: validated.error.issues[0]?.message || 'Invalid input data' }
    }

    const payload = validated.data

    try {
        // Verify borrower is active
        const borrower = await prisma.user.findUnique({
            where: { id: payload.recipientUserId },
            select: { isActive: true }
        })

        if (!borrower || !borrower.isActive) {
            return { error: 'Selected borrower is no longer active' }
        }

        const result = await prisma.$transaction(async (tx) => {
            let distributed = 0
            let borrowed = 0

            for (const cartItem of payload.items) {
                if (cartItem.itemType === 'CONSUMABLE') {
                    // 1. Fetch all ConsumableBatch ordered by addedAt ASC where remainingQty > 0
                    const batches = await tx.consumableBatch.findMany({
                        where: {
                            itemInstanceId: cartItem.itemInstanceId,
                            remainingQty: { gt: 0 }
                        },
                        orderBy: { addedAt: 'asc' }
                    })

                    // Calculate total available stock across all batches
                    const totalAvailable = batches.reduce((sum, b) => sum + b.remainingQty, 0)

                    if (totalAvailable < cartItem.quantity) {
                        throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${cartItem.quantity}`)
                    }

                    // 2. Deduct requested quantity across batches (FIFO)
                    let remainingToDeduct = cartItem.quantity
                    for (const batch of batches) {
                        if (remainingToDeduct <= 0) break

                        const deductAmount = Math.min(batch.remainingQty, remainingToDeduct)

                        // Deduct from batch
                        await tx.consumableBatch.update({
                            where: { id: batch.id },
                            data: { remainingQty: { decrement: deductAmount } }
                        })

                        // Create DistributionRecord for this specific batch
                        await tx.distributionRecord.create({
                            data: {
                                itemInstanceId: cartItem.itemInstanceId,
                                recipientId: payload.recipientUserId,
                                roomId: payload.roomId,
                                quantity: deductAmount,
                                purpose: payload.purpose,
                                distributedById: user.id,
                                batchId: batch.id
                            }
                        })

                        remainingToDeduct -= deductAmount
                    }

                    // 3 & 4. Recalculate ItemInstance and Item quantity
                    // The easiest and safest way is to read the sum of remainingQty across all batches for that instance
                    const updatedBatches = await tx.consumableBatch.findMany({
                        where: { itemInstanceId: cartItem.itemInstanceId }
                    })
                    const newTotalQty = updatedBatches.reduce((sum, b) => sum + b.remainingQty, 0)

                    await tx.itemInstance.update({
                        where: { id: cartItem.itemInstanceId },
                        data: { quantity: newTotalQty }
                    })

                    // We need to fetch all item instances for the parent item to recalculate total item quantity
                    const allInstances = await tx.itemInstance.findMany({
                        where: { itemId: cartItem.itemId }
                    })
                    const totalParentQty = allInstances.reduce((sum, inst) => sum + inst.quantity, 0)

                    await tx.item.update({
                        where: { id: cartItem.itemId },
                        data: { quantity: totalParentQty }
                    })

                    distributed++
                } else {
                    // NON_CONSUMABLE
                    // 1. Verify instance is not currently borrowed
                    const activeBorrow = await tx.borrowRecord.findFirst({
                        where: {
                            itemInstanceId: cartItem.itemInstanceId,
                            returnRecord: null
                        }
                    })

                    if (activeBorrow) {
                        throw new Error(`Item ${cartItem.itemName} (${cartItem.inventoryNumber}) is currently borrowed`)
                    }

                    // 2. Get previousUserId from last BorrowRecord for this instance
                    const lastBorrow = await tx.borrowRecord.findFirst({
                        where: { itemInstanceId: cartItem.itemInstanceId },
                        orderBy: { borrowDate: 'desc' }
                    })

                    const previousUserId = lastBorrow?.borrowerId || null

                    // Parse due date if provided
                    const durationInMs = payload.dueDate ? new Date(payload.dueDate).getTime() - Date.now() : null
                    const durationInDays = durationInMs && durationInMs > 0 ? Math.ceil(durationInMs / (1000 * 60 * 60 * 24)) : null

                    // 3. Create BorrowRecord
                    await tx.borrowRecord.create({
                        data: {
                            itemInstanceId: cartItem.itemInstanceId,
                            borrowerId: payload.recipientUserId,
                            previousUserId,
                            roomId: payload.roomId,
                            purpose: payload.purpose,
                            quantity: 1,
                            duration: durationInDays
                        }
                    })

                    borrowed++
                }
            }

            return { distributed, borrowed }
        })

        revalidatePath('/secretary/distribute')
        revalidatePath('/secretary/records')

        return {
            success: true,
            distributed: result.distributed,
            borrowed: result.borrowed
        }

    } catch (err: any) {
        console.error(err)
        return { error: err.message || 'Failed to process distribution' }
    }
}

export async function addConsumableStock(data: z.infer<typeof addConsumableStockSchema>) {
    const { user } = await requirePermission('manage:items')

    const validated = addConsumableStockSchema.safeParse(data)
    if (!validated.success) {
        return { error: validated.error.issues[0]?.message || 'Invalid input data' }
    }

    const payload = validated.data

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Count existing batches to generate the padded increment
            const batchCount = await tx.consumableBatch.count({
                where: { itemInstanceId: payload.itemInstanceId }
            })

            const batchIncrement = (batchCount + 1).toString().padStart(3, '0')
            const batchNumber = `BATCH-${payload.itemId}-${batchIncrement}`

            // 1. Create ConsumableBatch
            const batch = await tx.consumableBatch.create({
                data: {
                    itemInstanceId: payload.itemInstanceId,
                    batchNumber: batchNumber,
                    originalQty: payload.quantity,
                    remainingQty: payload.quantity,
                    unitCost: payload.unitCost,
                    purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : null,
                    notes: payload.notes,
                    addedById: user.id
                }
            })

            // 2. Recalculate ItemInstance quantity
            await tx.itemInstance.update({
                where: { id: payload.itemInstanceId },
                data: { quantity: { increment: payload.quantity } }
            })

            // 3. Recalculate parent Item quantity
            const item = await tx.item.update({
                where: { id: payload.itemId },
                data: { quantity: { increment: payload.quantity } }
            })

            return { item, batch }
        })

        revalidatePath('/secretary/inventory')
        revalidatePath(`/secretary/inventory/${payload.itemId}`)

        return {
            success: true,
            message: `Batch added. Total stock: ${result.item.quantity} units`
        }
    } catch (err: any) {
        console.error(err)
        return { error: err.message || 'Failed to add consumable stock' }
    }
}
