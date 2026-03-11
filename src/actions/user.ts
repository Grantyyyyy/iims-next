'use server'

import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function getCurrentUser() {
    const session = await verifySession()
    if (!session?.userId) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
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
    const session = await verifySession()
    if (!session?.userId) return []

    try {
        const distributions = await prisma.chemicalUsageRecord.findMany({
            where: {
                recipientId: session.userId,
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
            amount: dist.distributedAmount || dist.quantityUsed,
            unit: dist.distributedUnit || dist.unit || 'ML',
            date: dist.dateUsed,
            purpose: dist.purpose || 'N/A'
        }))
    } catch (error) {
        console.error('Error fetching received chemicals:', error)
        return []
    }
}
