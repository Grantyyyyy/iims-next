'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

export async function getLabBorrowRecords(filters?: {
    search?: string
    status?: string
    borrowerType?: string
    dateFrom?: Date
    dateTo?: Date
}) {
    await requirePermission('manage:equipment')
    
    const now = new Date()
    
    return await prisma.labBorrowRecord.findMany({
        where: {
            ...(filters?.search && {
                OR: [
                    { borrower: { username: { contains: filters.search } } },
                    { studentName: { contains: filters.search } },
                    { equipmentInstance: { inventoryNumber: { contains: filters.search } } },
                    { apparatusInstance: { inventoryNumber: { contains: filters.search } } }
                ]
            }),
            ...(filters?.status === 'BORROWED' && { returnDate: null }),
            ...(filters?.status === 'RETURNED' && { returnDate: { not: null } }),
            ...(filters?.status === 'OVERDUE' && {
                returnDate: null,
                dueDate: { lt: now }
            }),
            ...(filters?.borrowerType === 'STAFF' && { borrowerId: { not: null } }),
            ...(filters?.borrowerType === 'STUDENT' && { borrowerId: null }),
            ...(filters?.dateFrom && { borrowDate: { gte: filters.dateFrom } }),
            ...(filters?.dateTo && { borrowDate: { lte: filters.dateTo } })
        },
        include: {
            equipmentInstance: {
                include: {
                    equipment: true
                }
            },
            apparatusInstance: {
                include: {
                    apparatus: true
                }
            },
            borrower: true,
            room: true,
            returnRecord: true
        },
        orderBy: { borrowDate: 'desc' }
    })
}

export async function createLabBorrowRecord(data: {
    equipmentInstanceId?: number
    apparatusInstanceId?: number
    borrowerId?: number
    studentName?: string
    studentCourse?: string
    studentYearLevel?: string
    roomId?: number
    purpose?: string
    dueDate?: Date
}) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.$transaction(async (tx) => {
            // Check instance availability
            if (data.equipmentInstanceId) {
                const existing = await tx.labBorrowRecord.findFirst({
                    where: {
                        equipmentInstanceId: data.equipmentInstanceId,
                        returnDate: null
                    }
                })
                if (existing) {
                    throw new Error('Equipment instance is already borrowed')
                }
            }
            
            if (data.apparatusInstanceId) {
                const existing = await tx.labBorrowRecord.findFirst({
                    where: {
                        apparatusInstanceId: data.apparatusInstanceId,
                        returnDate: null
                    }
                })
                if (existing) {
                    throw new Error('Apparatus instance is already borrowed')
                }
            }
            
            // Get previous borrower
            let previousBorrowerId = null
            if (data.equipmentInstanceId) {
                const lastBorrow = await tx.labBorrowRecord.findFirst({
                    where: {
                        equipmentInstanceId: data.equipmentInstanceId,
                        returnDate: { not: null }
                    },
                    orderBy: { returnDate: 'desc' }
                })
                previousBorrowerId = lastBorrow?.borrowerId || null
            } else if (data.apparatusInstanceId) {
                const lastBorrow = await tx.labBorrowRecord.findFirst({
                    where: {
                        apparatusInstanceId: data.apparatusInstanceId,
                        returnDate: { not: null }
                    },
                    orderBy: { returnDate: 'desc' }
                })
                previousBorrowerId = lastBorrow?.borrowerId || null
            }
            
            await tx.labBorrowRecord.create({
                data: {
                    equipmentInstanceId: data.equipmentInstanceId,
                    apparatusInstanceId: data.apparatusInstanceId,
                    borrowerId: data.borrowerId,
                    studentName: data.studentName,
                    studentCourse: data.studentCourse,
                    studentYearLevel: data.studentYearLevel,
                    roomId: data.roomId,
                    purpose: data.purpose,
                    dueDate: data.dueDate,
                    previousBorrowerId
                }
            })
        })
        
        revalidatePath('/labtech/borrow')
        revalidatePath('/labtech/records')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create borrow record' }
    }
}

export async function processLabReturn(borrowRecordId: number, data: {
    conditionOnReturn: string
    notes?: string
}) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.$transaction(async (tx) => {
            const borrowRecord = await tx.labBorrowRecord.findUnique({
                where: { id: borrowRecordId },
                include: {
                    equipmentInstance: true,
                    apparatusInstance: true
                }
            })
            
            if (!borrowRecord) {
                throw new Error('Borrow record not found')
            }
            
            if (borrowRecord.returnDate) {
                throw new Error('Item already returned')
            }
            
            // Create return record
            await tx.labReturnRecord.create({
                data: {
                    labBorrowRecordId: borrowRecordId,
                    conditionOnReturn: data.conditionOnReturn,
                    notes: data.notes
                }
            })
            
            // Update borrow record
            await tx.labBorrowRecord.update({
                where: { id: borrowRecordId },
                data: { returnDate: new Date() }
            })
            
            // Update instance condition
            if (borrowRecord.equipmentInstanceId) {
                await tx.equipmentInstance.update({
                    where: { id: borrowRecord.equipmentInstanceId },
                    data: { currentCondition: data.conditionOnReturn }
                })
            } else if (borrowRecord.apparatusInstanceId) {
                await tx.apparatusInstance.update({
                    where: { id: borrowRecord.apparatusInstanceId },
                    data: { currentCondition: data.conditionOnReturn }
                })
            }
        })
        
        revalidatePath('/labtech/records')
        revalidatePath('/labtech/equipment')
        revalidatePath('/labtech/apparatus')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to process return' }
    }
}

export async function getChemicalUsageRecords(filters?: {
    search?: string
    dateFrom?: Date
    dateTo?: Date
}) {
    await requirePermission('manage:chemicals')
    
    return await prisma.chemicalUsageRecord.findMany({
        where: {
            ...(filters?.search && {
                OR: [
                    { chemicalBatch: { chemical: { name: { contains: filters.search } } } },
                    { usedBy: { username: { contains: filters.search } } }
                ]
            }),
            ...(filters?.dateFrom && { dateUsed: { gte: filters.dateFrom } }),
            ...(filters?.dateTo && { dateUsed: { lte: filters.dateTo } })
        },
        include: {
            chemicalBatch: {
                include: {
                    chemical: true
                }
            },
            usedBy: true,
            subject: true,
            room: true,
            recordedBy: true
        },
        orderBy: { dateUsed: 'desc' }
    })
}

export async function getDistributionRecords(filters?: {
    search?: string
    dateFrom?: Date
    dateTo?: Date
}) {
    await requirePermission('manage:chemicals')
    
    return await (prisma.chemicalUsageRecord as any).findMany({
        where: {
            isDistribution: true,
            ...(filters?.search && {
                OR: [
                    { chemicalBatch: { chemical: { name: { contains: filters.search } } } },
                    { recipient: { 
                        OR: [
                            { username: { contains: filters.search } },
                            { firstName: { contains: filters.search } },
                            { lastName: { contains: filters.search } }
                        ]
                    }}
                ]
            }),
            ...(filters?.dateFrom && { dateUsed: { gte: filters.dateFrom } }),
            ...(filters?.dateTo && { dateUsed: { lte: filters.dateTo } })
        },
        include: {
            chemicalBatch: {
                include: {
                    chemical: true
                }
            },
            recipient: true,
            subject: true,
            room: true,
            recordedBy: true
        },
        orderBy: { dateUsed: 'desc' }
    })
}
