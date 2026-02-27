'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Transfer Requests
export async function getTransferRequests() {
    try {
        return await prisma.transferRequest.findMany({
            include: {
                itemInstance: { include: { item: true } },
                requestedBy: true,
                newAssignee: true,
                newLocation: true,
                processedBy: true
            },
            orderBy: { requestedDate: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching transfer requests:', error)
        return []
    }
}

export async function createTransferRequest(data: {
    itemInstanceId: number,
    requestedById: number,
    newAssigneeId: number,
    newLocationId: number,
    transferReason?: string
}) {
    try {
        await prisma.transferRequest.create({
            data: {
                ...data,
                status: 'PENDING'
            }
        })
        revalidatePath('/staff')
        return { success: true }
    } catch (error) {
        console.error('Error creating transfer request:', error)
        return { error: 'Failed to submit transfer request.' }
    }
}

// Replace Requests
export async function getReplaceRequests() {
    try {
        return await prisma.replaceRequest.findMany({
            include: {
                itemInstance: { include: { item: true } },
                requestedBy: true,
                replacementItem: { include: { item: true } },
                processedBy: true
            },
            orderBy: { requestedDate: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching replace requests:', error)
        return []
    }
}

// Dispose Requests
export async function getDisposeRequests() {
    try {
        return await prisma.disposeRequest.findMany({
            include: {
                itemInstance: { include: { item: true } },
                requestedBy: true,
                processedBy: true
            },
            orderBy: { requestedDate: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching dispose requests:', error)
        return []
    }
}

export async function processRequest(type: 'transfer' | 'replace' | 'dispose', id: number, status: 'APPROVED' | 'REJECTED') {
    try {
        const userId = 1 // Placeholder
        const processedDate = new Date()

        if (type === 'transfer') {
            const request = await prisma.transferRequest.update({
                where: { id },
                data: { status, processedDate, processedById: userId },
                include: { itemInstance: true }
            })

            // If approved, update the item instance assignee/location logic could go here
            // But usually this requires a final confirmation from the new assignee
        } else if (type === 'replace') {
            await prisma.replaceRequest.update({
                where: { id },
                data: { status, processedDate, processedById: userId }
            })
        } else if (type === 'dispose') {
            await prisma.disposeRequest.update({
                where: { id },
                data: { status, processedDate, processedById: userId }
            })
        }

        revalidatePath('/staff')
        return { success: true }
    } catch (error) {
        console.error(`Error processing ${type} request:`, error)
        return { error: 'Failed to process request.' }
    }
}
