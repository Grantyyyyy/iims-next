'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

// Lab Categories
export async function getLabCategories() {
    await requirePermission('manage:equipment')
    try {
        return await prisma.labCategory.findMany({
            include: {
                _count: {
                    select: { equipments: true, apparatus: true }
                }
            },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        console.error('Error fetching lab categories:', error)
        return []
    }
}

export async function createLabCategory(name: string, imageUrl?: string) {
    await requirePermission('manage:equipment')
    try {
        await prisma.labCategory.create({
            data: { name, imageUrl }
        })
        revalidatePath('/labtech/categories')
        return { success: true }
    } catch (error) {
        console.error('Error creating lab category:', error)
        return { error: 'Failed to create lab category.' }
    }
}

// Lab Equipment
export async function getLabEquipment() {
    await requirePermission('manage:equipment')
    try {
        return await prisma.equipment.findMany({
            include: {
                category: true,
                instances: true
            },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching lab equipment:', error)
        return []
    }
}

// Apparatus
export async function getApparatus() {
    await requirePermission('manage:equipment')
    try {
        return await prisma.apparatus.findMany({
            include: {
                category: true,
                instances: true
            }
        })
    } catch (error) {
        console.error('Error fetching apparatus:', error)
        return []
    }
}

// Chemicals & Stock Tracking
export async function getChemicals() {
    await requirePermission('manage:chemicals')
    try {
        return await prisma.chemical.findMany({
            include: {
                stocks: {
                    include: {
                        _count: {
                            select: { chemicalUsages: true }
                        }
                    }
                }
            }
        })
    } catch (error) {
        console.error('Error fetching chemicals:', error)
        return []
    }
}

export async function addChemicalStock(data: {
    chemicalId: number,
    inventoryNumber: string,
    volume: number,
    price: number,
    purchaseDate?: Date,
    expiryDate?: Date
}) {
    await requirePermission('manage:chemicals')
    try {
        await prisma.chemicalStock.create({
            data
        })
        // Update aggregate volume in base Chemical model
        await prisma.chemical.update({
            where: { id: data.chemicalId },
            data: {
                volume: {
                    increment: data.volume
                }
            }
        })
        revalidatePath('/labtech/chemicals')
        return { success: true }
    } catch (error) {
        console.error('Error adding chemical stock:', error)
        return { error: 'Failed to add stock.' }
    }
}

export async function recordChemicalUsage(data: {
    requestedChemicalId: number, // ChemicalStock ID
    borrowerId: number,
    quantityUsed: number,
    purpose?: string,
    roomId?: number,
    subjectId?: number
}) {
    await requirePermission('use:chemicals')
    try {
        // Create usage record
        await prisma.chemicalUsage.create({
            data
        })

        // Decrement volume from specific stock
        const stock = await prisma.chemicalStock.update({
            where: { id: data.requestedChemicalId },
            data: {
                volume: {
                    decrement: data.quantityUsed
                }
            }
        })

        // Decrement volume from aggregate Chemical
        await prisma.chemical.update({
            where: { id: stock.chemicalId },
            data: {
                volume: {
                    decrement: data.quantityUsed
                }
            }
        })

        revalidatePath('/labtech/chemicals')
        return { success: true }
    } catch (error) {
        console.error('Error recording chemical usage:', error)
        return { error: 'Failed to record usage.' }
    }
}
