'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

export async function getApparatus(filters?: {
    search?: string
    categoryId?: number
    type?: string
}) {
    await requirePermission('manage:equipment')
    
    return await prisma.apparatus.findMany({
        where: {
            deletedAt: null,
            ...(filters?.search && {
                OR: [
                    { name: { contains: filters.search } }
                ]
            }),
            ...(filters?.categoryId && { categoryId: filters.categoryId }),
            ...(filters?.type && { apparatusType: filters.type })
        },
        include: {
            category: true,
            instances: {
                where: { deletedAt: null }
            },
            batches: true
        },
        orderBy: { name: 'asc' }
    })
}

export async function getApparatusWithDetails(id: number) {
    await requirePermission('manage:equipment')
    
    return await prisma.apparatus.findUnique({
        where: { id },
        include: {
            category: true,
            instances: {
                where: { deletedAt: null },
                include: {
                    labBorrowRecords: {
                        where: { returnDate: null },
                        include: {
                            borrower: true,
                            room: true
                        }
                    }
                },
                orderBy: { inventoryNumber: 'asc' }
            },
            batches: {
                include: {
                    addedBy: true
                },
                orderBy: { purchaseDate: 'asc' }
            }
        }
    })
}

export async function createApparatus(data: {
    name: string
    apparatusType: string
    description?: string
    categoryId?: number
}) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.apparatus.create({
            data: {
                name: data.name,
                apparatusType: data.apparatusType,
                description: data.description,
                categoryId: data.categoryId
            }
        })
        revalidatePath('/labtech/apparatus')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to create apparatus' }
    }
}

export async function updateApparatus(id: number, data: {
    name?: string
    apparatusType?: string
    description?: string
    categoryId?: number
}) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.apparatus.update({
            where: { id },
            data
        })
        revalidatePath('/labtech/apparatus')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update apparatus' }
    }
}

export async function deleteApparatus(id: number) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.apparatus.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
        revalidatePath('/labtech/apparatus')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete apparatus' }
    }
}

export async function addApparatusInstance(data: {
    apparatusId: number
    inventoryNumber: string
    serialNumber?: string
    unitCost: number
    purchaseDate?: Date
    usefulLife?: number
}) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.$transaction(async (tx) => {
            await tx.apparatusInstance.create({
                data: {
                    apparatusId: data.apparatusId,
                    inventoryNumber: data.inventoryNumber,
                    serialNumber: data.serialNumber,
                    unitCost: data.unitCost,
                    purchaseDate: data.purchaseDate,
                    usefulLife: data.usefulLife,
                    currentCondition: 'Good'
                }
            })
            
            await tx.apparatus.update({
                where: { id: data.apparatusId },
                data: { quantity: { increment: 1 } }
            })
        })
        
        revalidatePath('/labtech/apparatus')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to add instance' }
    }
}

export async function addApparatusBatch(data: {
    apparatusId: number
    originalQty: number
    unitCost: number
    purchaseDate?: Date
    notes?: string
    userId: number
}) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.$transaction(async (tx) => {
            const count = await tx.apparatusBatch.count({
                where: { apparatusId: data.apparatusId }
            })
            
            const batchNumber = `APP-${data.apparatusId}-${String(count + 1).padStart(3, '0')}`
            
            await tx.apparatusBatch.create({
                data: {
                    apparatusId: data.apparatusId,
                    batchNumber,
                    originalQty: data.originalQty,
                    remainingQty: data.originalQty,
                    unitCost: data.unitCost,
                    purchaseDate: data.purchaseDate,
                    notes: data.notes,
                    addedById: data.userId
                }
            })
            
            await tx.apparatus.update({
                where: { id: data.apparatusId },
                data: { quantity: { increment: data.originalQty } }
            })
        })
        
        revalidatePath('/labtech/apparatus')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to add batch' }
    }
}
