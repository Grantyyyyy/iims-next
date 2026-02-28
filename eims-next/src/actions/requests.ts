'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission, requireAuth } from '@/lib/permissions'

// Transfer Requests
export async function getTransferRequests() {
    await requireAuth()
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
    newAssigneeId: number,
    newLocationId: number,
    transferReason?: string
}) {
    const { user } = await requirePermission('submit:requests')
    try {
        await prisma.transferRequest.create({
            data: {
                ...data,
                requestedById: user.id,
                status: 'AWAITING_ASSIGNEE_CONFIRMATION'
            }
        })
        revalidatePath('/staff')
        revalidatePath('/staff/requests')
        return { success: true }
    } catch (error) {
        console.error('Error creating transfer request:', error)
        return { error: 'Failed to submit transfer request.' }
    }
}

// Assignee responds to transfer request (accept/reject)
export async function respondToTransfer(id: number, accepted: boolean) {
    const { user } = await requireAuth()
    try {
        const request = await prisma.transferRequest.findUnique({
            where: { id },
        })

        if (!request) return { error: 'Request not found.' }

        // Only the new assignee can respond
        if (request.newAssigneeId !== user.id) {
            return { error: 'You are not authorized to respond to this request.' }
        }

        if (request.status !== 'AWAITING_ASSIGNEE_CONFIRMATION') {
            return { error: 'This request is no longer awaiting confirmation.' }
        }

        await prisma.transferRequest.update({
            where: { id },
            data: {
                status: accepted ? 'PENDING' : 'ASSIGNEE_REJECTED',
            }
        })

        revalidatePath('/staff')
        revalidatePath('/staff/requests')
        return { success: true }
    } catch (error) {
        console.error('Error responding to transfer:', error)
        return { error: 'Failed to respond to transfer request.' }
    }
}

// Replace Requests
export async function getReplaceRequests() {
    await requireAuth()
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

export async function createReplaceRequest(data: {
    itemInstanceId: number,
    replacementReason?: string,
    replacementItemId?: number,
}) {
    const { user } = await requirePermission('submit:requests')
    try {
        await prisma.replaceRequest.create({
            data: {
                ...data,
                requestedById: user.id,
                status: 'PENDING'
            }
        })
        revalidatePath('/staff')
        revalidatePath('/staff/requests')
        return { success: true }
    } catch (error) {
        console.error('Error creating replace request:', error)
        return { error: 'Failed to submit replace request.' }
    }
}

// Dispose Requests
export async function getDisposeRequests() {
    await requireAuth()
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

export async function createDisposeRequest(data: {
    itemInstanceId: number,
    disposalReason?: string,
}) {
    const { user } = await requirePermission('submit:requests')
    try {
        await prisma.disposeRequest.create({
            data: {
                ...data,
                requestedById: user.id,
                status: 'PENDING'
            }
        })
        revalidatePath('/staff')
        revalidatePath('/staff/requests')
        return { success: true }
    } catch (error) {
        console.error('Error creating dispose request:', error)
        return { error: 'Failed to submit dispose request.' }
    }
}

// Process request — ADMIN only
export async function processRequest(type: 'transfer' | 'replace' | 'dispose', id: number, status: 'APPROVED' | 'REJECTED') {
    const { user } = await requirePermission('approve:requests')
    try {
        const processedDate = new Date()

        if (type === 'transfer') {
            await prisma.transferRequest.update({
                where: { id },
                data: { status, processedDate, processedById: user.id },
            })
        } else if (type === 'replace') {
            await prisma.replaceRequest.update({
                where: { id },
                data: { status, processedDate, processedById: user.id }
            })
        } else if (type === 'dispose') {
            await prisma.disposeRequest.update({
                where: { id },
                data: { status, processedDate, processedById: user.id }
            })
        }

        revalidatePath('/staff')
        revalidatePath('/staff/requests')
        return { success: true }
    } catch (error) {
        console.error(`Error processing ${type} request:`, error)
        return { error: 'Failed to process request.' }
    }
}
