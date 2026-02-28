'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'

export async function getDashboardStats() {
    await requireAuth()
    try {
        const [
            totalUsers,
            totalItems,
            totalEquipment,
            totalChemicals,
            totalBorrowRecords,
            pendingTransfers,
            pendingReplaces,
            pendingDisposals,
            totalDepartments,
            totalCategories,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.item.count(),
            prisma.equipment.count(),
            prisma.chemical.count(),
            prisma.borrowRecord.count(),
            prisma.transferRequest.count({ where: { status: 'PENDING' } }),
            prisma.replaceRequest.count({ where: { status: 'PENDING' } }),
            prisma.disposeRequest.count({ where: { status: 'PENDING' } }),
            prisma.department.count(),
            prisma.category.count(),
        ])

        const recentBorrows = await prisma.borrowRecord.findMany({
            take: 5,
            orderBy: { borrowDate: 'desc' },
            include: {
                itemInstance: { include: { item: true } },
                borrower: true,
                returnRecord: true,
            }
        })

        return {
            totalUsers,
            totalItems,
            totalEquipment,
            totalChemicals,
            totalBorrowRecords,
            pendingTransfers,
            pendingReplaces,
            pendingDisposals,
            pendingRequests: pendingTransfers + pendingReplaces + pendingDisposals,
            totalDepartments,
            totalCategories,
            recentBorrows,
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return {
            totalUsers: 0,
            totalItems: 0,
            totalEquipment: 0,
            totalChemicals: 0,
            totalBorrowRecords: 0,
            pendingTransfers: 0,
            pendingReplaces: 0,
            pendingDisposals: 0,
            pendingRequests: 0,
            totalDepartments: 0,
            totalCategories: 0,
            recentBorrows: [],
        }
    }
}
