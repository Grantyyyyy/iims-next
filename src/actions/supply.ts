'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

// Chemical Assignments (Supply Office)
export async function getChemicalAssignments() {
    await requirePermission('manage:chemicals')
    try {
        return await prisma.chemicalAssignment.findMany({
            include: {
                chemicalStock: {
                    include: { chemical: true }
                },
                assignee: true,
                room: true,
                processedBy: true
            },
            orderBy: { processedDate: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching chemical assignments:', error)
        return []
    }
}

export async function createChemicalAssignment(data: {
    chemicalStockId: number,
    assigneeId: number,
    assignedVolume: number,
    roomId?: number
}) {
    const { user } = await requirePermission('manage:chemicals')
    try {
        const stock = await prisma.chemicalStock.findUnique({
            where: { id: data.chemicalStockId }
        })

        if (!stock || stock.volume < data.assignedVolume) {
            return { error: 'Insufficient stock volume.' }
        }

        await prisma.chemicalAssignment.create({
            data: {
                ...data,
                remainingVolume: data.assignedVolume,
                processedDate: new Date(),
                processedById: user.id
            }
        })

        // Decrement volume from stock
        await prisma.chemicalStock.update({
            where: { id: data.chemicalStockId },
            data: {
                volume: {
                    decrement: data.assignedVolume
                }
            }
        })

        revalidatePath('/supply')
        return { success: true }
    } catch (error) {
        console.error('Error creating chemical assignment:', error)
        return { error: 'Failed to create assignment.' }
    }
}
