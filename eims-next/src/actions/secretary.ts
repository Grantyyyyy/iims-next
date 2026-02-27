'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Categories
export async function getCategories() {
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
    try {
        return await prisma.item.findMany({
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

export async function createItem(data: {
    name: string,
    description?: string,
    model?: string,
    itemType: string,
    categoryId: number
}) {
    try {
        await prisma.item.create({
            data
        })
        revalidatePath('/secretary/items')
        return { success: true }
    } catch (error) {
        console.error('Error creating item:', error)
        return { error: 'Failed to create item.' }
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
export async function getBorrowRecords() {
    try {
        return await prisma.borrowRecord.findMany({
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
