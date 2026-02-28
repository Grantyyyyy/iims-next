'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission, requireAuth } from '@/lib/permissions'

// Categories
export async function getCategories() {
    await requireAuth()
    try {
        return await prisma.category.findMany({
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        console.error('Error fetching categories:', error)
        return []
    }
}

export async function createCategory(name: string, imageUrl?: string) {
    await requirePermission('manage:items')
    try {
        await prisma.category.create({
            data: { name, imageUrl }
        })
        revalidatePath('/secretary/categories')
        return { success: true }
    } catch (error) {
        console.error('Error creating category:', error)
        return { error: 'Failed to create category.' }
    }
}

// Items
export async function getItems() {
    await requireAuth()
    try {
        return await prisma.item.findMany({
            where: { deletedAt: null },
            include: {
                category: true,
                instances: true
            },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching items:', error)
        return []
    }
}

export async function getItemDetails(itemId: number) {
    await requireAuth()
    try {
        return await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                category: true,
                instances: {
                    include: {
                        consumableBatches: {
                            orderBy: { addedAt: 'asc' }
                        },
                        distributionRecords: {
                            include: { recipient: true },
                            orderBy: { distributedAt: 'desc' }
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

export async function createItem(data: {
    name: string,
    description?: string,
    model?: string,
    itemType: string,
    categoryId: number
}) {
    await requirePermission('manage:items')
    try {
        await prisma.item.create({ data })
        revalidatePath('/secretary/items')
        return { success: true }
    } catch (error) {
        console.error('Error creating item:', error)
        return { error: 'Failed to create item.' }
    }
}

export async function updateItem(id: number, data: {
    name: string,
    description?: string,
    model?: string,
    itemType: string,
    categoryId: number
}) {
    await requirePermission('manage:items')
    try {
        await prisma.item.update({ where: { id }, data })
        revalidatePath('/secretary/items')
        revalidatePath(`/secretary/items/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating item:', error)
        return { error: 'Failed to update item.' }
    }
}

export async function deleteItem(id: number) {
    await requirePermission('manage:items')
    try {
        await prisma.item.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
        revalidatePath('/secretary/items')
        return { success: true }
    } catch (error) {
        console.error('Error soft-deleting item:', error)
        return { error: 'Failed to delete item.' }
    }
}

// Item Instances & Inventory
export async function addItemInstance(data: {
    itemId: number,
    unitCost: number,
    quantity: number,
    purchaseDate?: Date,
    serialNumber?: string,
    inventoryNumber?: string,
    currentCondition?: string
}) {
    await requirePermission('manage:items')
    try {
        await prisma.itemInstance.create({
            data
        })
        // Also update total quantity in the Item model
        await prisma.item.update({
            where: { id: data.itemId },
            data: {
                quantity: {
                    increment: data.quantity
                }
            }
        })
        revalidatePath('/secretary/items')
        return { success: true }
    } catch (error) {
        console.error('Error adding item instance:', error)
        return { error: 'Failed to add item instance.' }
    }
}

// Borrowing Records
export async function getBorrowRecords(filters?: {
    borrowerName?: string
    dateFrom?: Date
    dateTo?: Date
    status?: string // 'Active' | 'Returned' | 'All'
}) {
    await requirePermission('manage:items')
    try {
        const whereClause: any = {}

        if (filters?.borrowerName) {
            whereClause.borrower = {
                OR: [
                    { firstName: { contains: filters.borrowerName } },
                    { lastName: { contains: filters.borrowerName } }
                ]
            }
        }

        if (filters?.dateFrom || filters?.dateTo) {
            let from = filters.dateFrom
            let to = filters.dateTo

            // Limit date range to 1 year max
            if (from && to) {
                const diffTime = Math.abs(to.getTime() - from.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (diffDays > 365) {
                    // Cap the range to 1 year from the start date
                    to = new Date(from)
                    to.setFullYear(to.getFullYear() + 1)
                }
            }

            whereClause.borrowDate = {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
            }
        }

        if (filters?.status && filters.status !== 'All') {
            if (filters.status === 'Active') {
                whereClause.returnRecord = null
            } else if (filters.status === 'Returned') {
                whereClause.returnRecord = { isNot: null }
            }
        }

        return await prisma.borrowRecord.findMany({
            where: whereClause,
            include: {
                itemInstance: {
                    include: { item: true }
                },
                borrower: true,
                room: true,
                returnRecord: true
            },
            orderBy: { borrowDate: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching borrow records:', error)
        return []
    }
}
// Returning Items
export async function returnItem(borrowRecordId: number, conditionOnReturn: string, notes?: string) {
    await requirePermission('manage:items')
    try {
        const borrowRecord = await prisma.borrowRecord.findUnique({
            where: { id: borrowRecordId },
            include: { itemInstance: true }
        })

        if (!borrowRecord) return { error: 'Record not found.' }

        await prisma.returnRecord.create({
            data: {
                borrowRecordId,
                conditionOnReturn,
                notes,
                itemInstanceId: borrowRecord.itemInstanceId
            }
        })

        // Also update the item instance condition if it changed
        if (conditionOnReturn && conditionOnReturn !== borrowRecord.itemInstance.currentCondition) {
            await prisma.itemInstance.update({
                where: { id: borrowRecord.itemInstanceId },
                data: { currentCondition: conditionOnReturn }
            })
        }

        revalidatePath('/secretary/records')
        return { success: true }
    } catch (error) {
        console.error('Error returning item:', error)
        return { error: 'Failed to process return.' }
    }
}

// Distribution Records
export async function getDistributionRecords(filters?: {
    recipientName?: string
    dateFrom?: Date
    dateTo?: Date
}) {
    await requirePermission('manage:items')
    try {
        const whereClause: any = {}

        if (filters?.recipientName) {
            whereClause.recipient = {
                OR: [
                    { firstName: { contains: filters.recipientName } },
                    { lastName: { contains: filters.recipientName } }
                ]
            }
        }

        if (filters?.dateFrom || filters?.dateTo) {
            let from = filters.dateFrom
            let to = filters.dateTo

            // Limit date range to 1 year max
            if (from && to) {
                const diffTime = Math.abs(to.getTime() - from.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (diffDays > 365) {
                    to = new Date(from)
                    to.setFullYear(to.getFullYear() + 1)
                }
            }

            whereClause.distributedAt = {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
            }
        }

        return await prisma.distributionRecord.findMany({
            where: whereClause,
            include: {
                itemInstance: {
                    include: { item: true }
                },
                recipient: true,
                distributedBy: true,
                room: true,
                batch: true
            },
            orderBy: { distributedAt: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching distribution records:', error)
        return []
    }
}
