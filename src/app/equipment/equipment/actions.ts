'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

export async function getEquipment(filters?: {
    search?: string
    categoryId?: number
}) {
    await requirePermission('view:equipment')

    return await prisma.equipment.findMany({
        where: {
            deletedAt: null,
            ...(filters?.search && {
                OR: [
                    { name: { contains: filters.search } },
                    { model: { contains: filters.search } }
                ]
            }),
            ...(filters?.categoryId && { categoryId: filters.categoryId })
        },
        include: {
            category: true,
            instances: {
                where: { deletedAt: null }
            }
        },
        orderBy: { name: 'asc' }
    })
}

export async function getEquipmentWithInstances(id: number) {
    if (!id || isNaN(id)) return null
    await requirePermission('view:equipment')

    return await prisma.equipment.findUnique({
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
            }
        }
    })
}

export async function createEquipment(data: {
    name: string
    model?: string
    description?: string
    categoryId?: number
}) {
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.equipment.create({
            data: {
                name: data.name,
                model: data.model,
                description: data.description,
                categoryId: data.categoryId
            }
        })
        revalidatePath('/equipment/equipment')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to create equipment' }
    }
}

export async function updateEquipment(id: number, data: {
    name?: string
    model?: string
    description?: string
    categoryId?: number
}) {
    if (!id || isNaN(id)) return { success: false, error: 'Invalid ID' }
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.equipment.update({
            where: { id },
            data
        })
        revalidatePath('/equipment/equipment')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update equipment' }
    }
}

export async function deleteEquipment(id: number) {
    if (!id || isNaN(id)) return { success: false, error: 'Invalid ID' }
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.equipment.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
        revalidatePath('/equipment/equipment')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete equipment' }
    }
}

export async function addEquipmentInstance(data: {
    equipmentId: number
    inventoryNumber: string
    serialNumber?: string
    unitCost: number
    purchaseDate?: Date
    usefulLife?: number
}) {
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.equipmentInstance.create({
                data: {
                    equipmentId: data.equipmentId,
                    inventoryNumber: data.inventoryNumber,
                    serialNumber: data.serialNumber,
                    unitCost: data.unitCost,
                    purchaseDate: data.purchaseDate,
                    usefulLife: data.usefulLife,
                    currentCondition: 'Good'
                }
            })

            await tx.equipment.update({
                where: { id: data.equipmentId },
                data: { quantity: { increment: 1 } }
            })
        })

        revalidatePath('/equipment/equipment')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to add instance' }
    }
}

export async function getDeletedEquipment() {
    await requirePermission('view:equipment')

    return await prisma.equipment.findMany({
        where: {
            deletedAt: { not: null }
        },
        include: {
            category: true,
            instances: true
        },
        orderBy: { deletedAt: 'desc' }
    })
}

export async function restoreEquipment(id: number) {
    if (!id || isNaN(id)) return { success: false, error: 'Invalid ID' }
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.equipment.update({
            where: { id },
            data: { deletedAt: null }
        })
        revalidatePath('/equipment/equipment')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to restore equipment' }
    }
}

export async function permanentlyDeleteEquipment(id: number) {
    if (!id || isNaN(id)) return { success: false, error: 'Invalid ID' }
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Delete all instances first
            await tx.equipmentInstance.deleteMany({
                where: { equipmentId: id }
            })
            await tx.equipment.delete({
                where: { id }
            })
        })
        revalidatePath('/equipment/equipment')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to permanently delete equipment. It may have related records.' }
    }
}

