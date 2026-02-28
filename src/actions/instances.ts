'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'
import { Prisma } from '@prisma/client'

export type InstanceFilter = {
    search?: string
    condition?: 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
    status?: 'available' | 'borrowed'
    categoryId?: number
    page?: number
    pageSize?: number
}

export async function getAllInstances(filters: InstanceFilter) {
    await requirePermission('manage:items')

    const {
        search,
        condition,
        status,
        categoryId,
        page = 1,
        pageSize = 20
    } = filters

    const skip = (page - 1) * pageSize

    // Base where clause: Non-consumable items that are not deleted
    const baseWhere: Prisma.ItemInstanceWhereInput = {
        item: {
            itemType: 'Non-Consumables',
            deletedAt: null,
            ...(categoryId ? { categoryId: Number(categoryId) } : {})
        }
    }

    // Search filter
    const searchWhere: Prisma.ItemInstanceWhereInput = search ? {
        OR: [
            { item: { name: { contains: search } } },
            { inventoryNumber: { contains: search } },
            { serialNumber: { contains: search } }
        ]
    } : {}

    // Condition filter: Map incoming uppercase filter to DB sentence case
    const conditionMap: Record<string, string> = {
        'GOOD': 'Good',
        'FAIR': 'Fair',
        'POOR': 'Poor',
        'DAMAGED': 'Damaged'
    }

    const dbCondition = condition ? conditionMap[condition.toUpperCase()] || condition : undefined

    const conditionWhere: Prisma.ItemInstanceWhereInput = dbCondition ? {
        currentCondition: dbCondition
    } : {}

    // Status filter
    let statusWhere: Prisma.ItemInstanceWhereInput = {}
    if (status === 'available') {
        statusWhere = {
            borrowRecords: {
                none: {
                    returnRecord: null
                }
            }
        }
    } else if (status === 'borrowed') {
        statusWhere = {
            borrowRecords: {
                some: {
                    returnRecord: null
                }
            }
        }
    }

    const finalWhere: Prisma.ItemInstanceWhereInput = {
        AND: [baseWhere, searchWhere, conditionWhere, statusWhere]
    }

    const [instances, total] = await Promise.all([
        prisma.itemInstance.findMany({
            where: finalWhere,
            include: {
                item: {
                    include: { category: true }
                },
                borrowRecords: {
                    where: { returnRecord: null },
                    include: { borrower: true },
                    take: 1
                }
            },
            orderBy: [
                { item: { name: 'asc' } },
                { inventoryNumber: 'asc' }
            ],
            skip,
            take: pageSize
        }),
        prisma.itemInstance.count({ where: finalWhere })
    ])

    // Summary counts (always global context but respect category filter)
    const summaryWhere: Prisma.ItemInstanceWhereInput = {
        item: {
            itemType: 'Non-Consumables',
            deletedAt: null,
            ...(categoryId ? { categoryId: Number(categoryId) } : {})
        }
    }

    const [totalCount, borrowedCount, damagedCount] = await Promise.all([
        prisma.itemInstance.count({ where: summaryWhere }),
        prisma.itemInstance.count({
            where: {
                ...summaryWhere,
                borrowRecords: {
                    some: { returnRecord: null }
                }
            }
        }),
        prisma.itemInstance.count({
            where: {
                ...summaryWhere,
                currentCondition: { in: ['Damaged', 'Poor', 'DAMAGED', 'POOR', 'damaged', 'poor'] }
            }
        })
    ])

    const availableCount = totalCount - borrowedCount

    return {
        instances,
        total,
        pages: Math.ceil(total / pageSize),
        summaryCounts: {
            total: totalCount,
            available: availableCount,
            borrowed: borrowedCount,
            damaged: damagedCount
        }
    }
}

export async function getInstancesCSV(filters: Omit<InstanceFilter, 'page' | 'pageSize'>) {
    await requirePermission('manage:items')

    const {
        search,
        condition,
        status,
        categoryId
    } = filters

    const baseWhere: Prisma.ItemInstanceWhereInput = {
        item: {
            itemType: 'Non-Consumables',
            deletedAt: null,
            ...(categoryId ? { categoryId: Number(categoryId) } : {})
        }
    }

    const searchWhere: Prisma.ItemInstanceWhereInput = search ? {
        OR: [
            { item: { name: { contains: search } } },
            { inventoryNumber: { contains: search } },
            { serialNumber: { contains: search } }
        ]
    } : {}

    // Condition filter: Map incoming uppercase filter to DB sentence case
    const conditionMap: Record<string, string> = {
        'GOOD': 'Good',
        'FAIR': 'Fair',
        'POOR': 'Poor',
        'DAMAGED': 'Damaged'
    }

    const dbCondition = condition ? conditionMap[condition.toUpperCase()] || condition : undefined

    const conditionWhere: Prisma.ItemInstanceWhereInput = dbCondition ? {
        currentCondition: dbCondition
    } : {}

    let statusWhere: Prisma.ItemInstanceWhereInput = {}
    if (status === 'available') {
        statusWhere = {
            borrowRecords: {
                none: {
                    returnRecord: null
                }
            }
        }
    } else if (status === 'borrowed') {
        statusWhere = {
            borrowRecords: {
                some: {
                    returnRecord: null
                }
            }
        }
    }

    const finalWhere: Prisma.ItemInstanceWhereInput = {
        AND: [baseWhere, searchWhere, conditionWhere, statusWhere]
    }

    const instances = await prisma.itemInstance.findMany({
        where: finalWhere,
        include: {
            item: {
                include: { category: true }
            },
            borrowRecords: {
                where: { returnRecord: null },
                include: { borrower: true },
                take: 1
            }
        },
        orderBy: [
            { item: { name: 'asc' } },
            { inventoryNumber: 'asc' }
        ]
    })

    return instances
}
