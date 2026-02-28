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
