'use server'

import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

export async function searchStaffUsers(query: string) {
    await requirePermission('view:equipment')

    return await prisma.user.findMany({
        where: {
            isActive: true,
            roles: {
                some: {
                    role: {
                        name: 'STAFF'
                    }
                }
            },
            OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { username: { contains: query } }
            ]
        },
        include: {
            department: true
        },
        take: 10
    })
}

export async function searchRooms(query: string, departmentId?: number) {
    await requirePermission('view:equipment')

    return await prisma.room.findMany({
        where: {
            ...(departmentId && { departmentId }),
            OR: [
                { name: { contains: query } },
                { location: { contains: query } }
            ]
        },
        include: {
            department: true
        },
        take: 10
    })
}

export async function getStaffActiveLabBorrows(userId: number) {
    await requirePermission('view:equipment')

    const borrows = await prisma.labBorrowRecord.findMany({
        where: {
            borrowerId: userId,
            returnDate: null
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
            }
        }
    })

    return { borrows }
}
