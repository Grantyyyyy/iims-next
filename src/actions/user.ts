'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'

export async function getCurrentUser() {
    const { user: authUser, roles } = await requireAuth()

    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                profilePicUrl: true,
                roles: {
                    include: { role: true }
                }
            }
        })
        return user
    } catch (error) {
        console.error('Error fetching current user:', error)
        return null
    }
}

export async function getReceivedChemicals(limit: number = 10) {
    const { user } = await requireAuth()

    try {
        const distributions = await prisma.chemicalUsageRecord.findMany({
            where: {
                recipientId: user.id,
                isDistribution: true
            },
            orderBy: {
                dateUsed: 'desc'
            },
            take: limit,
            include: {
                chemicalBatch: {
                    include: {
                        chemical: true
                    }
                }
            }
        })

        return distributions.map((dist) => ({
            id: dist.id,
            chemicalName: dist.chemicalBatch?.chemical?.name || 'Unknown',
            amount: dist.distributedAmount ?? dist.quantityUsed,
            unit: dist.distributedUnit ?? dist.unit ?? 'ML',
            date: dist.dateUsed,
            purpose: dist.purpose || 'N/A'
        }))
    } catch (error) {
        console.error('Error fetching received chemicals:', error)
        return []
    }
}
