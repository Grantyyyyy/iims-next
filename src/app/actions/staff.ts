'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityItem = {
    id: string
    type: 'borrow' | 'lab-borrow' | 'chemical' | 'return' | 'lab-return'
    description: string
    date: Date
    icon: string
}

// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

async function requireStaffAuth() {
    const auth = await requireAuth()
    const isStaff = auth.roles.includes('STAFF')
    if (!isStaff) {
        redirect('/dashboard')
    }
    return auth
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function getStaffDashboardSummary() {
    const { user } = await requireStaffAuth()
    const userId = user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
        activeBorrows,
        activeLabBorrows,
        chemicalsReceived,
        overdueLabBorrows,
        recentBorrows,
        recentLabBorrows,
        recentChemicals,
        recentReturns,
        recentLabReturns,
    ] = await Promise.all([
        // Active secretary borrows
        prisma.borrowRecord.count({
            where: {
                borrowerId: userId,
                returnRecord: null,
            },
        }),

        // Active lab borrows
        prisma.labBorrowRecord.count({
            where: {
                borrowerId: userId,
                returnDate: null,
            },
        }),

        // Chemicals received via distribution
        prisma.chemicalUsageRecord.count({
            where: {
                recipientId: userId,
                isDistribution: true,
            },
        }),

        // Overdue lab borrows (have dueDate, not returned)
        prisma.labBorrowRecord.count({
            where: {
                borrowerId: userId,
                returnDate: null,
                dueDate: { lt: today },
            },
        }),

        // Recent borrow records (for activity)
        prisma.borrowRecord.findMany({
            where: { borrowerId: userId },
            include: {
                itemInstance: { include: { item: true } },
                returnRecord: true,
            },
            orderBy: { borrowDate: 'desc' },
            take: 10,
        }),

        // Recent lab borrow records (for activity)
        prisma.labBorrowRecord.findMany({
            where: { borrowerId: userId },
            include: {
                equipmentInstance: { include: { equipment: true } },
                apparatusInstance: { include: { apparatus: true } },
            },
            orderBy: { borrowDate: 'desc' },
            take: 10,
        }),

        // Recent chemical distributions received
        prisma.chemicalUsageRecord.findMany({
            where: { recipientId: userId, isDistribution: true },
            include: {
                chemicalBatch: { include: { chemical: true } },
            },
            orderBy: { dateUsed: 'desc' },
            take: 10,
        }),

        // Recent returns (returnRecords with associated borrowRecord)
        prisma.returnRecord.findMany({
            where: {
                borrowRecord: { borrowerId: userId },
            },
            include: {
                borrowRecord: {
                    include: { itemInstance: { include: { item: true } } },
                },
            },
            orderBy: { returnDate: 'desc' },
            take: 10,
        }),

        // Recent lab returns
        prisma.labReturnRecord.findMany({
            where: {
                labBorrowRecord: { borrowerId: userId },
            },
            include: {
                labBorrowRecord: {
                    include: {
                        equipmentInstance: { include: { equipment: true } },
                        apparatusInstance: { include: { apparatus: true } },
                    },
                },
            },
            orderBy: { returnDate: 'desc' },
            take: 10,
        }),
    ])

    // Build combined activity list
    const activities: ActivityItem[] = []

    for (const b of recentBorrows) {
        if (!b.returnRecord) {
            activities.push({
                id: `borrow-${b.id}`,
                type: 'borrow',
                description: `Borrowed ${b.itemInstance.item.name}${b.itemInstance.inventoryNumber ? ` (${b.itemInstance.inventoryNumber})` : ''}`,
                date: b.borrowDate,
                icon: '📦',
            })
        }
    }

    for (const lb of recentLabBorrows) {
        if (!lb.returnDate) {
            const name = lb.equipmentInstance?.equipment?.name || lb.apparatusInstance?.apparatus?.name || 'Lab Item'
            activities.push({
                id: `lab-borrow-${lb.id}`,
                type: 'lab-borrow',
                description: `Borrowed ${name}`,
                date: lb.borrowDate,
                icon: '🔬',
            })
        }
    }

    for (const chem of recentChemicals) {
        const name = chem.chemicalBatch?.chemical?.name || 'Chemical'
        const amount = chem.distributedAmount ?? chem.quantityRequested
        const unit = chem.distributedUnit ?? chem.unit ?? ''
        activities.push({
            id: `chem-${chem.id}`,
            type: 'chemical',
            description: `Received ${amount} ${unit} ${name}`,
            date: chem.dateUsed,
            icon: '🧪',
        })
    }

    for (const ret of recentReturns) {
        activities.push({
            id: `return-${ret.id}`,
            type: 'return',
            description: `Returned ${ret.borrowRecord.itemInstance.item.name}${ret.borrowRecord.itemInstance.inventoryNumber ? ` (${ret.borrowRecord.itemInstance.inventoryNumber})` : ''}`,
            date: ret.returnDate,
            icon: '✅',
        })
    }

    for (const lr of recentLabReturns) {
        const name = lr.labBorrowRecord?.equipmentInstance?.equipment?.name || lr.labBorrowRecord?.apparatusInstance?.apparatus?.name || 'Lab Item'
        activities.push({
            id: `lab-return-${lr.id}`,
            type: 'lab-return',
            description: `Returned ${name}`,
            date: lr.returnDate,
            icon: '✅',
        })
    }

    // Sort by date desc, take 10
    activities.sort((a, b) => b.date.getTime() - a.date.getTime())
    const recentActivity = activities.slice(0, 10)

    return {
        activeBorrows,
        activeLabBorrows,
        chemicalsReceived,
        overdueItems: overdueLabBorrows,
        recentActivity,
    }
}

// ---------------------------------------------------------------------------
// My Borrows
// ---------------------------------------------------------------------------

export async function getMyBorrows(filters: {
    search?: string
    status?: 'active' | 'returned' | 'overdue'
    dateFrom?: string
    dateTo?: string
    page?: number
}) {
    const { user } = await requireStaffAuth()
    const userId = user.id
    const page = Math.max(1, filters.page ?? 1)
    const pageSize = 15
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const where: any = { borrowerId: userId }

    // Status filter
    if (filters.status === 'active') {
        where.returnRecord = null
        // Active = not returned (dueDate >= today OR no duration)
    } else if (filters.status === 'returned') {
        where.returnRecord = { isNot: null }
    } else if (filters.status === 'overdue') {
        // overdue = not returned AND dueDate (borrowDate + duration) < today
        // We handle this post-query since BorrowRecord has no dueDate column
        where.returnRecord = null
        where.duration = { not: null }
    }

    // Date range (max 1 year)
    if (filters.dateFrom || filters.dateTo) {
        let from = filters.dateFrom ? new Date(filters.dateFrom) : undefined
        let to = filters.dateTo ? new Date(filters.dateTo) : undefined
        if (from && to) {
            const diff = Math.abs(to.getTime() - from.getTime())
            if (diff > 365 * 24 * 60 * 60 * 1000) {
                to = new Date(from)
                to.setFullYear(to.getFullYear() + 1)
            }
        }
        where.borrowDate = {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
        }
    }

    // Search by item name or inventory number
    if (filters.search) {
        where.itemInstance = {
            OR: [
                { item: { name: { contains: filters.search } } },
                { inventoryNumber: { contains: filters.search } },
            ],
        }
    }

    let records = await prisma.borrowRecord.findMany({
        where,
        include: {
            itemInstance: { include: { item: { include: { category: true } } } },
            room: true,
            returnRecord: true,
        },
        orderBy: { borrowDate: 'desc' },
    })

    // Filter overdue in-memory (borrowDate + duration < today, not returned)
    if (filters.status === 'overdue') {
        records = records.filter((r) => {
            if (r.returnRecord) return false
            if (!r.duration) return false
            const dueDate = new Date(r.borrowDate.getTime() + r.duration * 24 * 60 * 60 * 1000)
            return dueDate < today
        })
    }

    const total = records.length
    const pages = Math.ceil(total / pageSize)
    const paginated = records.slice((page - 1) * pageSize, page * pageSize)

    return { records: paginated, total, pages }
}

// ---------------------------------------------------------------------------
// My Lab Borrows
// ---------------------------------------------------------------------------

export async function getMyLabBorrows(filters: {
    search?: string
    status?: 'active' | 'returned' | 'overdue'
    type?: 'equipment' | 'apparatus'
    dateFrom?: string
    dateTo?: string
    page?: number
}) {
    const { user } = await requireStaffAuth()
    const userId = user.id
    const page = Math.max(1, filters.page ?? 1)
    const pageSize = 15
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const where: any = { borrowerId: userId }

    // Type filter
    if (filters.type === 'equipment') {
        where.equipmentInstanceId = { not: null }
        where.apparatusInstanceId = null
    } else if (filters.type === 'apparatus') {
        where.apparatusInstanceId = { not: null }
        where.equipmentInstanceId = null
    }

    // Status filter
    if (filters.status === 'active') {
        where.returnDate = null
    } else if (filters.status === 'returned') {
        where.returnDate = { not: null }
    } else if (filters.status === 'overdue') {
        where.returnDate = null
        where.dueDate = { lt: today }
    }

    // Date range (max 1 year)
    if (filters.dateFrom || filters.dateTo) {
        let from = filters.dateFrom ? new Date(filters.dateFrom) : undefined
        let to = filters.dateTo ? new Date(filters.dateTo) : undefined
        if (from && to) {
            const diff = Math.abs(to.getTime() - from.getTime())
            if (diff > 365 * 24 * 60 * 60 * 1000) {
                to = new Date(from)
                to.setFullYear(to.getFullYear() + 1)
            }
        }
        where.borrowDate = {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
        }
    }

    // Search
    if (filters.search) {
        where.OR = [
            { equipmentInstance: { equipment: { name: { contains: filters.search } } } },
            { equipmentInstance: { inventoryNumber: { contains: filters.search } } },
            { apparatusInstance: { apparatus: { name: { contains: filters.search } } } },
            { apparatusInstance: { inventoryNumber: { contains: filters.search } } },
        ]
    }

    const records = await prisma.labBorrowRecord.findMany({
        where,
        include: {
            equipmentInstance: {
                include: { equipment: { include: { category: true } } },
            },
            apparatusInstance: {
                include: { apparatus: { include: { category: true } } },
            },
            room: true,
        },
        orderBy: { borrowDate: 'desc' },
    })

    const total = records.length
    const pages = Math.ceil(total / pageSize)
    const paginated = records.slice((page - 1) * pageSize, page * pageSize)

    return { records: paginated, total, pages }
}

// ---------------------------------------------------------------------------
// My Chemicals
// ---------------------------------------------------------------------------

export async function getMyChemicals(filters: {
    search?: string
    subjectId?: number
    dateFrom?: string
    dateTo?: string
    page?: number
}) {
    const { user } = await requireStaffAuth()
    const userId = user.id
    const page = Math.max(1, filters.page ?? 1)
    const pageSize = 15

    const where: any = {
        recipientId: userId,
        isDistribution: true,
    }

    if (filters.search) {
        where.chemicalBatch = {
            chemical: { name: { contains: filters.search } },
        }
    }

    if (filters.subjectId) {
        where.subjectId = filters.subjectId
    }

    if (filters.dateFrom || filters.dateTo) {
        let from = filters.dateFrom ? new Date(filters.dateFrom) : undefined
        let to = filters.dateTo ? new Date(filters.dateTo) : undefined
        if (from && to) {
            const diff = Math.abs(to.getTime() - from.getTime())
            if (diff > 365 * 24 * 60 * 60 * 1000) {
                to = new Date(from)
                to.setFullYear(to.getFullYear() + 1)
            }
        }
        where.dateUsed = {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
        }
    }

    const [records, total] = await Promise.all([
        prisma.chemicalUsageRecord.findMany({
            where,
            include: {
                chemicalBatch: { include: { chemical: true } },
                subject: true,
                room: true,
                recordedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
            },
            orderBy: { dateUsed: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.chemicalUsageRecord.count({ where }),
    ])

    const pages = Math.ceil(total / pageSize)
    return { records, total, pages }
}

// ---------------------------------------------------------------------------
// My Profile — Update personal info
// ---------------------------------------------------------------------------

export async function updateStaffProfile(data: {
    firstName: string
    lastName: string
    email: string
}) {
    const { user } = await requireStaffAuth()
    const userId = user.id

    // Check email not taken by another user
    const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } },
    })
    if (existing) {
        return { error: 'This email is already in use' }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
            },
        })
        revalidatePath('/my/profile')
        return { success: true }
    } catch (err) {
        console.error('updateStaffProfile error:', err)
        return { error: 'Failed to update profile' }
    }
}

// ---------------------------------------------------------------------------
// My Profile — Change password
// ---------------------------------------------------------------------------

export async function updateStaffPassword(data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}) {
    const { user } = await requireStaffAuth()
    const userId = user.id

    if (data.newPassword !== data.confirmPassword) {
        return { error: 'Passwords do not match' }
    }
    if (data.newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters' }
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
    })
    if (!dbUser) return { error: 'User not found' }

    const match = await bcrypt.compare(data.currentPassword, dbUser.passwordHash)
    if (!match) {
        return { error: 'Current password is incorrect' }
    }

    const newHash = await bcrypt.hash(data.newPassword, 10)
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
    })

    return { success: true }
}

// ---------------------------------------------------------------------------
// Subjects list (for chemicals filter)
// ---------------------------------------------------------------------------

export async function getSubjects() {
    await requireAuth()
    return prisma.subject.findMany({ orderBy: { name: 'asc' } })
}
