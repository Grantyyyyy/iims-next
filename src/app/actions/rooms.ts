'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const roomSchema = z.object({
    name: z.string().min(1, 'Room name is required'),
    location: z.string().min(1, 'Location is required'),
    departmentId: z.coerce.number().min(1, 'Department is required'),
})

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function getRooms() {
    await requirePermission('view:rooms')

    return await prisma.room.findMany({
        include: {
            department: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export async function createRoom(formData: FormData) {
    const { roles } = await requirePermission('manage:rooms')

    if (roles.includes('DEAN')) {
        return { error: { root: ['Dean role does not have permission to perform this action.'] } }
    }

    const rawData = Object.fromEntries(formData.entries())
    const validated = roomSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        await prisma.room.create({
            data: validated.data
        })

        revalidatePath('/dashboard/rooms')
        return { success: true }
    } catch (err) {
        console.error('Create room error:', err)
        return { error: { root: ['Failed to create room'] } }
    }
}

export async function updateRoom(id: number, formData: FormData) {
    const { roles } = await requirePermission('manage:rooms')

    if (roles.includes('DEAN')) {
        return { error: { root: ['Dean role does not have permission to perform this action.'] } }
    }

    const rawData = Object.fromEntries(formData.entries())
    const validated = roomSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    try {
        await prisma.room.update({
            where: { id },
            data: validated.data
        })

        revalidatePath('/dashboard/rooms')
        return { success: true }
    } catch (err) {
        console.error('Update room error:', err)
        return { error: { root: ['Failed to update room'] } }
    }
}

export async function deleteRoom(id: number) {
    const { roles } = await requirePermission('manage:rooms')

    if (roles.includes('DEAN')) {
        return { error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        // Check if room has any dependencies (as defined in schema)
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        distributionRecords: true,
                        borrowRecords: true,
                        equipmentAssignments: true,
                    }
                }
            }
        })

        if (!room) {
            return { error: 'Room not found' }
        }

        const dependencyCount = room._count.distributionRecords + room._count.borrowRecords + room._count.equipmentAssignments
        if (dependencyCount > 0) {
            return { error: 'Cannot delete room with existing records or assignments' }
        }

        await prisma.room.delete({
            where: { id }
        })

        revalidatePath('/dashboard/rooms')
        return { success: true }
    } catch (err) {
        console.error('Delete room error:', err)
        return { error: 'Failed to delete room' }
    }
}
