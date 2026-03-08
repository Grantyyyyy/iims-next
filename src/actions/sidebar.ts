'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'

export async function getBinCounts() {
    const { roles } = await requireAuth()

    const counts = {
        secretary: 0,
        labtech: 0
    }

    if (roles.includes('ADMIN') || roles.includes('SECRETARY')) {
        counts.secretary = await prisma.item.count({
            where: { deletedAt: { not: null } }
        })
    }

    if (roles.includes('ADMIN') || roles.includes('LABTECH')) {
        const [equipmentCount, apparatusCount, chemicalCount] = await Promise.all([
            prisma.equipment.count({ where: { deletedAt: { not: null } } }),
            prisma.apparatus.count({ where: { deletedAt: { not: null } } }),
            prisma.chemical.count({ where: { deletedAt: { not: null } } })
        ])
        counts.labtech = equipmentCount + apparatusCount + chemicalCount
    }

    return counts
}
