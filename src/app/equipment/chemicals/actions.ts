'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'
import { convertToBaseUnit, determineBaseUnit } from '@/lib/unit-conversion'

export async function getChemicals(filters?: {
    search?: string
}) {
    await requirePermission('view:chemicals')

    const chemicals = await prisma.chemical.findMany({
        where: {
            deletedAt: null,
            ...(filters?.search && {
                name: { contains: filters.search }
            })
        },
        include: {
            batches: {
                where: {
                    AND: [
                        { remainingVolume: { gt: 0 } },
                        {
                            OR: [
                                { expiryDate: null },
                                { expiryDate: { gt: new Date() } }
                            ]
                        }
                    ]
                }
            }
        },
        orderBy: { name: 'asc' }
    })

    return chemicals.map(chem => ({
        ...chem,
        status: chem.volume === 0 ? 'OUT_OF_STOCK' :
            chem.volume <= chem.reorderLevel ? 'LOW_STOCK' : 'OK'
    }))
}

export async function getChemicalWithBatches(id: number) {
    await requirePermission('view:chemicals')

    const chemical = await prisma.chemical.findUnique({
        where: { id },
        include: {
            batches: {
                include: {
                    addedBy: true
                },
                orderBy: { purchaseDate: 'asc' }
            }
        }
    })

    if (!chemical) return null

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const batchesWithStatus = chemical.batches.map(batch => {
        let status = 'ACTIVE'
        if (batch.remainingVolume === 0) status = 'EXHAUSTED'
        else if (batch.expiryDate && batch.expiryDate < now) status = 'EXPIRED'
        else if (batch.expiryDate && batch.expiryDate <= thirtyDaysFromNow) status = 'EXPIRING'

        return { ...batch, status }
    })

    return {
        ...chemical,
        batches: batchesWithStatus
    }
}

export async function createChemical(data: {
    name: string
    unit?: string
    description?: string
    reorderLevel: number
}) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.chemical.create({
            data: {
                name: data.name,
                unit: data.unit,
                description: data.description,
                reorderLevel: data.reorderLevel
            }
        })
        revalidatePath('/equipment/chemicals')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to create chemical' }
    }
}

export async function updateChemical(id: number, data: {
    name?: string
    unit?: string
    description?: string
    reorderLevel?: number
}) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.chemical.update({
            where: { id },
            data
        })
        revalidatePath('/equipment/chemicals')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update chemical' }
    }
}

export async function deleteChemical(id: number) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.chemical.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
        revalidatePath('/equipment/chemicals')
        revalidatePath('/equipment/bin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete chemical' }
    }
}

export async function restoreChemical(id: number) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.chemical.update({
            where: { id },
            data: { deletedAt: null }
        })
        revalidatePath('/equipment/chemicals')
        revalidatePath('/equipment/bin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to restore chemical' }
    }
}

export async function permanentlyDeleteChemical(id: number) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        // First delete all related batches and usage records if necessary, 
        // but Prisma schema might handle cascade if defined.
        // Looking at schema, ChemicalBatch relates to Chemical.
        // UsageRecord relates to ChemicalBatch.

        await prisma.chemical.delete({
            where: { id }
        })

        revalidatePath('/equipment/chemicals')
        revalidatePath('/equipment/bin')
        return { success: true }
    } catch (error) {
        console.error('Permanent delete error:', error)
        return { success: false, error: 'Failed to permanently delete chemical. It may have active records.' }
    }
}

export async function getDeletedChemicals() {
    await requirePermission('view:chemicals')

    try {
        return await prisma.chemical.findMany({
            where: {
                deletedAt: { not: null }
            },
            orderBy: { deletedAt: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching deleted chemicals:', error)
        return []
    }
}

export async function addChemicalBatch(data: {
    chemicalId: number
    originalVolume: number
    unit: string
    unitCost: number
    purchaseDate?: Date
    expiryDate: Date
    inventoryNumber: string
    notes?: string
    userId: number
}) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Get the chemical to determine its base unit
            const chemical = await tx.chemical.findUnique({
                where: { id: data.chemicalId },
                select: { unit: true }
            })

            if (!chemical) {
                throw new Error('Chemical not found')
            }

            const originalUnit = data.unit
            const baseUnit = determineBaseUnit(chemical.unit || 'ML')
            const remainingVolume = convertToBaseUnit(data.originalVolume, originalUnit)

            const count = await tx.chemicalBatch.count({
                where: { chemicalId: data.chemicalId }
            })

            const batchNumber = `CHEM-${data.chemicalId}-${String(count + 1).padStart(3, '0')}`

            await tx.chemicalBatch.create({
                data: {
                    chemicalId: data.chemicalId,
                    batchNumber,
                    originalVolume: data.originalVolume,
                    originalUnit,
                    remainingVolume,
                    baseUnit,
                    unitCost: data.unitCost,
                    purchaseDate: data.purchaseDate,
                    expiryDate: data.expiryDate,
                    inventoryNumber: data.inventoryNumber,
                    notes: data.notes,
                    addedById: data.userId
                }
            })

            // Recalculate total volume (non-expired only)
            const nonExpiredBatches = await tx.chemicalBatch.findMany({
                where: {
                    chemicalId: data.chemicalId,
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gt: new Date() } }
                    ]
                }
            })

            const totalVolume = nonExpiredBatches.reduce((sum, b) => sum + b.remainingVolume, 0)

            await tx.chemical.update({
                where: { id: data.chemicalId },
                data: { volume: totalVolume }
            })
        })

        revalidatePath('/equipment/chemicals')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to add batch' }
    }
}

export async function recordChemicalUsage(data: {
    chemicalId: number
    quantityUsed: number
    unit?: string
    subjectId?: number
    roomId?: number
    purpose?: string
    usedById?: number
    recordedById: number
}) {
    const { roles } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Get non-expired batches ordered by purchase date (FIFO)
            const batches = await tx.chemicalBatch.findMany({
                where: {
                    chemicalId: data.chemicalId,
                    remainingVolume: { gt: 0 },
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gt: new Date() } }
                    ]
                },
                orderBy: { purchaseDate: 'asc' }
            })

            // Calculate total available
            const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

            if (totalAvailable < data.quantityUsed) {
                throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${data.quantityUsed}`)
            }

            // FIFO deduction
            let remaining = data.quantityUsed
            for (const batch of batches) {
                if (remaining <= 0) break

                const deduct = Math.min(batch.remainingVolume, remaining)

                // Create usage record
                await tx.chemicalUsageRecord.create({
                    data: {
                        chemicalBatchId: batch.id,
                        quantityUsed: deduct,
                        quantityRequested: data.quantityUsed,
                        unit: data.unit,
                        subjectId: data.subjectId,
                        roomId: data.roomId,
                        purpose: data.purpose,
                        usedById: data.usedById,
                        recordedById: data.recordedById
                    }
                })

                // Update batch
                await tx.chemicalBatch.update({
                    where: { id: batch.id },
                    data: { remainingVolume: batch.remainingVolume - deduct }
                })

                remaining -= deduct
            }

            // Recalculate chemical total volume (non-expired only)
            const updatedBatches = await tx.chemicalBatch.findMany({
                where: {
                    chemicalId: data.chemicalId,
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gt: new Date() } }
                    ]
                }
            })

            const totalVolume = updatedBatches.reduce((sum, b) => sum + b.remainingVolume, 0)

            await tx.chemical.update({
                where: { id: data.chemicalId },
                data: { volume: totalVolume }
            })
        })

        revalidatePath('/equipment/chemicals')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to record usage' }
    }
}

export async function getChemicalAlerts() {
    await requirePermission('view:chemicals')

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [expiredBatches, expiringSoonBatches, lowStockChemicals] = await Promise.all([
        prisma.chemicalBatch.count({
            where: {
                expiryDate: { lte: now },
                remainingVolume: { gt: 0 }
            }
        }),
        prisma.chemicalBatch.count({
            where: {
                expiryDate: {
                    gte: now,
                    lte: thirtyDaysFromNow
                },
                remainingVolume: { gt: 0 }
            }
        }),
        prisma.chemical.count({
            where: {
                deletedAt: null,
                volume: { lte: prisma.chemical.fields.reorderLevel }
            }
        })
    ])

    return {
        expired: expiredBatches,
        expiringSoon: expiringSoonBatches,
        lowStock: lowStockChemicals
    }
}
