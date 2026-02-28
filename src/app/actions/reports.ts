'use server'

import prisma from '@/lib/prisma'
import { requirePermission, getUserPrimaryRole } from '@/lib/permissions'
import { startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns'

export type DamagedItemRow = {
    id: number
    unitCost: number
    quantity: number
    itemName: string
    description?: string
    serialNumber?: string
    inventoryNumber: string
    currentCondition: string
    purchaseDate?: Date | null
    lastBorrowRecord?: {
        borrowerName: string
        returnDate?: Date | null
        roomName?: string
    } | null
}

export async function getReportSummary() {
    await requirePermission('view:reports')

    const now = new Date()
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(now.getFullYear() + 1)

    try {
        const [
            activeBorrows,
            damagedItems,
            lowStockItems,
            nearingEndOfLife
        ] = await Promise.all([
            // Total Active Borrows
            prisma.borrowRecord.count({
                where: { returnRecord: null }
            }),
            // Damaged Items
            prisma.itemInstance.count({
                where: {
                    currentCondition: { in: ['DAMAGED', 'POOR', 'Damaged', 'Poor'] }
                }
            }),
            // Low Stock Alerts (Consumables below 50% or Chemicals below reorderLevel)
            // Simplified for now: count categories/items that have some low stock batches
            prisma.item.count({
                where: {
                    itemType: 'Consumables',
                    instances: {
                        some: {
                            quantity: { lte: 10 } // Placeholder threshold, usually logic would be more complex
                        }
                    }
                }
            }),
            // Items Nearing End of Life
            // Logic: purchaseDate + usefulLife years <= 1 year from now
            // SQLite doesn't have easy date math in Prisma, so we'll fetch and filter if needed or use a raw query if it's too many
            // For now, let's look for items with usefulLife where completion date is within next year
            prisma.itemInstance.count({
                where: {
                    usefulLife: { not: null },
                    purchaseDate: { not: null }
                }
            })
        ])

        // Refined count for nearingEndOfLife since it's hard to do in Prisma/SQLite directly with math
        // This is a small optimization for the summary card
        const itemsWithLife = await prisma.itemInstance.findMany({
            where: {
                usefulLife: { not: null, gt: 0 },
                purchaseDate: { not: null }
            },
            select: { purchaseDate: true, usefulLife: true }
        })

        const refinedEndOfLifeCount = itemsWithLife.filter(item => {
            if (!item.purchaseDate || !item.usefulLife) return false
            const endOfLifeDate = new Date(item.purchaseDate)
            endOfLifeDate.setFullYear(endOfLifeDate.getFullYear() + item.usefulLife)
            return endOfLifeDate <= oneYearFromNow
        }).length

        // Refined Low Stock count
        const chemicals = await prisma.chemical.findMany({
            where: {
                volume: { lte: prisma.chemical.fields.reorderLevel as any }
            }
        })
        const consumables = await prisma.item.findMany({
             where: { itemType: 'Consumables' },
             include: { instances: true }
        })
        const lowConsumables = consumables.filter(c => {
            const total = c.instances.reduce((sum, i) => sum + i.quantity, 0)
            return total <= 10 // Example threshold
        }).length

        return {
            activeBorrows,
            damagedItems,
            lowStockAlerts: lowConsumables + chemicals.length,
            nearingEndOfLife: refinedEndOfLifeCount
        }
    } catch (error) {
        console.error('Error fetching report summary:', error)
        return {
            activeBorrows: 0,
            damagedItems: 0,
            lowStockAlerts: 0,
            nearingEndOfLife: 0
        }
    }
}

export async function getDamagedItems(filters: {
    search?: string
    categoryId?: string | number
    valueFilter?: 'high' | 'low' | null
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
}) {
    const { roles } = await requirePermission('view:reports')
    const primaryRole = getUserPrimaryRole(roles)

    const page = filters.page || 1
    const pageSize = filters.pageSize || 10
    const skip = (page - 1) * pageSize

    const where: any = {
        currentCondition: { in: ['DAMAGED', 'POOR', 'Damaged', 'Poor'] }
    }

    // Role-based filtering
    if (primaryRole === 'SECRETARY') {
        where.item = { itemType: 'Non-Consumables' } // Secretary usually manages these
    } else if (primaryRole === 'LABTECH') {
        // Labtech manages records that might be in different models (Apparatus, Equipment)
        // But the task asks for ItemInstance report specifically.
        // If there's a distinction in Category, we should apply it here.
    }

    if (filters.search) {
        where.OR = [
            { item: { name: { contains: filters.search } } },
            { serialNumber: { contains: filters.search } },
            { inventoryNumber: { contains: filters.search } }
        ]
    }

    if (filters.categoryId) {
        where.item = { ...where.item, categoryId: Number(filters.categoryId) }
    }

    if (filters.valueFilter === 'high') {
        where.unitCost = { gte: 5000 }
    } else if (filters.valueFilter === 'low') {
        where.unitCost = { lt: 5000 }
    }

    if (filters.startDate || filters.endDate) {
        where.purchaseDate = {}
        if (filters.startDate) where.purchaseDate.gte = startOfDay(new Date(filters.startDate))
        if (filters.endDate) where.purchaseDate.lte = endOfDay(new Date(filters.endDate))
    }

    try {
        const [items, total] = await Promise.all([
            prisma.itemInstance.findMany({
                where,
                include: {
                    item: { include: { category: true } },
                    borrowRecords: {
                        orderBy: { borrowDate: 'desc' },
                        take: 1,
                        include: { borrower: true, room: true }
                    }
                },
                orderBy: { purchaseDate: 'desc' },
                skip,
                take: pageSize
            }),
            prisma.itemInstance.count({ where })
        ])

        const formattedItems: DamagedItemRow[] = items.map(i => ({
            id: i.id,
            unitCost: i.unitCost,
            quantity: i.quantity,
            itemName: i.item.name,
            description: i.item.description || undefined,
            serialNumber: i.serialNumber || undefined,
            inventoryNumber: i.inventoryNumber || 'N/A',
            currentCondition: i.currentCondition || 'Unknown',
            purchaseDate: i.purchaseDate,
            lastBorrowRecord: i.borrowRecords[0] ? {
                borrowerName: i.borrowRecords[0].borrower?.firstName + ' ' + i.borrowRecords[0].borrower?.lastName,
                returnDate: i.borrowRecords[0].returnDate,
                roomName: i.borrowRecords[0].room?.name || undefined
            } : null
        }))

        return {
            items: formattedItems,
            total,
            pages: Math.ceil(total / pageSize)
        }
    } catch (error) {
        console.error('Error fetching damaged items:', error)
        return { items: [], total: 0, pages: 0 }
    }
}

export async function getLowStockItems() {
    await requirePermission('view:reports')

    try {
        // Consumables logic
        const consumableItems = await prisma.item.findMany({
            where: {
                itemType: 'Consumables',
                deletedAt: null
            },
            include: {
                category: true,
                instances: true
            }
        })

        // Chemical logic
        const chemicals = await prisma.chemical.findMany({
            where: {
                volume: { lte: prisma.chemical.fields.reorderLevel as any }
            }
        })

        const lowStock = consumableItems
            .map(item => {
                const remainingQty = item.instances.reduce((sum, i) => sum + i.quantity, 0)
                const threshold = 10 // Default threshold for items
                return {
                    name: item.name,
                    category: item.category?.name || 'Uncategorized',
                    remainingQty,
                    threshold,
                    type: 'Consumable'
                }
            })
            .filter(item => item.remainingQty <= item.threshold)

        const lowChemicals = chemicals.map(c => ({
            name: c.name,
            category: 'Chemical',
            remainingQty: c.volume,
            threshold: c.reorderLevel,
            type: 'Chemical'
        }))

        return [...lowStock, ...lowChemicals]
    } catch (error) {
        console.error('Error fetching low stock items:', error)
        return []
    }
}

export async function getBorrowTrends(period: '30d' | '3m' | '6m' | '1y') {
    await requirePermission('view:reports')

    let startDate = subDays(new Date(), 30)
    if (period === '3m') startDate = subMonths(new Date(), 3)
    if (period === '6m') startDate = subMonths(new Date(), 6)
    if (period === '1y') startDate = subMonths(new Date(), 12)

    try {
        const borrows = await prisma.borrowRecord.findMany({
            where: { borrowDate: { gte: startDate } },
            select: { borrowDate: true }
        })

        const returns = await prisma.borrowRecord.findMany({
            where: { returnDate: { gte: startDate } },
            select: { returnDate: true }
        })

        // Group by date
        const dataMap: Record<string, { date: string, borrows: number, returns: number }> = {}

        // Initialize dates
        let curr = new Date(startDate)
        const end = new Date()
        while (curr <= end) {
            const dateStr = format(curr, 'yyyy-MM-dd')
            dataMap[dateStr] = { date: dateStr, borrows: 0, returns: 0 }
            curr.setDate(curr.getDate() + 1)
        }

        borrows.forEach(b => {
            const d = format(b.borrowDate, 'yyyy-MM-dd')
            if (dataMap[d]) dataMap[d].borrows++
        })

        returns.forEach(r => {
            if (r.returnDate) {
                const d = format(r.returnDate, 'yyyy-MM-dd')
                if (dataMap[d]) dataMap[d].returns++
            }
        })

        return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
        console.error('Error fetching borrow trends:', error)
        return []
    }
}

export async function getItemsNearingEndOfLife() {
    await requirePermission('view:reports')
    
    const now = new Date()
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(now.getFullYear() + 1)

    try {
        const itemsWithLife = await prisma.itemInstance.findMany({
            where: {
                usefulLife: { not: null, gt: 0 },
                purchaseDate: { not: null }
            },
            include: { item: true }
        })

        return itemsWithLife.filter(item => {
            if (!item.purchaseDate || !item.usefulLife) return false
            const endOfLifeDate = new Date(item.purchaseDate)
            endOfLifeDate.setFullYear(endOfLifeDate.getFullYear() + item.usefulLife)
            // Filter: end of life is between now and 1 year from now
            return endOfLifeDate >= now && endOfLifeDate <= oneYearFromNow
        })
    } catch (error) {
        console.error('Error fetching end of life items:', error)
        return []
    }
}
