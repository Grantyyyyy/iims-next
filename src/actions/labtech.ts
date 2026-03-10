'use server'

import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { Prisma } from '@prisma/client'

export type LabInstanceFilter = {
    search?: string
    type?: 'Equipment' | 'Apparatus'
    condition?: string
    status?: 'Available' | 'Borrowed' | 'Overdue'
    categoryId?: number
    page?: number
    pageSize?: number
}

export type LabInstanceView = {
    id: string
    dbId: number
    type: 'Equipment' | 'Apparatus'
    name: string
    inventoryNumber: string
    serialNumber: string | null
    condition: string
    status: 'Available' | 'Borrowed' | 'Overdue'
    category: string | null
    purchaseDate: Date | null
    usefulLife: number | null
    isPastUsefulLife: boolean
    currentBorrower: string | null
    dueDate: Date | null
}

const normalizeEquipment = (eq: any): LabInstanceView => {
    const activeBorrow = eq.labBorrowRecords.find((r: any) => !r.returnDate)
    const isOverdue = activeBorrow && activeBorrow.dueDate && new Date(activeBorrow.dueDate) < new Date()

    const status: 'Available' | 'Borrowed' | 'Overdue' = isOverdue
        ? 'Overdue'
        : (activeBorrow ? 'Borrowed' : 'Available')

    const purchaseDate = eq.purchaseDate ? new Date(eq.purchaseDate) : null
    const usefulLife = eq.usefulLife || 0
    const isPastUsefulLife = purchaseDate && usefulLife > 0
        ? new Date(purchaseDate.setFullYear(purchaseDate.getFullYear() + usefulLife)) < new Date()
        : false

    return {
        id: `EQ-${eq.id}`,
        dbId: eq.id,
        type: 'Equipment',
        name: eq.equipment.name,
        inventoryNumber: eq.inventoryNumber,
        serialNumber: eq.serialNumber,
        condition: eq.currentCondition || 'Good',
        status,
        category: eq.equipment.category?.name || null,
        purchaseDate: eq.purchaseDate,
        usefulLife: eq.usefulLife,
        isPastUsefulLife,
        currentBorrower: activeBorrow ? (activeBorrow.borrower ? `${activeBorrow.borrower.firstName} ${activeBorrow.borrower.lastName}` : activeBorrow.studentName) : null,
        dueDate: activeBorrow?.dueDate || null
    }
}

const normalizeApparatus = (ap: any): LabInstanceView => {
    const activeBorrow = ap.labBorrowRecords.find((r: any) => !r.returnDate)
    const isOverdue = activeBorrow && activeBorrow.dueDate && new Date(activeBorrow.dueDate) < new Date()

    const status: 'Available' | 'Borrowed' | 'Overdue' = isOverdue
        ? 'Overdue'
        : (activeBorrow ? 'Borrowed' : 'Available')

    const purchaseDate = ap.purchaseDate ? new Date(ap.purchaseDate) : null
    const usefulLife = ap.usefulLife || 0
    const isPastUsefulLife = purchaseDate && usefulLife > 0
        ? new Date(purchaseDate.setFullYear(purchaseDate.getFullYear() + usefulLife)) < new Date()
        : false

    return {
        id: `AP-${ap.id}`,
        dbId: ap.id,
        type: 'Apparatus',
        name: ap.apparatus.name,
        inventoryNumber: ap.inventoryNumber,
        serialNumber: ap.serialNumber,
        condition: ap.currentCondition || 'Good',
        status,
        category: ap.apparatus.category?.name || null,
        purchaseDate: ap.purchaseDate,
        usefulLife: ap.usefulLife,
        isPastUsefulLife,
        currentBorrower: activeBorrow ? (activeBorrow.borrower ? `${activeBorrow.borrower.firstName} ${activeBorrow.borrower.lastName}` : activeBorrow.studentName) : null,
        dueDate: activeBorrow?.dueDate || null
    }
}

export async function getAllLabInstances(filters: LabInstanceFilter) {
    await requirePermission('manage:equipment')

    const {
        search,
        type,
        condition,
        status,
        categoryId,
        page = 1,
        pageSize = 20
    } = filters

    // Fetch both types
    const fetchEquipment = !type || type === 'Equipment'
    const fetchApparatus = !type || type === 'Apparatus'

    let equipment: LabInstanceView[] = []
    let apparatus: LabInstanceView[] = []

    if (fetchEquipment) {
        const eqInstances = await prisma.equipmentInstance.findMany({
            where: {
                deletedAt: null,
                equipment: {
                    ...(categoryId ? { categoryId: Number(categoryId) } : {})
                }
            },
            include: {
                equipment: {
                    include: { category: true }
                },
                labBorrowRecords: {
                    where: { returnDate: null },
                    include: { borrower: true }
                }
            }
        })
        equipment = eqInstances.map(normalizeEquipment)
    }

    if (fetchApparatus) {
        const apInstances = await prisma.apparatusInstance.findMany({
            where: {
                deletedAt: null,
                apparatus: {
                    ...(categoryId ? { categoryId: Number(categoryId) } : {})
                }
            },
            include: {
                apparatus: {
                    include: { category: true }
                },
                labBorrowRecords: {
                    where: { returnDate: null },
                    include: { borrower: true }
                }
            }
        })
        apparatus = apInstances.map(normalizeApparatus)
    }

    // Combine and sort
    let combined = [...equipment, ...apparatus]

    // Apply filters in memory for better cross-type handling
    if (search) {
        const s = search.toLowerCase()
        combined = combined.filter(inst =>
            inst.name.toLowerCase().includes(s) ||
            inst.inventoryNumber.toLowerCase().includes(s) ||
            (inst.serialNumber && inst.serialNumber.toLowerCase().includes(s))
        )
    }

    if (condition) {
        combined = combined.filter(inst => inst.condition.toLowerCase() === condition.toLowerCase())
    }

    if (status) {
        combined = combined.filter(inst => inst.status === status)
    }

    // Sorting
    combined.sort((a, b) => a.name.localeCompare(b.name))

    const total = combined.length
    const paginated = combined.slice((page - 1) * pageSize, page * pageSize)

    // Summary counts (always based on the whole filtered set BEFORE pagination, but respecting filters like category)
    // Actually usually stats are based on TOTAL available, so we re-calculate from full filtered set
    const stats = {
        total: combined.length,
        available: combined.filter(i => i.status === 'Available').length,
        borrowed: combined.filter(i => i.status === 'Borrowed' || i.status === 'Overdue').length,
        damaged: combined.filter(i => ['Damaged', 'Poor'].includes(i.condition)).length
    }

    return {
        instances: paginated,
        total,
        pages: Math.ceil(total / pageSize),
        stats
    }
}

export async function getLabInstancesCSV(filters: Omit<LabInstanceFilter, 'page' | 'pageSize'>) {
    const result = await getAllLabInstances({ ...filters, page: 1, pageSize: 10000 })
    return result.instances
}
